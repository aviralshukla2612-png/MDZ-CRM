"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

export interface TypingUser {
  userId: string;
  userName: string;
}

export function useChatSocket(currentConversationId?: string | null) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const userName = session?.user?.name || "User";

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // userId -> userName
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Listeners maps
  const messageListeners = useRef<Set<(msg: any) => void>>(new Set());
  const messageDeleteListeners = useRef<Set<(data: { conversationId: string; messageId: string }) => void>>(new Set());
  const conversationUpdateListeners = useRef<Set<(data: any) => void>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // Connect to Socket.IO server
    const socket = io({
      path: "/mdz-crm/socket.io",
      query: {
        userId,
        userName,
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      if (currentConversationId) {
        socket.emit("conversation:join", { conversationId: currentConversationId });
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("presence:initial", (data: { onlineUserIds: string[] }) => {
      if (data?.onlineUserIds) {
        setOnlineUserIds(new Set(data.onlineUserIds));
      }
    });

    socket.on("presence:update", (data: { userId: string; status: "ONLINE" | "OFFLINE"; onlineUserIds?: string[] }) => {
      if (data?.onlineUserIds) {
        setOnlineUserIds(new Set(data.onlineUserIds));
      } else if (data?.userId) {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (data.status === "ONLINE") {
            next.add(data.userId);
          } else {
            next.delete(data.userId);
          }
          return next;
        });
      }
    });

    socket.on("typing:start", (data: { conversationId: string; userId: string; userName: string }) => {
      if (currentConversationId && data.conversationId === currentConversationId && data.userId !== userId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.userName);
          return next;
        });

        // Clear existing timeout if any
        if (typingTimeouts.current.has(data.userId)) {
          clearTimeout(typingTimeouts.current.get(data.userId)!);
        }

        // Auto-clear typing indicator after 3.5 seconds
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(data.userId);
            return next;
          });
          typingTimeouts.current.delete(data.userId);
        }, 3500);

        typingTimeouts.current.set(data.userId, timeout);
      }
    });

    socket.on("typing:stop", (data: { conversationId: string; userId: string }) => {
      if (currentConversationId && data.conversationId === currentConversationId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
        if (typingTimeouts.current.has(data.userId)) {
          clearTimeout(typingTimeouts.current.get(data.userId)!);
          typingTimeouts.current.delete(data.userId);
        }
      }
    });

    socket.on("message:new", (msg: any) => {
      messageListeners.current.forEach((listener) => listener(msg));
    });

    socket.on("message:deleted", (data: { conversationId: string; messageId: string }) => {
      messageDeleteListeners.current.forEach((listener) => listener(data));
    });

    socket.on("conversation:updated", (data: any) => {
      conversationUpdateListeners.current.forEach((listener) => listener(data));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, userName]);

  // Handle joining / leaving room when active conversation changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    if (currentConversationId) {
      socket.emit("conversation:join", { conversationId: currentConversationId });
      // Reset typing state on room switch
      setTypingUsers(new Map());
    }

    return () => {
      if (currentConversationId && socket.connected) {
        socket.emit("conversation:leave", { conversationId: currentConversationId });
      }
    };
  }, [currentConversationId]);

  const joinConversation = useCallback((convId: string) => {
    socketRef.current?.emit("conversation:join", { conversationId: convId });
  }, []);

  const leaveConversation = useCallback((convId: string) => {
    socketRef.current?.emit("conversation:leave", { conversationId: convId });
  }, []);

  const sendTypingStart = useCallback((convId: string) => {
    socketRef.current?.emit("typing:start", { conversationId: convId });
  }, []);

  const sendTypingStop = useCallback((convId: string) => {
    socketRef.current?.emit("typing:stop", { conversationId: convId });
  }, []);

  const sendReadReceipt = useCallback((convId: string) => {
    socketRef.current?.emit("message:read", { conversationId: convId, lastReadAt: new Date().toISOString() });
  }, []);

  const onNewMessage = useCallback((callback: (msg: any) => void) => {
    messageListeners.current.add(callback);
    return () => {
      messageListeners.current.delete(callback);
    };
  }, []);

  const onMessageDeleted = useCallback((callback: (data: { conversationId: string; messageId: string }) => void) => {
    messageDeleteListeners.current.add(callback);
    return () => {
      messageDeleteListeners.current.delete(callback);
    };
  }, []);

  const onConversationUpdated = useCallback((callback: (data: any) => void) => {
    conversationUpdateListeners.current.add(callback);
    return () => {
      conversationUpdateListeners.current.delete(callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUserIds,
    typingUsers: Array.from(typingUsers.entries()).map(([uId, uName]) => ({ userId: uId, userName: uName })),
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
    sendReadReceipt,
    onNewMessage,
    onMessageDeleted,
    onConversationUpdated,
  };
}
