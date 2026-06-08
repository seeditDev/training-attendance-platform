import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

interface AuthState {
  isAuthenticated: boolean;
  adminName: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  checkAuth: () => void;
}

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const AUTH_COOKIE = "admin_auth_token";
const AUTH_TOKEN = "training_platform_admin_2024";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      adminName: null,

      login: (username: string, password: string) => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          Cookies.set(AUTH_COOKIE, AUTH_TOKEN, {
            expires: 7,
            secure: true,
            sameSite: "strict",
          });
          set({
            isAuthenticated: true,
            adminName: "Admin",
          });
          return true;
        }
        return false;
      },

      logout: () => {
        Cookies.remove(AUTH_COOKIE);
        set({
          isAuthenticated: false,
          adminName: null,
        });
      },

      checkAuth: () => {
        const token = Cookies.get(AUTH_COOKIE);
        if (token === AUTH_TOKEN) {
          set({
            isAuthenticated: true,
            adminName: "Admin",
          });
        } else {
          set({
            isAuthenticated: false,
            adminName: null,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        adminName: state.adminName,
      }),
    }
  )
);
