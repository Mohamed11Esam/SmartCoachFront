import { create } from 'zustand';
import { User } from '../types';

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

const getStoredAuth = () => {
  if (typeof window === 'undefined') {
    return { token: null, refreshToken: null, user: null, isAuthenticated: false };
  }
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const userStr = localStorage.getItem('user');
  let user: User | null = null;
  if (token && userStr) {
    try {
      user = JSON.parse(userStr) as User;
    } catch {
      user = null;
    }
  }
  return {
    token: token || null,
    refreshToken: refreshToken || null,
    user,
    isAuthenticated: Boolean(token),
  };
};

const initialAuth = getStoredAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialAuth.token,
  refreshToken: initialAuth.refreshToken,
  user: initialAuth.user,
  isAuthenticated: initialAuth.isAuthenticated,

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
    const { token, refreshToken, user, isAuthenticated } = getStoredAuth();
    set({ token, refreshToken, user, isAuthenticated });
  },
}));

