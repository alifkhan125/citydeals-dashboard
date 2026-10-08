import { create } from 'zustand';

interface User {
  id: string;
  fullName?: string;
  email: string;
  role: string;
  profilePictureUrl?: string | null;
  staffRoleKey?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  hydrateFromStorage: () => void;
  setSession: (user: User, accessToken: string, refreshToken?: string) => void;
  updateUser: (partial: Partial<User>) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    const rawUser = localStorage.getItem('dashboard_user');
    const token = localStorage.getItem('dashboard_access_token');

    set({
      isAuthenticated: Boolean(token),
      user: rawUser ? JSON.parse(rawUser) : null,
    });
  },
  setSession: (user, accessToken, refreshToken?) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('dashboard_refresh_token', refreshToken);
      }
    }
    set({ isAuthenticated: true, user });
  },
  updateUser: (partial) => {
    set((state) => {
      const nextUser = state.user ? { ...state.user, ...partial } : null;
      if (typeof window !== 'undefined' && nextUser) {
        localStorage.setItem('dashboard_user', JSON.stringify(nextUser));
      }
      return { user: nextUser };
    });
  },
  clearSession: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dashboard_access_token');
      localStorage.removeItem('dashboard_refresh_token');
      localStorage.removeItem('dashboard_user');
    }
    set({ isAuthenticated: false, user: null });
  },
}));
