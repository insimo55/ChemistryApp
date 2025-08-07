// frontend/src/store/auth.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// apiClient мы здесь больше не импортируем, чтобы избежать циклических зависимостей
// import apiClient from '../api'; 

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null, // <-- Добавляем refreshToken
      user: null,
      isAuthenticated: false,

      // login теперь будет вызываться из api/index.js, а не наоборот
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
      },

      // Функция для обновления только accessToken
      setAccessToken: (token) => {
        set({ accessToken: token });
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);