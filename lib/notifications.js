const NOTIFICATION_EVENT = "studyai:notifications-updated";

function getStorageKey(userId) {
  return `studyai-notifications:${userId}`;
}

function getSeedKey(userId) {
  return `studyai-notifications-seeded:${userId}`;
}

function canUseStorage() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const testKey = "studyai-storage-test";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (_error) {
    return false;
  }
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeNotification(notification) {
  return {
    id: notification.id || createId(),
    title: notification.title || "StudyAI notification",
    message: notification.message || "",
    type: notification.type || "info",
    read: Boolean(notification.read),
    createdAt: notification.createdAt || new Date().toISOString(),
  };
}

function emitNotificationUpdate(userId) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENT, {
      detail: { userId },
    })
  );
}

export function readStudyNotifications(userId) {
  if (!canUseStorage() || !userId) {
    return [];
  }

  try {
    const value = localStorage.getItem(getStorageKey(userId));
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

export function writeStudyNotifications(userId, notifications) {
  if (!canUseStorage() || !userId) {
    return [];
  }

  const cleanNotifications = notifications
    .map(normalizeNotification)
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
    .slice(0, 30);

  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(cleanNotifications));
    emitNotificationUpdate(userId);
  } catch (_error) {
    return readStudyNotifications(userId);
  }

  return cleanNotifications;
}

export function addStudyNotification(userId, notification) {
  if (!userId) {
    return null;
  }

  const notifications = readStudyNotifications(userId);
  const nextNotification = normalizeNotification(notification);
  writeStudyNotifications(userId, [nextNotification, ...notifications]);

  return nextNotification;
}

export function markAllStudyNotificationsRead(userId) {
  const notifications = readStudyNotifications(userId).map((notification) => ({
    ...notification,
    read: true,
  }));

  return writeStudyNotifications(userId, notifications);
}

export function deleteStudyNotification(userId, notificationId) {
  const notifications = readStudyNotifications(userId).filter(
    (notification) => notification.id !== notificationId
  );

  return writeStudyNotifications(userId, notifications);
}

export function seedStudyNotifications(user) {
  if (!canUseStorage() || !user?.id) {
    return [];
  }

  const seedKey = getSeedKey(user.id);

  try {
    if (localStorage.getItem(seedKey)) {
      return readStudyNotifications(user.id);
    }
  } catch (_error) {
    return [];
  }

  const fullName = user.user_metadata?.full_name || "Student";
  const now = Date.now();
  const seededNotifications = [
    normalizeNotification({
      title: "Welcome to StudyAI",
      message: `Hi ${fullName}, your StudyAI workspace is ready.`,
      type: "welcome",
      createdAt: new Date(now).toISOString(),
    }),
    normalizeNotification({
      title: "New features available",
      message: "Analytics, profile pictures, settings, and notifications are now available.",
      type: "feature",
      createdAt: new Date(now - 1000).toISOString(),
    }),
  ];

  const notifications = writeStudyNotifications(user.id, [
    ...seededNotifications,
    ...readStudyNotifications(user.id),
  ]);

  try {
    localStorage.setItem(seedKey, "true");
  } catch (_error) {
    // Seeding is best-effort.
  }

  return notifications;
}

export { NOTIFICATION_EVENT };
