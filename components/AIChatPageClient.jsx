"use client";

import {
  Bot,
  Check,
  Edit3,
  LoaderCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { addStudyNotification } from "@/lib/notifications";
import { saveAiHistory } from "@/lib/aiHistory";
import { getSupabase } from "@/lib/supabase";
import Toast from "./Toast";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import Input from "./ui/Input";
import { SkeletonCard } from "./ui/Skeleton";
import Surface from "./ui/Surface";

const CHAT_SESSION_SELECT = "id,user_id,title,created_at,updated_at";
const CHAT_MESSAGE_SELECT = "id,chat_id,user_id,role,content,created_at";

function formatChatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getChatTitle(message) {
  const cleanMessage = message.trim().replace(/\s+/g, " ");
  return cleanMessage.length > 42 ? `${cleanMessage.slice(0, 42)}...` : cleanMessage;
}

function isMissingTableError(error) {
  const message = error?.message || "";

  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function ChatSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <Surface padding="compact">
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonCard
              key={item}
              className="h-16"
            />
          ))}
        </div>
      </Surface>
      <Surface className="h-[36rem]">
        <div className="grid h-full place-items-center">
          <div className="flex items-center gap-2 text-sm font-bold text-primary-hover dark:text-primary">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading chats...
          </div>
        </div>
      </Surface>
    </div>
  );
}

