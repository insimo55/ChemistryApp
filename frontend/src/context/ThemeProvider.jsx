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
        const root = window.document.documentElement; // Получаем <html> элемент

        root.classList.remove('light', 'dark'); // Сначала удаляем оба класса
        root.classList.add(theme); // Добавляем текущий класс темы

        // Сохраняем выбор в localStorage
        localStorage.setItem('theme', theme);
    }, [theme]); // Запускаем эффект, когда `theme` меняется

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