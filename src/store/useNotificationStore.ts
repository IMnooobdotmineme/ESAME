import { create } from "zustand";

export type NotificationType = "violation" | "request" | "system" | "info";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  roomCode?: string;
  studentId?: string;
  studentName?: string;
}

interface NotificationStore {
  notifications: NotificationItem[];
  addNotification: (
    notification: Omit<NotificationItem, "id" | "timestamp" | "read">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [
    {
      id: "notif-1",
      title: "Tab Switch Flagged",
      message: "Marcus Vance left the active exam window 3 times.",
      type: "violation",
      timestamp: "10:22 AM",
      read: false,
      roomCode: "DEMO123",
      studentId: "STU-4019",
      studentName: "Marcus Vance",
    },
    {
      id: "notif-2",
      title: "Multiple Faces Detected",
      message: "David Miller's camera feed detected extra persons.",
      type: "violation",
      timestamp: "10:23 AM",
      read: false,
      roomCode: "DEMO123",
      studentId: "STU-3321",
      studentName: "David Miller",
    },
    {
      id: "notif-3",
      title: "New Join Request",
      message: "Alex Johnson is requesting to join room SEN79Z.",
      type: "request",
      timestamp: "10:15 AM",
      read: true,
      roomCode: "SEN79Z",
    },
  ],

  addNotification: (item) =>
    set((state) => ({
      notifications: [
        {
          ...item,
          id: `notif-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          read: false,
        },
        ...state.notifications,
      ],
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),
}));