function DeleteChatModal({ chat, isDeleting, onCancel, onConfirm }) {
  if (!chat) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-card dark:border-border dark:bg-card sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-red-600 dark:text-red-300">
              Delete Chat
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-normal text-text dark:text-text">
              Delete this conversation?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted transition hover:bg-primary/10 hover:text-primary-hover dark:bg-sidebar dark:text-muted dark:hover:bg-primary/15"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4 break-words text-sm leading-6 text-muted dark:text-muted">
          "{chat.title}" and all of its messages will be permanently deleted.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            variant="danger"
          >
            {isDeleting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Delete Chat
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AIChatPageClient() {
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [activeChatId, chats]
  );

  const filteredChats = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return chats;

    return chats.filter((chat) => chat.title.toLowerCase().includes(cleanQuery));
  }, [chats, query]);

  useEffect(() => {
    let ignore = false;

    async function loadChats() {
      setIsLoading(true);
      setError("");

      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        const currentUser = userData.user;

        if (!currentUser) {
          throw new Error("Please login to use StudyAI Chat.");
        }

        const { data, error: chatsError } = await supabase
          .from("chat_sessions")
          .select(CHAT_SESSION_SELECT)
          .eq("user_id", currentUser.id)
          .order("updated_at", { ascending: false });

        if (chatsError) throw chatsError;

        if (!ignore) {
          setUser(currentUser);
          setChats(data || []);

          if (data?.[0]) {
            setActiveChatId(data[0].id);
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setError(
            isMissingTableError(loadError)
              ? "Chat tables are missing. Run the updated Supabase SQL before using AI Chat."
              : loadError.message || "Could not load chats."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadChats();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!activeChatId || !user) {
      setMessages([]);
      return undefined;
    }

    let ignore = false;

    async function loadMessages() {
      setIsLoadingMessages(true);
      setError("");

      try {
        const supabase = getSupabase();
        const { data, error: messagesError } = await supabase
          .from("chat_messages")
          .select(CHAT_MESSAGE_SELECT)
          .eq("chat_id", activeChatId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;

        if (!ignore) {
          setMessages(data || []);
        }
      } catch (messagesError) {
        if (!ignore) {
          setError(messagesError.message || "Could not load chat messages.");
        }
      } finally {
        if (!ignore) {
          setIsLoadingMessages(false);
        }
      }
    }

    loadMessages();

    return () => {
      ignore = true;
    };
  }, [activeChatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isResponding]);

  async function createChat(title = "New Chat") {
    if (!user) throw new Error("Please login again.");

    setIsCreatingChat(true);

    try {
      const supabase = getSupabase();
      const { data, error: createError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title,
        })
        .select(CHAT_SESSION_SELECT)
        .single();

      if (createError) throw createError;

      setChats((currentChats) => [data, ...currentChats]);
      setActiveChatId(data.id);
      setMessages([]);

      return data;
    } finally {
      setIsCreatingChat(false);
    }
  }

  async function handleNewChat() {
    setError("");
    setMessage("");

    try {
      await createChat("New Chat");
      setMessage("New chat created.");
    } catch (createError) {
      setError(createError.message || "Could not create a new chat.");
    }
  }

  function startRename(chat) {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  }

  async function saveRename(chat) {
    const cleanTitle = editingTitle.trim();

    if (!cleanTitle) {
      setError("Chat title is required.");
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error: renameError } = await supabase
        .from("chat_sessions")
        .update({ title: cleanTitle })
        .eq("id", chat.id)
        .eq("user_id", user.id)
        .select(CHAT_SESSION_SELECT)
        .single();

      if (renameError) throw renameError;

      setChats((currentChats) =>
        currentChats.map((currentChat) => (currentChat.id === chat.id ? data : currentChat))
      );
      setEditingChatId("");
      setEditingTitle("");
      setMessage("Chat renamed.");
    } catch (renameError) {
      setError(renameError.message || "Could not rename chat.");
    }
  }

  async function deleteChat() {
    if (!chatToDelete || !user) return;

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabase();
      const { error: deleteError } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", chatToDelete.id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      const nextChats = chats.filter((chat) => chat.id !== chatToDelete.id);
      setChats(nextChats);

      if (activeChatId === chatToDelete.id) {
        setActiveChatId(nextChats[0]?.id || "");
        setMessages([]);
      }

      setChatToDelete(null);
      setMessage("Chat deleted.");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete chat.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function saveMessageRow({ chatId, role, content }) {
    const supabase = getSupabase();
    const { data, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        user_id: user.id,
        role,
        content,
      })
      .select(CHAT_MESSAGE_SELECT)
      .single();

    if (messageError) throw messageError;

    return data;
  }

  async function updateChatTimestamp(chatId, title) {
    const supabase = getSupabase();
    const updates = { updated_at: new Date().toISOString() };

    if (title) {
      updates.title = title;
    }

    const { data, error: updateError } = await supabase
      .from("chat_sessions")
      .update(updates)
      .eq("id", chatId)
      .eq("user_id", user.id)
      .select(CHAT_SESSION_SELECT)
      .single();

    if (updateError) throw updateError;

    setChats((currentChats) => {
      const nextChats = currentChats.map((chat) => (chat.id === chatId ? data : chat));
      return nextChats.sort((first, second) => new Date(second.updated_at) - new Date(first.updated_at));
    });

    return data;
  }

  async function animateAssistantMessage(tempId, fullText) {
    const words = fullText.split(/(\s+)/);
    let visibleText = "";

    for (const word of words) {
      visibleText += word;
      setMessages((currentMessages) =>
        currentMessages.map((messageItem) =>
          messageItem.id === tempId
            ? { ...messageItem, content: visibleText, isStreaming: true }
            : messageItem
        )
      );
      await new Promise((resolve) => window.setTimeout(resolve, 12));
    }
  }

  async function handleSend(event) {
    event.preventDefault();

    if (isResponding) return;

    const cleanInput = input.trim();

    if (!cleanInput) return;

    setInput("");
    setError("");
    setMessage("");
    setIsResponding(true);

    try {
      const chat = activeChat || (await createChat(getChatTitle(cleanInput)));
      const shouldRenameChat = chat.title === "New Chat";
      const nextTitle = shouldRenameChat ? getChatTitle(cleanInput) : null;
      const savedUserMessage = await saveMessageRow({
        chatId: chat.id,
        role: "user",
        content: cleanInput,
      });
      const nextMessages = [...messages, savedUserMessage];
      const tempAssistantId = `assistant-${Date.now()}`;

      setMessages([
        ...nextMessages,
        {
          id: tempAssistantId,
          chat_id: chat.id,
          user_id: user.id,
          role: "assistant",
          content: "",
          isStreaming: true,
          created_at: new Date().toISOString(),
        },
      ]);

      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Please login again.");
      }

      let assistantText = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: nextMessages.map((item) => ({
              role: item.role,
              content: item.content,
            })),
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Chat backend is not available.");
        }

        assistantText = payload.response;
      } catch (chatError) {
        assistantText = `Streaming response placeholder:\n\n${chatError.message}\n\nOnce the AI backend is configured, StudyAI Chat will stream real assistant responses here.`;
      }

      await animateAssistantMessage(tempAssistantId, assistantText);

      const savedAssistantMessage = await saveMessageRow({
        chatId: chat.id,
        role: "assistant",
        content: assistantText,
      });

      setMessages((currentMessages) =>
        currentMessages.map((messageItem) =>
          messageItem.id === tempAssistantId ? savedAssistantMessage : messageItem
        )
      );

      await updateChatTimestamp(chat.id, nextTitle);
      try {
        const { error: historyError } = await saveAiHistory({
          supabase,
          userId: user.id,
          feature: "AI Chat",
          prompt: cleanInput,
          response: assistantText,
        });

        if (historyError) {
          // History saving is best-effort; chat responses should remain usable.
        }
      } catch (_historyError) {
        // History saving is best-effort; chat responses should remain usable.
      }
      addStudyNotification(user.id, {
        title: "AI generation completed",
        message: `Chat response completed for "${cleanInput.slice(0, 80)}".`,
        type: "ai",
      });
    } catch (sendError) {
      setError(sendError.message || "Could not send message.");
    } finally {
      setIsResponding(false);
    }
  }

  if (isLoading) {
    return <ChatSkeleton />;
  }

  return (
    <>
      <div className="mb-5 grid gap-3">
        <Toast message={message} />
        <Toast message={error} type="error" />
      </div>

      <div className="grid min-h-[42rem] gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Surface as="aside" padding="compact" className="flex min-h-0 flex-col">
          <Button
            type="button"
            onClick={handleNewChat}
            disabled={isCreatingChat}
            className="w-full"
          >
            {isCreatingChat ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            Create New Chat
          </Button>

          <Input
            icon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats..."
            aria-label="Search chats"
            className="mt-4 min-h-11"
          />

          <div className="mt-4 max-h-80 overflow-y-auto pr-1 lg:max-h-[32rem]">
            {filteredChats.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No chats yet"
                description="Start a new chat to save your first conversation."
                className="px-4 py-8"
              />
            ) : (
              <div className="grid gap-2">
                {filteredChats.map((chat) => {
                  const isActive = chat.id === activeChatId;
                  const isEditing = chat.id === editingChatId;

                  return (
                    <article
                      key={chat.id}
                      className={`rounded-2xl border p-3 transition ${
                        isActive
                          ? "border-primary/60 bg-primary/10 shadow-sm dark:border-primary/40 dark:bg-primary/10"
                          : "border-border bg-card hover:bg-primary/10 dark:border-border dark:bg-sidebar dark:hover:bg-primary/10"
                      }`}
                    >
                      {isEditing ? (
                        <div className="grid gap-2">
                          <input
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            aria-label="Chat title"
                            className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm font-bold text-text outline-none focus:ring-4 focus:ring-primary/15 dark:border-border dark:bg-sidebar dark:text-text"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveRename(chat)}
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-white transition hover:bg-primary-hover"
                          >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingChatId("")}
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-card px-3 text-xs font-bold text-muted transition hover:bg-primary/10 hover:text-primary-hover dark:border-border dark:bg-card dark:text-muted"
                          >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setActiveChatId(chat.id)}
                            aria-pressed={isActive}
                            className="min-w-0 flex-1 text-left"
                          >
                            <h3 className="truncate text-sm font-bold text-text dark:text-text">
                              {chat.title}
                            </h3>
                            <p className="mt-1 text-xs font-semibold text-muted dark:text-muted">
                              {formatChatDate(chat.updated_at || chat.created_at)}
                            </p>
                          </button>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => startRename(chat)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted transition hover:bg-primary/10 hover:text-primary-hover dark:text-muted dark:hover:bg-primary/15"
                              aria-label="Rename chat"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setChatToDelete(chat)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted transition hover:bg-red-50 hover:text-red-600 dark:text-muted dark:hover:bg-red-400/10 dark:hover:text-red-200"
                              aria-label="Delete chat"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </Surface>

        <Surface as="section" padding="none" className="flex min-h-[42rem] min-w-0 flex-col overflow-hidden">
          <div className="border-b border-border px-4 py-4 dark:border-border sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold tracking-normal text-text dark:text-text">
                  {activeChat?.title || "StudyAI Chat"}
                </h2>
                <p className="text-xs font-semibold text-muted dark:text-muted">
                  Streaming response UI with Supabase chat history
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            {isLoadingMessages ? (
              <div className="grid h-full place-items-center">
                <div className="flex items-center gap-2 text-sm font-bold text-primary-hover dark:text-primary" role="status">
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Loading messages...
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="grid h-full place-items-center py-12 text-center">
                <div className="mx-auto max-w-md">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
                    <MessageSquare className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold tracking-normal text-text dark:text-text">
                    Start a StudyAI chat
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted dark:text-muted">
                    Ask for explanations, study plans, examples, quizzes, or revision help.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto grid max-w-3xl gap-5">
                {messages.map((chatMessage) => {
                  const isUserMessage = chatMessage.role === "user";

                  return (
                    <article
                      key={chatMessage.id}
                      className={`flex gap-3 ${isUserMessage ? "justify-end" : "justify-start"}`}
                    >
                      {!isUserMessage && (
                        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                          <Bot className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                      <div
                        className={`max-w-[82%] whitespace-pre-wrap break-words rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-sm [overflow-wrap:anywhere] ${
                          isUserMessage
                            ? "bg-primary text-white"
                            : "border border-border bg-background text-text dark:border-border dark:bg-sidebar dark:text-text"
                        }`}
                      >
                        {chatMessage.content || (
                          <span className="inline-flex items-center gap-2 text-muted dark:text-muted">
                            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Thinking...
                          </span>
                        )}
                      </div>
                      {isUserMessage && (
                        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar text-white dark:bg-border">
                          <UserRound className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </article>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSend} aria-busy={isResponding} className="border-t border-border p-4 dark:border-border sm:p-5">
            <div className="mx-auto flex max-w-3xl gap-3 rounded-2xl border border-border bg-background p-2 shadow-sm dark:border-border dark:bg-sidebar">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(event);
                  }
                }}
                rows={1}
                placeholder="Ask StudyAI anything..."
                disabled={isResponding}
                aria-label="Message StudyAI"
                className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-text outline-none placeholder:text-muted disabled:cursor-not-allowed dark:text-text dark:placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={isResponding || !input.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send message"
              >
                {isResponding ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs font-semibold text-muted dark:text-muted">
              Press Enter to send, Shift + Enter for a new line.
            </p>
          </form>
        </Surface>
      </div>

      <DeleteChatModal
        chat={chatToDelete}
        isDeleting={isDeleting}
        onCancel={() => setChatToDelete(null)}
        onConfirm={deleteChat}
      />
    </>
  );
}
