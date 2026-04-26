/**
 * Realtime Service
 *
 * Thin pub/sub wrapper around the underlying uWebSockets pub/sub from
 * hyper-express. Lets controllers publish typed events to topic-based
 * channels which connected WebSocket clients can subscribe to.
 *
 * Usage:
 *   import Realtime from "@services/Realtime";
 *   Realtime.publish(Realtime.topics.project(projectId), "task.moved", { task });
 *
 * Topics convention:
 *   workspace:<id>   - Chat messages, member events
 *   project:<id>     - Task created/moved/deleted/log/comment
 *   user:<id>        - User-specific notifications
 */

import type HyperExpress from "hyper-express";
import Logger from "./Logger";

export type RealtimePayload = Record<string, unknown> | unknown[] | null;

export interface RealtimeMessage {
  /**
   * Event type, e.g. `chat.message`, `task.moved`.
   * Consumed by frontend dispatcher.
   */
  type: string;
  /**
   * Topic this event belongs to (echoed back to clients for routing).
   */
  topic: string;
  /**
   * Arbitrary JSON-safe payload.
   */
  payload: RealtimePayload;
  /**
   * Server timestamp in ms.
   */
  ts: number;
}

class RealtimeService {
  private server: HyperExpress.Server | null = null;

  /**
   * Topic builders. Keep one place to enforce consistent naming.
   */
  readonly topics = {
    workspace: (workspaceId: string) => `workspace:${workspaceId}`,
    project: (projectId: string) => `project:${projectId}`,
    user: (userId: string) => `user:${userId}`,
  } as const;

  /**
   * Initialise with the HyperExpress server instance. Must be called once
   * during application bootstrap before any publish() call.
   */
  init(server: HyperExpress.Server): void {
    this.server = server;
  }

  /**
   * Returns whether the realtime layer is ready to publish.
   */
  isReady(): boolean {
    return this.server !== null;
  }

  /**
   * Publish a structured message to a topic. All WebSocket clients that
   * are subscribed to `topic` will receive the message.
   *
   * Safe to call before init() — message is silently dropped to avoid
   * crashing controllers if the WS layer is unavailable.
   */
  publish(topic: string, type: string, payload: RealtimePayload = null): void {
    if (!this.server) {
      // WS layer not initialised yet — drop quietly so controllers stay safe.
      return;
    }

    const envelope: RealtimeMessage = {
      type,
      topic,
      payload,
      ts: Date.now(),
    };

    try {
      // uWebSockets app exposes `publish(topic, message, isBinary, compress)`.
      // Encoded as JSON string so browser onmessage gets a string directly.
      this.server.uws_instance.publish(topic, JSON.stringify(envelope), false, true);
    } catch (err) {
      Logger.warn("Realtime.publish failed", {
        topic,
        type,
        err: (err as Error).message,
      });
    }
  }
}

export const Realtime = new RealtimeService();
export default Realtime;
