import { create } from "zustand";

export type NotificationType = "violation" | "request" | "info";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
  archived: boolean;
  roomCode?: string;
}

interface NotificationStore {
  notifications: NotificationItem[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Omit<NotificationItem, "read" | "archived">) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string, archived: boolean) => Promise<void>;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/teacher/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      set({
        notifications: (data.notifications || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          timestamp: n.timestamp,
          type: n.type || "info",
          read: n.read,
          archived: n.archived || false,
          roomCode: n.roomCode,
        })),
        isLoading: false,
      });
    } catch (error) {
      console.error("fetchNotifications error:", error);
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [{ ...notification, read: false, archived: false }, ...state.notifications],
    }));
  },

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    try {
      await fetch(`/api/teacher/notifications/${id}/read`, { method: "POST" });
    } catch (error) {
      console.error("markAsRead error:", error);
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.archived ? n : { ...n, read: true })),
    }));
    try {
      await fetch("/api/teacher/notifications/mark-all-read", { method: "POST" });
    } catch (error) {
      console.error("markAllAsRead error:", error);
    }
  },

  archiveNotification: async (id, archived) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, archived } : n)),
    }));
    try {
      const res = await fetch(`/api/teacher/notifications/${id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (!res.ok) throw new Error("Archive failed");
    } catch (error) {
      console.error("archiveNotification error:", error);
      // revert on failure
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, archived: !archived } : n)),
      }));
    }
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));