// frontend/src/context/ThemeProvider.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Создаем контекст
const ThemeContext = createContext();

// Создаем провайдер, который будет "раздавать" состояние
export function ThemeProvider({ children }) {
    // 1. Берем тему из localStorage или используем 'light' по умолчанию
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // 2. useEffect будет срабатывать при изменении `theme`
    useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // фон для body
    if (theme === 'dark') {
        body.style.backgroundColor = '#000';
        body.style.color = '#fff'; // чтобы текст был читаем
    } else {
        body.style.backgroundColor = '#fff';
        body.style.color = '#000';
    }

    localStorage.setItem('theme', theme);
}, [theme]);
    // Функция для переключения темы
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // Значение, которое мы передаем всем дочерним компонентам
    const value = {
        theme,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// Кастомный хук для удобного доступа к контексту
export function useTheme() {
    return useContext(ThemeContext);
}