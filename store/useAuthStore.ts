import { create } from 'zustand';

interface User {
  id: string;
  fullName?: string;
  email: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  setSession: (user: User, accessToken: string, refreshToken?: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setSession: (user, accessToken, refreshToken?) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('dashboard_refresh_token', refreshToken);
      }
    }
    set({ isAuthenticated: true, user });
  },
  clearSession: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dashboard_access_token');
      localStorage.removeItem('dashboard_refresh_token');
    }
    set({ isAuthenticated: false, user: null });
  },
}));
