/**
 * Realtime WebSocket Handler
 *
 * Registers a single WebSocket route at `/ws` on the HyperExpress server.
 * Authenticates the connection using the same `auth_id` session cookie used
 * by HTTP middlewares, then accepts subscribe/unsubscribe commands from
 * the client over the open socket.
 *
 * Wire format (client → server):
 *   { "action": "subscribe",   "topic": "project:abc" }
 *   { "action": "unsubscribe", "topic": "project:abc" }
 *   { "action": "ping" }
 *
 * Wire format (server → client):
 *   - Topic events (published via @services/Realtime):
 *       { "type": "task.moved", "topic": "project:abc", "payload": {...}, "ts": 123 }
 *   - Control:
 *       { "type": "ready",        "payload": { "userId": "..." } }
 *       { "type": "subscribed",   "payload": { "topic": "..." } }
 *       { "type": "unsubscribed", "payload": { "topic": "..." } }
 *       { "type": "error",        "payload": { "message": "..." } }
 *       { "type": "pong" }
 */

import type HyperExpress from "hyper-express";
import type { Websocket } from "hyper-express/types/components/ws/Websocket";
import { Session, ProjectMember, WorkspaceMember } from "@models";
import Logger from "@services/Logger";
import Realtime from "@services/Realtime";

interface UpgradeContext {
  user_id: string;
  email: string;
  [key: string]: string;
}

/**
 * Local helper alias — hyper-express's Websocket type extends a TypedEmitter
 * whose declaration package isn't installed at runtime, so TypeScript can't
 * see the inherited `on()`. We narrow to the methods we actually use.
 */
type WSocket = Websocket<UpgradeContext> & {
  on(event: "message", listener: (raw: string) => void): WSocket;
  on(event: "close", listener: (...args: unknown[]) => void): WSocket;
  on(event: "drain" | "ping" | "pong", listener: (...args: unknown[]) => void): WSocket;
};

interface ClientMessage {
  action?: string;
  topic?: string;
}

const VALID_TOPIC_PREFIXES = ["workspace:", "project:", "user:"] as const;

/**
 * Parse `cookie` HTTP header into a name/value map. We can't trust
 * `request.cookies` here because hyper-express's request object is consumed
 * during upgrade and may already be detached.
 */
function parseCookieHeader(header: string | undefined | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

/**
 * Validate that the caller is allowed to subscribe to the requested topic.
 *
 * - `user:<id>` → only the owning user.
 * - `workspace:<id>` → must be a workspace member.
 * - `project:<id>` → must be a project member or part of the linked workspace.
 */
async function canAccessTopic(topic: string, userId: string): Promise<boolean> {
  if (!VALID_TOPIC_PREFIXES.some((p) => topic.startsWith(p))) return false;

  if (topic.startsWith("user:")) {
    return topic === `user:${userId}`;
  }

  if (topic.startsWith("workspace:")) {
    const workspaceId = topic.slice("workspace:".length);
    if (!workspaceId) return false;
    return WorkspaceMember.isMember(workspaceId, userId);
  }

  if (topic.startsWith("project:")) {
    const projectId = topic.slice("project:".length);
    if (!projectId) return false;
    return ProjectMember.canAccessProject(projectId, userId);
  }

  return false;
}

/**
 * Send a JSON message safely over a websocket (drops if socket closed).
 */
function sendJson(ws: WSocket, payload: Record<string, unknown>): void {
  if (ws.closed) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch (err) {
    Logger.debug("WS send failed", { err: (err as Error).message });
  }
}

/**
 * Register the realtime WebSocket route on the given server. Must be called
 * after the server is created but before `listen()` so the route is bound.
 */
export function registerRealtime(server: HyperExpress.Server): void {
  // Cache realtime publisher with the server instance so controllers can
  // call Realtime.publish() without knowing about the server.
  Realtime.init(server);

  // Step 1 — Upgrade handler: authenticate and stash user context.
  server.upgrade("/ws", async (request, response) => {
    try {
      const cookieHeader =
        (request.headers as Record<string, string | undefined>)["cookie"] ?? "";
      const cookies = parseCookieHeader(cookieHeader);
      const authId = cookies["auth_id"];

      if (!authId) {
        return response.status(401).send("Unauthorized");
      }

      const user = await Session.getUserBySessionId(authId);
      if (!user) {
        return response.status(401).send("Unauthorized");
      }

      // Stash minimal info as upgrade context. Values must be strings — uWS
      // serialises this through the upgrade pipeline.
      response.upgrade({
        user_id: user.id,
        email: user.email,
      });
    } catch (err) {
      Logger.error("WS upgrade failed", err as Error);
      try {
        response.status(500).send("WebSocket upgrade error");
      } catch {
        // ignore — response may already be detached
      }
    }
  });

  // Step 2 — Connection handler: route subscribe/unsubscribe commands and
  // forward published messages to subscribers via uWS topic pub/sub.
  server.ws<UpgradeContext>(
    "/ws",
    {
      idle_timeout: 60, // seconds, double the default to be friendly to mobile
      max_payload_length: 16 * 1024,
      message_type: "String",
    },
    (rawWs) => {
      const ws = rawWs as WSocket;
      const ctx = ws.context as UpgradeContext;
      const userId = ctx?.user_id;

      // Every authenticated socket is automatically subscribed to its
      // own user channel — used for direct notifications.
      if (userId) {
        ws.subscribe(`user:${userId}`);
        sendJson(ws, { type: "ready", payload: { userId } });
      } else {
        // Should never happen after upgrade auth, but defend anyway.
        sendJson(ws, { type: "error", payload: { message: "Unauthenticated" } });
        ws.close(4401, "Unauthenticated");
        return;
      }

      ws.on("message", async (raw: string) => {
        let msg: ClientMessage;
        try {
          msg = JSON.parse(raw);
        } catch {
          sendJson(ws, { type: "error", payload: { message: "Invalid JSON" } });
          return;
        }

        const action = msg.action;

        if (action === "ping") {
          sendJson(ws, { type: "pong" });
          return;
        }

        if (action === "subscribe" || action === "unsubscribe") {
          const topic = typeof msg.topic === "string" ? msg.topic : "";
          if (!topic) {
            sendJson(ws, {
              type: "error",
              payload: { message: "topic required" },
            });
            return;
          }

          if (action === "subscribe") {
            const allowed = await canAccessTopic(topic, userId);
            if (!allowed) {
              sendJson(ws, {
                type: "error",
                payload: { message: "Forbidden topic", topic },
              });
              return;
            }
            ws.subscribe(topic);
            sendJson(ws, { type: "subscribed", payload: { topic } });
            return;
          }

          // unsubscribe — always allowed
          ws.unsubscribe(topic);
          sendJson(ws, { type: "unsubscribed", payload: { topic } });
          return;
        }

        sendJson(ws, {
          type: "error",
          payload: { message: `Unknown action: ${action}` },
        });
      });

      ws.on("close", () => {
        // uWS auto-cleans subscriptions on close — nothing to do.
      });
    }
  );
}

export default registerRealtime;
