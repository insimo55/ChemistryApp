// frontend/src/components/RequisitionActionButtons.jsx
import React from 'react';
import apiClient from '../api';
import { useAuthStore } from '../store/auth';

// --- Компонент для одной кнопки, чтобы не повторять стили ---
const ActionButton = ({ onClick, text, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-500 hover:bg-blue-600',
        green: 'bg-green-500 hover:bg-green-600',
        red: 'bg-red-500 hover:bg-red-600',
        gray: 'bg-gray-500 hover:bg-gray-600',
    };
    return (
        <button
            onClick={onClick}
            className={`text-white font-bold py-2 px-4 rounded shadow-sm transition-colors duration-200 ${colorClasses[color]}`}
        >
            {text}
        </button>
    );
};


function RequisitionActionButtons({ requisition, onStatusChange }) {
    const { user } = useAuthStore();

    if (!requisition || !user) return null;

    const handleStatusChange = async (newStatus, confirmationText) => {
        const confirmationMessage = confirmationText || `Вы уверены, что хотите изменить статус на "${newStatus}"?`;
        if (!window.confirm(confirmationMessage)) {
            return;
        }
        try {
            const response = await apiClient.patch(`/requisitions/${requisition.id}/`, { status: newStatus });
            onStatusChange(response.data); // Передаем обновленную заявку родителю
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Не удалось изменить статус.");
        }
    };
    
    // --- РЕНДЕРИМ КНОПКИ В ЗАВИСИМОСТИ ОТ СТАТУСА И РОЛИ ---

    const renderButtons = () => {
        switch (requisition.status) {
            case 'draft':
                // Автор может отправить черновик
                if (user.id === requisition.created_by) {
                    return <ActionButton onClick={() => handleStatusChange('submitted')} text="Отправить на рассмотрение" color="green" />;
                }
                return null;

            case 'submitted':
            case 'reviewing':
                // Админ/логист могут утвердить или отклонить
                if (['admin', 'logistician'].includes(user.role)) {
                    return (
                        <div className="flex space-x-2">
                            <ActionButton onClick={() => handleStatusChange('approved')} text="Утвердить" color="green" />
                            <ActionButton onClick={() => handleStatusChange('cancelled')} text="Отклонить" color="red" />
                        </div>
                    );
                }
                return null;
            
            case 'approved':
                // Админ/логист могут взять в работу или отменить
                if (['admin', 'logistician'].includes(user.role)) {
                    return (
                         <div className="flex space-x-2">
                            <ActionButton onClick={() => handleStatusChange('in_progress')} text="Взять в исполнение" color="blue" />
                            <ActionButton onClick={() => handleStatusChange('cancelled')} text="Отменить" color="red" />
                        </div>
                    );
                }
                return null;

            case 'in_progress':
            case 'partially_completed':
                 // Админ/логист могут завершить или вернуть
                 if (['admin', 'logistician'].includes(user.role)) {
                    return (
                         <div className="flex space-x-2">
                            <ActionButton onClick={() => handleStatusChange('completed')} text="Завершить выполнение" color="green" />
                            <ActionButton onClick={() => handleStatusChange('approved')} text="Вернуть на утверждение" color="gray" />
                        </div>
                    );
                }
                return null;

            case 'completed':
            case 'cancelled':
            case 'overdue':
                // Админ может вернуть в работу закрытую или отмененную заявку
                if (user.role === 'admin') {
                    return <ActionButton onClick={() => handleStatusChange('in_progress')} text="Вернуть в работу" color="gray" />;
                }
                return null;

            default:
                return null;
        }
    };

    return (
        <div className="flex items-center">
            {renderButtons()}
        </div>
    );
}

export default RequisitionActionButtons;