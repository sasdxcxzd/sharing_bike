/**
 * Auth state management using Zustand.
 * Persists token and admin info to localStorage for session survival.
 */
import { create } from 'zustand';

const TOKEN_KEY = 'bike_admin_token';
const ADMIN_KEY = 'bike_admin_info';

function loadFromStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const admin = JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null');
    return { token, admin, isAuthenticated: !!token && !!admin };
  } catch {
    return { token: null, admin: null, isAuthenticated: false };
  }
}

const useAuthStore = create((set) => ({
  ...loadFromStorage(),

  /** Login: save token and admin info */
  login: (token, admin) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    set({ token, admin, isAuthenticated: true });
  },

  /** Logout: clear stored auth data */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    set({ token: null, admin: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
