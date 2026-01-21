import React from 'react';

// Стили для статусов рапортов
const reportStatusStyles = {
    processing: { text: 'В обработке', bg: 'bg-yellow-100', text_color: 'text-yellow-800' },
    success: { text: 'Успешно', bg: 'bg-green-100', text_color: 'text-green-800' },
    error: { text: 'Ошибка', bg: 'bg-red-100', text_color: 'text-red-800' },
    default: { text: 'Неизвестно', bg: 'bg-gray-100', text_color: 'text-gray-800' },
};

function StatusBadge({ status, errorMessage = '' }) {
    const style = reportStatusStyles[status] || reportStatusStyles.default;
    
    return (
        <span 
            className={`px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text_color}`}
            title={status === 'error' ? errorMessage : ''}
        >
            {style.text}
        </span>
    );
}

// --- ВАЖНО: ЭКСПОРТИРУЕМ ПО УМОЛЧАНИЮ ---
export default StatusBadge;