"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Send, Paperclip, Loader2, Trash2, FileText, Download } from "lucide-react";
import { useChatSocket } from "@/lib/useChatSocket";
import { useToast } from "@/components/ui/Toast";

interface Props {
  projectId: string;
  projectName: string;
}

export function ProjectChatTab({ projectId, projectName }: Props) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { showToast } = useToast();

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    typingUsers,
    sendTypingStart,
    sendTypingStop,
    sendReadReceipt,
    onNewMessage,
    onMessageDeleted,
  } = useChatSocket(conversation?.id);

  // Initialize or fetch project conversation
  useEffect(() => {
    let isMounted = true;
    const initChat = async () => {
      setLoading(true);
      try {
        const res = await fetch("/mdz-crm/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "PROJECT",
            projectId,
          }),
        });
        const json = await res.json();
        if (json.success && isMounted) {
          setConversation(json.data);
          // Load messages
          const msgRes = await fetch(`/mdz-crm/api/chat/conversations/${json.data.id}/messages`);
          const msgJson = await msgRes.json();
          if (msgJson.success && isMounted) {
            setMessages(msgJson.data || []);
            // Mark as read
            fetch(`/mdz-crm/api/chat/conversations/${json.data.id}/read`, { method: "PATCH" });
          }
        }
      } catch (err) {
        console.error("Failed to load project chat:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChat();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Real-time message listeners
  useEffect(() => {
    const unsubNew = onNewMessage((newMsg: any) => {
      if (conversation && newMsg.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        sendReadReceipt(conversation.id);
        fetch(`/mdz-crm/api/chat/conversations/${conversation.id}/read`, { method: "PATCH" });
      }
    });

    const unsubDelete = onMessageDeleted(({ conversationId, messageId }) => {
      if (conversation && conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, deletedAt: new Date().toISOString(), content: "This message was deleted.", attachments: [] }
              : m
          )
        );
      }
    });

    return () => {
      unsubNew();
      unsubDelete();
    };
  }, [conversation, onNewMessage, onMessageDeleted, sendReadReceipt]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation || (!inputText.trim() && attachments.length === 0)) return;

    const content = inputText.trim();
    const attachmentIds = attachments.map((a) => a.id);

    setInputText("");
    setAttachments([]);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      sendTypingStop(conversation.id);
    }

    try {
      setSending(true);
      const res = await fetch(`/mdz-crm/api/chat/conversations/${conversation.id}/messages`, {
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
    if (!conversation) return;

    sendTypingStart(conversation.id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTypingStop(conversation.id);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "CHAT");
      formData.append("entityId", conversation.id);

      const res = await fetch("/mdz-crm/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.mediaFile) {
        setAttachments((prev) => [...prev, json.mediaFile]);
        showToast("File attached successfully", "success");
      } else {
        showToast(json.error || "Failed to upload attachment", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading project chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[650px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            💬 {projectName} Team Chat
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {conversation?.participants?.length || 0} members • Real-time project communication
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Connecting...
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40 dark:bg-slate-950/60">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-12">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No messages yet in this project chat.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Start the conversation with your team members!</p>
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
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isMe ? "You" : msg.sender?.name || "Colleague"}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="flex items-center gap-2 max-w-[80%]">
                  {isMe && !isDeleted && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      title="Delete message"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                      isDeleted
                        ? "bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 italic border border-slate-200 dark:border-slate-800"
                        : isMe
                        ? "bg-indigo-600 text-white rounded-br-xs shadow-indigo-500/10"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {msg.attachments.map((att: any) => {
                          const media = att.media;
                          const isImage = media?.mimeType?.startsWith("image/");

                          return (
                            <div
                              key={att.id}
                              className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-2"
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
                                    className="max-h-48 rounded-lg object-cover"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={`/mdz-crm/api/media/${media.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 text-xs hover:underline text-indigo-600 dark:text-indigo-300 font-medium"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span className="truncate max-w-[200px]">{media.originalName || media.fileName}</span>
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
        <div className="px-5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center gap-1.5 border-t border-indigo-100 dark:border-slate-800/40">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
          </span>
          <span className="font-medium">{typingUsers.map((u) => u.userName).join(", ")} is typing...</span>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="px-5 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
            >
              <Paperclip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="truncate max-w-[150px] font-medium">{att.originalName || att.fileName}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
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
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          title="Attach file from Google Drive"
        >
          {uploadingFile ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : <Paperclip className="w-5 h-5" />}
        </button>

        <input
          type="text"
          placeholder="Type message to project team..."
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />

        <button
          type="submit"
          disabled={sending || (!inputText.trim() && attachments.length === 0)}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
