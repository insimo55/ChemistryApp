// frontend/src/api/index.js
import axios from 'axios';
import { useAuthStore } from '../store/auth';


// --- ДИНАМИЧЕСКОЕ ОПРЕДЕЛЕНИЕ API_URL ---

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- КОНЕЦ ДИНАМИЧЕСКОГО ОПРЕДЕЛЕНИЯ ---
if (!API_BASE_URL) {
  console.error("Критическая ошибка: VITE_API_BASE_URL не установлена!");
  // В реальном приложении здесь можно было бы показать заглушку.
}

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Базовый URL нашего бэкенда
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Перехватчик ЗАПРОСА ---
// Добавляет токен к каждому исходящему запросу
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Перехватчик ОТВЕТА ---
// Обрабатывает ошибки, в частности 401
apiClient.interceptors.response.use(
  (response) => response, // Если ответ успешный, просто возвращаем его
  async (error) => {
    const originalRequest = error.config;
    
    // Проверяем, что ошибка - 401 и это не повторный запрос
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Помечаем запрос как повторный

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
            // Если нет refresh токена, разлогиниваем
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // 1. Запрашиваем и получаем новые токены
        const { data } = await axios.post(`${API_BASE_URL}/auth/jwt/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = data.access;
        const newRefreshToken = data.refresh;
        
        // 2. Сохраняем новый токен в стор
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
        
        // 3. Обновляем заголовок в оригинальном запросе
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // 4. Повторяем оригинальный запрос с новым токеном
        return apiClient(originalRequest);

      } catch (_error) {
        // Если при обновлении токена произошла ошибка (например, refreshToken тоже просрочен)
        useAuthStore.getState().logout();
        window.location.href = '/login'; // Перенаправляем на страницу входа
        return Promise.reject(_error);
      }
    }
    
    return Promise.reject(error);
  }
);

export { apiClient, API_BASE_URL };