import { create } from 'zustand';
import { User } from '../types';
import { INITIAL_USER } from '../lib/mockData';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken?: string, user?: User) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: INITIAL_USER, // default to athletic profile for smooth preview
  isAuthenticated: true,

  setAuth: (token, refreshToken, user) => {
    localStorage.setItem('access_token', token);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    set({
      token,
      refreshToken: refreshToken || null,
      user: user || get().user,
      isAuthenticated: true,
    });
  },

  updateUser: (data) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  hydrate: () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('user');

    if (token) {
      try {
        const user = userStr ? (JSON.parse(userStr) as User) : INITIAL_USER;
        set({ token, refreshToken, user, isAuthenticated: true });
      } catch {
        set({ token, refreshToken, user: INITIAL_USER, isAuthenticated: true });
      }
    } else {
      // If no stored token yet, keep INITIAL_USER so users can immediately test the dashboard & player
      set({ user: INITIAL_USER, isAuthenticated: true });
    }
  },
}));
