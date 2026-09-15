"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WsNotificationPayload } from "./wsBroadcaster";

export type WsConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseNotificationWsOptions {
  userId?: string | null;
  onNotification?: (notification: WsNotificationPayload) => void;
  enabled?: boolean;
}

export function useNotificationWs({
  userId,
  onNotification,
  enabled = true,
}: UseNotificationWsOptions) {
  const [status, setStatus] = useState<WsConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!enabled || !userId || typeof window === "undefined") {
      setStatus("disconnected");
      return;
    }

    // Clean up existing socket if open
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/mdz-crm/ws?userId=${encodeURIComponent(userId)}`;

      setStatus("connecting");
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus("connected");
        retryCountRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "NOTIFICATION" && data.payload) {
            onNotification?.(data.payload);
          }
        } catch (err) {
          console.warn("[WebSocket] Error parsing incoming message:", err);
        }
      };

      socket.onclose = (event) => {
        if (!isMountedRef.current) return;
        setStatus("disconnected");
        wsRef.current = null;

        // Auto reconnect with backoff if not closed cleanly
        if (enabled && event.code !== 1000) {
          const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 15000);
          retryCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      socket.onerror = (err) => {
        if (!isMountedRef.current) return;
        console.warn("[WebSocket] Connection error:", err);
        setStatus("error");
      };
    } catch (err) {
      console.warn("[WebSocket] Failed to instantiate WebSocket:", err);
      setStatus("error");
    }
  }, [enabled, userId, onNotification]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, "Client unmounted");
        } catch {}
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    status,
    isConnected: status === "connected",
    reconnect: connect,
  };
}
