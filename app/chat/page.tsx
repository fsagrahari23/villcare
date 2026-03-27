"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, MessageCircle, Plus, Send, Trash2 } from "lucide-react";
import ChatMarkdown from "@/components/chat-markdown";

type ChatMode = "general" | "medical";

type Conversation = {
  _id: string;
  title: string;
  chatMode: ChatMode;
  pinned?: boolean;
  lastOpenedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  lastMessage?: any;
};

type Message = {
  _id: string;
  messageType: "user" | "ai" | "system";
  content: string;
  createdAt: string;
};

export default function ChatPage() {
  const [userId, setUserId] = useState<string>("65f123456789012345678901");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftMode, setDraftMode] = useState<ChatMode>("general");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const effectiveUserId = user?._id || "65f123456789012345678901";
    setUserId(effectiveUserId);

    const savedConversationId = localStorage.getItem("selected_conversation_id");
    loadConversations(effectiveUserId, savedConversationId);
  }, []);

  const loadConversations = async (uid: string, preferredId?: string | null) => {
    try {
      setLoadingChats(true);

      const res = await fetch(`/api/conversations?userId=${uid}`);
      if (!res.ok) throw new Error("Failed to load conversations");

      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);

      let initialId: string | null = preferredId || null;

      if (!initialId && data?.length > 0) {
        initialId = data[0]._id;
      }

      if (initialId) {
        setSelectedConversationId(initialId);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const res = await fetch(
        `/api/chat?conversationId=${conversationId}&userId=${userId}`
      );

      if (!res.ok) throw new Error("Failed to fetch messages");

      const data = await res.json();
      setMessages((data.messages || []).map((m: any) => ({
        _id: m._id,
        messageType: m.messageType,
        content: m.content,
        createdAt: m.createdAt,
      })));
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!selectedConversationId) return;
    localStorage.setItem("selected_conversation_id", selectedConversationId);
    fetchConversationMessages(selectedConversationId);
  }, [selectedConversationId]);

  const createNewConversation = async (mode: ChatMode = draftMode) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: "New Chat",
        chatMode: mode,
      }),
    });

    if (!res.ok) throw new Error("Failed to create conversation");

    const conversation = await res.json();
    setConversations((prev) => [conversation, ...prev]);
    setSelectedConversationId(conversation._id);
    setMessages([]);
    return conversation;
  };

  const handleNewChat = async () => {
    try {
      await createNewConversation(draftMode);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  const refreshConversationList = async () => {
    await loadConversations(userId, selectedConversationId);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      const nextList = conversations.filter((c) => c._id !== id);
      setConversations(nextList);

      if (selectedConversationId === id) {
        const fallback = nextList[0]?._id || null;
        setSelectedConversationId(fallback);
        if (!fallback) setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content || sending) return;

    setInputValue("");
    setSending(true);

    try {
      let conversationId = selectedConversationId;

      if (!conversationId) {
        const newConversation = await createNewConversation(draftMode);
        conversationId = newConversation._id;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          userId,
          conversationId,
          chatMode: selectedConversation?.chatMode || draftMode,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          _id: data.userMessage._id,
          messageType: "user",
          content: data.userMessage.content,
          createdAt: data.userMessage.createdAt,
        },
        {
          _id: data.aiMessage._id,
          messageType: "ai",
          content: data.aiMessage.content,
          createdAt: data.aiMessage.createdAt,
        },
      ]);

      await refreshConversationList();
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="h-screen grid grid-cols-1 md:grid-cols-[320px_1fr]">
        <aside className="border-r border-border bg-card/30 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5" />
              <h1 className="font-semibold text-lg">Your Chats</h1>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleNewChat} className="flex-1 gap-2">
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                variant={draftMode === "general" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setDraftMode("general")}
              >
                General
              </Button>
              <Button
                variant={draftMode === "medical" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setDraftMode("medical")}
              >
                Medical
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingChats ? (
              <div className="p-4 text-sm text-muted-foreground">
                Loading chats...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No chats yet. Create your first conversation.
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((chat) => (
                  <div
                    key={chat._id}
                    className={`group rounded-xl border px-3 py-3 cursor-pointer transition ${selectedConversationId === chat._id
                      ? "bg-primary/10 border-primary/40"
                      : "bg-background hover:bg-secondary/40"
                      }`}
                    onClick={() => handleSelectConversation(chat._id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {chat.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {chat?.chatMode?.toUpperCase()}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(chat._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex flex-col h-screen">
          <div className="border-b border-border px-4 md:px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedConversation?.title || "Select a chat"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedConversation
                  ? `Mode: ${selectedConversation.chatMode}`
                  : "Choose a conversation from the sidebar"}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <Card className="p-6 text-sm text-muted-foreground">
                  Start typing to continue this chat or create a new one from the
                  sidebar.
                </Card>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.messageType === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div className="flex items-end gap-3 max-w-[85%] md:max-w-[70%]">
                      {message.messageType !== "user" && (
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${message.messageType === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border"
                          }`}
                      >
                        {message.messageType === "ai" ? (
                          <div className="text-sm">
                            <ChatMarkdown content={message.content} />
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}

                        <p
                          className={`text-[11px] mt-2 ${message.messageType === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                            }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-end gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-card border border-border">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div
                          className="w-2 h-2 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-border p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <Card className="p-3">
                <div className="flex gap-3 items-end">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[48px] max-h-40 resize-none bg-transparent outline-none px-3 py-2 text-sm"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !inputValue.trim()}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}