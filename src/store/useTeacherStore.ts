import { create } from "zustand";

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  assignments: Array<{ department: string; subject: string }>;
}

interface TeacherStore {
  profile: TeacherProfile | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<TeacherProfile>) => void;
}

export const useTeacherStore = create<TeacherStore>((set, get) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async () => {
    if (get().profile) return;
    set({ isLoading: true });
    try {
      const res = await fetch("/api/teacher/settings");
      if (res.ok) {
        const data = await res.json();
        set({
          profile: {
            id: data.teacher.id,
            name: data.teacher.name || "",
            email: data.teacher.email || "",
            avatarUrl: data.teacher.avatarUrl || null,
            assignments: data.teacher.assignments || [],
          },
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch teacher profile:", error);
      set({ isLoading: false });
    }
  },

  updateProfile: (data) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...data } : null,
    }));
  },
}));