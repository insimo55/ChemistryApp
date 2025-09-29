// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import apiClient, { API_BASE_URL } from '../api';
import { Eye, EyeOff } from "lucide-react";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // 1. Получаем токены
      const tokenRes = await apiClient.post(`${API_BASE_URL}/auth/jwt/create/`, { username, password });
      const { access, refresh } = tokenRes.data;
      setTokens(access, refresh); // Сохраняем оба токена

      // 2. Получаем пользователя
      // apiClient уже будет использовать новый токен благодаря перехватчику, который мы сейчас напишем
      const userRes = await apiClient.get(`${API_BASE_URL}/auth/users/me/`);
      setUser(userRes.data);

      navigate('/');// Перенаправляем на главную после успешного входа
    } catch (err) {
      setError('Неверный логин или пароль.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Вход в систему</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {/* Username */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
              Имя пользователя
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-6 relative">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Пароль
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline pr-10"
              required
            />

            {/* Кнопка-глазик */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;