"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MessageSquare,
  Search,
  Plus,
  Users,
  FolderKanban,
  Paperclip,
  Send,
  Loader2,
  Trash2,
  ArrowLeft,
  FileText,
  Download,
  Image as ImageIcon,
  Check,
  CheckCheck,
  MoreVertical,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useChatSocket } from "@/lib/useChatSocket";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { useToast } from "@/components/ui/Toast";

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const currentRole = ((session?.user as any)?.role || "").toUpperCase();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "DIRECT" | "GROUP" | "PROJECT">("ALL");

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    onlineUserIds,
    typingUsers,
    sendTypingStart,
    sendTypingStop,
    sendReadReceipt,
    onNewMessage,
    onMessageDeleted,
    onConversationUpdated,
  } = useChatSocket(activeConversationId);

  // Load conversations
  const loadConversations = async (autoSelectFirst = false) => {
    try {
      setLoadingConversations(true);
      const res = await fetch("/mdz-crm/api/chat/conversations");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setConversations(json.data);

        // Check URL param ?c=conversationId
        const paramId = searchParams.get("c");
        if (paramId && json.data.some((c: any) => c.id === paramId)) {
          setActiveConversationId(paramId);
        } else if (autoSelectFirst && json.data.length > 0 && !activeConversationId) {
          setActiveConversationId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations(true);
  }, []);

  // When active conversation ID changes, load messages & details
  useEffect(() => {
    if (!activeConversationId) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    const conv = conversations.find((c) => c.id === activeConversationId);
    if (conv) {
      setActiveConversation(conv);
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const [msgRes, convRes] = await Promise.all([
          fetch(`/mdz-crm/api/chat/conversations/${activeConversationId}/messages`),
          fetch(`/mdz-crm/api/chat/conversations/${activeConversationId}`),
        ]);
        const [msgJson, convJson] = await Promise.all([msgRes.json(), convRes.json()]);

        if (msgJson.success) {
          setMessages(msgJson.data || []);
        }
        if (convJson.success) {
          setActiveConversation(convJson.data);
        }

        // Mark as read
        fetch(`/mdz-crm/api/chat/conversations/${activeConversationId}/read`, { method: "PATCH" });
        sendReadReceipt(activeConversationId);

        // Clear unread in local state
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeConversationId]);

  // Real-time message & conversation events
  useEffect(() => {
    const unsubNew = onNewMessage((newMsg: any) => {
      // If belongs to active conversation
      if (activeConversationId && newMsg.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        sendReadReceipt(activeConversationId);
        fetch(`/mdz-crm/api/chat/conversations/${activeConversationId}/read`, { method: "PATCH" });
      }

      // Update conversations list latest message & unread count
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            const isCurrent = c.id === activeConversationId;
            return {
              ...c,
              lastMessage: newMsg,
              unreadCount: isCurrent || newMsg.senderId === currentUserId ? 0 : (c.unreadCount || 0) + 1,
              updatedAt: newMsg.createdAt,
            };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    });

    const unsubDelete = onMessageDeleted(({ conversationId, messageId }) => {
      if (activeConversationId && conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, deletedAt: new Date().toISOString(), content: "This message was deleted.", attachments: [] }
              : m
          )
        );
      }
    });

    const unsubConvUpdate = onConversationUpdated(() => {
      loadConversations(false);
    });

    return () => {
      unsubNew();
      unsubDelete();
      unsubConvUpdate();
    };
  }, [activeConversationId, currentUserId, onNewMessage, onMessageDeleted, onConversationUpdated, sendReadReceipt]);

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || (!inputText.trim() && attachments.length === 0)) return;

    const content = inputText.trim();
    const attachmentIds = attachments.map((a) => a.id);

    setInputText("");
    setAttachments([]);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      sendTypingStop(activeConversationId);
    }

    try {
      setSending(true);
      const res = await fetch(`/mdz-crm/api/chat/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          attachmentIds,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.error || "Failed to send message", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error sending message", "error");
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeConversationId) return;

    sendTypingStart(activeConversationId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTypingStop(activeConversationId);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "CHAT");
      formData.append("entityId", activeConversationId);

      const res = await fetch("/mdz-crm/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.mediaFile) {
        setAttachments((prev) => [...prev, json.mediaFile]);
        showToast("File uploaded via Google Drive", "success");
      } else {
        showToast(json.error || "Failed to upload file", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error uploading file", "error");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/chat/messages/${msgId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Message deleted", "success");
      } else {
        showToast(json.error || "Failed to delete message", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting message", "error");
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (filterType !== "ALL" && c.type !== filterType) return false;
    if (!searchQuery) return true;
    const name = c.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* LEFT COLUMN: Conversations List */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm ${
          activeConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Top Header & New Chat Button */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Internal Chat</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                />
                {isConnected ? `${onlineUserIds.size} Online` : "Connecting..."}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex p-2 gap-1 border-b border-slate-800/80 bg-slate-950/40 text-xs">
          {(["ALL", "DIRECT", "GROUP", "PROJECT"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterType === type
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {type === "ALL" ? "All" : type === "DIRECT" ? "Direct" : type === "GROUP" ? "Groups" : "Projects"}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConversations ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500 mb-2" />
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-slate-400">No conversations found.</p>
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="mt-3 text-xs text-blue-400 hover:underline"
              >
                + Start a conversation
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversationId;
              const isDirect = conv.type === "DIRECT";
              const otherUser = conv.otherParticipant;
              const isOnline = otherUser ? onlineUserIds.has(otherUser.id) : false;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                    isSelected
                      ? "bg-blue-600/15 border border-blue-500/30 text-white shadow-sm"
                      : "hover:bg-slate-800/50 border border-transparent text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {isDirect ? (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-white overflow-hidden">
                          {otherUser?.avatarUrl ? (
                            <img src={otherUser.avatarUrl} alt={conv.name} className="w-full h-full object-cover" />
                          ) : (
                            conv.name?.charAt(0)?.toUpperCase() || "U"
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          {conv.type === "PROJECT" ? <FolderKanban className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                      )}
                      {isDirect && (
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                            isOnline ? "bg-emerald-500" : "bg-slate-500"
                          }`}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-semibold truncate ${isSelected ? "text-blue-400" : "text-white"}`}>
                          {conv.name}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {conv.lastMessage ? (
                          conv.lastMessage.deletedAt ? (
                            <span className="italic text-slate-500">Message deleted</span>
                          ) : (
                            `${conv.lastMessage.sender?.name ? `${conv.lastMessage.sender.name}: ` : ""}${conv.lastMessage.content}`
                          )
                        ) : (
                          <span className="italic text-slate-500">No messages yet</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shrink-0 shadow-sm shadow-blue-500/40 animate-pulse">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Panel */}
      <div
        className={`flex-1 flex flex-col bg-slate-950 ${
          !activeConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConversation ? (
          <>
            {/* Active Conversation Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    {activeConversation.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {activeConversation.type === "DIRECT" ? (
                      activeConversation.otherParticipant && onlineUserIds.has(activeConversation.otherParticipant.id) ? (
                        <span className="text-emerald-400 font-medium">🟢 Online</span>
                      ) : (
                        <span>⚪ Offline</span>
                      )
                    ) : (
                      <span>{activeConversation.participants?.length || 0} participants</span>
                    )}
                  </div>
                </div>
              </div>

              {activeConversation.project && (
                <button
                  onClick={() => router.push(`/projects/${activeConversation.project.id}`)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                  View Project
                </button>
              )}
            </div>

            {/* Message Feed Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-950/70">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                  <p className="text-xs">Loading conversation history...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                  <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
                  <p className="text-sm font-medium">This is the start of your conversation.</p>
                  <p className="text-xs text-slate-600 mt-1">Send a message or attach a file to get started.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  const isDeleted = Boolean(msg.deletedAt);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-medium text-slate-300">
                          {isMe ? "You" : msg.sender?.name || "Colleague"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 max-w-[85%] sm:max-w-[70%]">
                        {isMe && !isDeleted && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Delete message"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all ${
                            isDeleted
                              ? "bg-slate-900/60 text-slate-500 italic border border-slate-800"
                              : isMe
                              ? "bg-blue-600 text-white rounded-br-none shadow-blue-500/10"
                              : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              {msg.attachments.map((att: any) => {
                                const media = att.media;
                                const isImage = media?.mimeType?.startsWith("image/");

                                return (
                                  <div
                                    key={att.id}
                                    className="rounded-xl overflow-hidden border border-white/10 bg-black/20 p-2"
                                  >
                                    {isImage ? (
                                      <a
                                        href={`/mdz-crm/api/media/${media.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block"
                                      >
                                        <img
                                          src={`/mdz-crm/api/media/${media.id}`}
                                          alt={media.originalName || "Attachment"}
                                          className="max-h-60 rounded-lg object-cover"
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        href={`/mdz-crm/api/media/${media.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-xs hover:underline text-blue-200"
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span className="truncate max-w-[200px]">
                                          {media.originalName || media.fileName}
                                        </span>
                                        <Download className="w-3.5 h-3.5 ml-auto opacity-70" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="px-6 py-1.5 text-xs text-blue-400 bg-slate-900/40 flex items-center gap-1.5 border-t border-slate-800/40">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>{typingUsers.map((u) => u.userName).join(", ")} is typing...</span>
              </div>
            )}

            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="px-6 py-2 border-t border-slate-800 bg-slate-900/40 flex items-center gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate max-w-[150px]">{att.originalName || att.fileName}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 md:p-4 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Attach file from Google Drive"
              >
                {uploadingFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
              </button>

              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={sending || (!inputText.trim() && attachments.length === 0)}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-md shadow-blue-500/25"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Select a Conversation</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Choose a direct thread, team group, or project workspace conversation to start messaging.
            </p>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onConversationCreated={(newConv) => {
          setConversations((prev) => {
            if (prev.some((c) => c.id === newConv.id)) return prev;
            return [newConv, ...prev];
          });
          setActiveConversationId(newConv.id);
        }}
      />
    </div>
  );
}
