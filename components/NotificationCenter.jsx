"use client";

import {
  Bell,
  CheckCheck,
  CircleCheck,
  LockKeyhole,
  Sparkles,
  Trash2,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  NOTIFICATION_EVENT,
  deleteStudyNotification,
  markAllStudyNotificationsRead,
  readStudyNotifications,
  seedStudyNotifications,
} from "@/lib/notifications";
import { getCurrentUser } from "@/lib/supabase";
import EmptyState from "./ui/EmptyState";

const notificationTypeStyles = {
  welcome: {
    icon: Sparkles,
    className: "bg-primary text-white",
  },
  ai: {
    icon: WandSparkles,
    className: "bg-primary-hover text-white",
  },
  profile: {
    icon: UserRound,
    className: "bg-sky-500 text-white",
  },
  security: {
    icon: LockKeyhole,
    className: "bg-success text-white",
  },
  feature: {
    icon: CircleCheck,
    className: "bg-warning text-white",
  },
  info: {
    icon: Bell,
    className: "bg-border text-white",
  },
};

function formatNotificationTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function NotificationCenter() {
  const containerRef = useRef(null);
  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  useEffect(() => {
    let ignore = false;

    async function loadNotifications() {
      try {
        const { user } = await getCurrentUser();

        if (!user || ignore) {
          return;
        }

        seedStudyNotifications(user);
        setUserId(user.id);
        setNotifications(readStudyNotifications(user.id));
      } catch (_error) {
        if (!ignore) {
          setNotifications([]);
        }
      }
    }

    loadNotifications();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    function syncNotifications(event) {
      if (!userId || event.detail?.userId !== userId) {
        return;
      }

      setNotifications(readStudyNotifications(userId));
    }

    function syncStorage(event) {
      if (!userId || event.key !== `studyai-notifications:${userId}`) {
        return;
      }

      setNotifications(readStudyNotifications(userId));
    }

    window.addEventListener(NOTIFICATION_EVENT, syncNotifications);
    window.addEventListener("storage", syncStorage);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, syncNotifications);
      window.removeEventListener("storage", syncStorage);
    };
  }, [userId]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!containerRef.current || containerRef.current.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function markAllAsRead() {
    if (!userId) return;
    setNotifications(markAllStudyNotificationsRead(userId));
  }

  function deleteNotification(notificationId) {
    if (!userId) return;
    setNotifications(deleteStudyNotification(userId, notificationId));
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary hover:text-primary study-focus dark:border-border dark:bg-card dark:text-muted dark:hover:text-text"
        aria-label="Open notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-black leading-none text-white ring-2 ring-card dark:ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-card/95 shadow-card shadow-slate-950/10 backdrop-blur-xl studyai-scale-in dark:border-border dark:bg-card/95 sm:w-96" role="dialog" aria-label="Notifications">
          <div className="flex items-start justify-between gap-4 border-b border-border p-4 dark:border-border">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary dark:text-primary">
                Notifications
              </p>
              <h2 className="mt-1 text-xl font-bold text-text dark:text-text">
                StudyAI updates
              </h2>
              <p className="mt-1 text-xs font-semibold text-muted dark:text-muted">
                {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-text study-focus dark:text-muted dark:hover:bg-border dark:hover:text-text"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 dark:border-border">
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary-hover transition hover:bg-primary hover:text-white study-focus disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary dark:hover:text-white"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Mark all as read
            </button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-3 study-scrollbar">
            {notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No notifications"
                description="Updates about StudyAI activity will appear here."
                className="py-9"
              />
            ) : (
              <div className="grid gap-2">
                {notifications.map((notification) => {
                  const style =
                    notificationTypeStyles[notification.type] ||
                    notificationTypeStyles.info;
                  const Icon = style.icon;

                  return (
                    <article
                      key={notification.id}
                      className={`rounded-2xl border p-3 transition hover:bg-background dark:hover:bg-surface ${
                        notification.read
                          ? "border-border bg-card/70 dark:border-border dark:bg-sidebar"
                          : "border-primary/30 bg-primary/10 dark:border-primary/30 dark:bg-primary/15"
                      }`}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${style.className}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="break-words text-sm font-bold text-text dark:text-text">
                                {notification.title}
                              </h3>
                              <p className="mt-1 break-words text-xs leading-5 text-muted dark:text-muted">
                                {notification.message}
                              </p>
                              <p className="mt-2 text-xs font-semibold text-muted dark:text-muted">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteNotification(notification.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-red-50 hover:text-red-600 study-focus dark:hover:bg-red-400/10 dark:hover:text-red-200"
                              aria-label="Delete notification"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
