import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  wallet?: number;
  loyaltyPoints?: number;
  vehicle?: any;
  carbonSaved?: number;
  notificationPreferences?: any;
}

interface Store {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  notifications: any[];
  unreadCount: number;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setNotifications: (n: any[], unread: number) => void;
  markNotifRead: (id: string) => void;
  setHydrated: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      notifications: [],
      unreadCount: 0,
      _hasHydrated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('cpx_token', token);
        }
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cpx_token');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),

      markNotifRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1),
      })),

      setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'cpx-store',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => { state?.setHydrated(); },
    }
  )
);
