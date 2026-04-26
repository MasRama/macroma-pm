/**
 * Realtime WebSocket Client
 *
 * Singleton WebSocket connection that lives for the lifetime of the page.
 * Multiple components can subscribe to the same topic — handlers are tracked
 * and the underlying `subscribe` command is only sent once per topic.
 *
 * Auto-reconnects with capped exponential backoff. On reconnect every
 * already-subscribed topic is re-subscribed automatically so callers don't
 * have to bookkeep that themselves.
 *
 * Wire format mirrors `app/core/realtime.ts` on the server.
 *
 * Usage:
 *   import { realtime } from './realtime';
 *
 *   const off = realtime.subscribe('project:abc', (msg) => {
 *     if (msg.type === 'task.moved') { ... }
 *   });
 *   onDestroy(off);
 */

export interface RealtimeIncoming {
  type: string;
  topic?: string;
  payload?: any;
  ts?: number;
}

type Handler = (msg: RealtimeIncoming) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private connecting = false;
  private shouldRun = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Map of topic → set of handler functions registered by callers.
   * The "*" key receives every incoming message regardless of topic.
   */
  private handlers = new Map<string, Set<Handler>>();

  /**
   * Connect (idempotent). Safe to call from any component's onMount.
   */
  connect(): void {
    if (typeof window === 'undefined') return; // SSR guard
    this.shouldRun = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (this.connecting) return;
    this.connecting = true;
    this.openSocket();
  }

  /**
   * Disconnect entirely. Used only on logout / full page teardown.
   */
  disconnect(): void {
    this.shouldRun = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(1000, 'client disconnect'); } catch { /* ignore */ }
      this.ws = null;
    }
    this.handlers.clear();
  }

  /**
   * Subscribe a handler to a specific topic. The wire-level subscribe is sent
   * only when the first handler for the topic registers. Returns an
   * unsubscribe function.
   */
  subscribe(topic: string, handler: Handler): () => void {
    let set = this.handlers.get(topic);
    const isFirst = !set;
    if (!set) {
      set = new Set<Handler>();
      this.handlers.set(topic, set);
    }
    set.add(handler);

    // Make sure the connection is up.
    this.connect();

    if (isFirst && topic !== '*') {
      this.sendWhenReady({ action: 'subscribe', topic });
    }

    return () => this.unsubscribe(topic, handler);
  }

  /**
   * Subscribe to *every* incoming message (catch-all). Useful for debugging.
   */
  onAny(handler: Handler): () => void {
    return this.subscribe('*', handler);
  }

  /**
   * Remove a single handler. If the topic is left with zero handlers we
   * also tell the server to unsubscribe to save bandwidth.
   */
  unsubscribe(topic: string, handler: Handler): void {
    const set = this.handlers.get(topic);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      this.handlers.delete(topic);
      if (topic !== '*') {
        this.sendWhenReady({ action: 'unsubscribe', topic });
      }
    }
  }

  // ──────────── internals ────────────

  private openSocket(): void {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      this.connecting = false;
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.connecting = false;
      this.reconnectAttempts = 0;

      // Resubscribe everything on a fresh connection (incl. after reconnect).
      for (const topic of this.handlers.keys()) {
        if (topic === '*') continue;
        this.sendRaw({ action: 'subscribe', topic });
      }

      // Start a lightweight heartbeat so idle proxies don't kill the socket.
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        this.sendRaw({ action: 'ping' });
      }, 25000);
    };

    this.ws.onmessage = (ev) => {
      let msg: RealtimeIncoming;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      // Dispatch by topic when present (data events) and to wildcards.
      if (msg.topic) {
        const set = this.handlers.get(msg.topic);
        if (set) {
          for (const h of set) {
            try { h(msg); } catch (err) { console.error('realtime handler error', err); }
          }
        }
      }

      // Always notify wildcard listeners.
      const wildcard = this.handlers.get('*');
      if (wildcard) {
        for (const h of wildcard) {
          try { h(msg); } catch (err) { console.error('realtime wildcard error', err); }
        }
      }
    };

    this.ws.onerror = () => {
      // Errors are followed by close. Real handling lives in onclose.
    };

    this.ws.onclose = () => {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      this.ws = null;
      this.connecting = false;
      if (this.shouldRun) this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectAttempts += 1;
    // Cap-and-jitter exponential backoff: 1s, 2s, 4s, 8s, ... up to 30s.
    const base = Math.min(30_000, 1000 * 2 ** Math.min(5, this.reconnectAttempts - 1));
    const jitter = Math.random() * 500;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldRun) this.openSocket();
    }, base + jitter);
  }

  private sendWhenReady(payload: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendRaw(payload);
    }
    // Otherwise the onopen handler will resubscribe automatically.
  }

  private sendRaw(payload: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify(payload));
    } catch (err) {
      // Drop — the next reconnect will replay subscriptions.
    }
  }
}

// Module-level singleton.
export const realtime = new RealtimeClient();
export default realtime;
