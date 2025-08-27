// frontend/src/components/RequisitionActionButtons.jsx
import React from 'react';
import apiClient from '../api';
import { useAuthStore } from '../store/auth';

// --- Компонент для одной кнопки, чтобы не повторять стили ---
const ActionButton = ({ onClick, text, color = 'blue', disabled = false, title = '' }) => {
    // Базовые стили для всех кнопок
    const baseClasses = "text-white font-bold py-2 px-4 rounded shadow-sm transition-colors duration-200";

    // Стили для разных цветов
    const colorClasses = {
        blue: 'bg-blue-500 hover:bg-blue-600',
        green: 'bg-green-500 hover:bg-green-600',
        red: 'bg-red-500 hover:bg-red-600',
        gray: 'bg-gray-500 hover:bg-gray-600',
    };
    
    // Стили для неактивного состояния
    const disabledClasses = "bg-gray-400 cursor-not-allowed";

    // Собираем итоговый className
    const finalClassName = `
        ${baseClasses} 
        ${disabled ? disabledClasses : colorClasses[color]}
    `;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={finalClassName.trim()} // .trim() убирает лишние пробелы
        >
            {text}
        </button>
    );
};


function RequisitionActionButtons({ requisition, onStatusChange }) {
    const { user } = useAuthStore();
     // --- ДОБАВЬТЕ ЭТОТ ЛОГ ---
    console.log("ActionButtons: Получены пропсы", { requisition, user });
    if (!requisition || !user){
         console.log("ActionButtons: Рендер отменен, так как requisition или user отсутствуют.");
     return null;
    }

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
        const { role, id: userId } = user;
        const { status, created_by } = requisition;

        switch (status) {
            case 'draft':
                if (userId === created_by) {
                    return <ActionButton onClick={() => handleStatusChange('submitted')} text="Отправить на рассмотрение" color="green" />;
                }
                return null;

            case 'submitted':
                if (['admin', 'logistician'].includes(role)) {
                    return <ActionButton onClick={() => handleStatusChange('reviewing')} text="Взять на рассмотрение" color="blue" />;
                }
                return null;
            
            case 'reviewing':
                if (['admin', 'logistician'].includes(role)) {
                    return (
                        <div className="flex space-x-2">
                            <ActionButton onClick={() => handleStatusChange('approved')} text="Утвердить" color="green" />
                            <ActionButton onClick={() => handleStatusChange('needs_revision')} text="Отправить на доработку" color="gray" />
                            <ActionButton onClick={() => handleStatusChange('cancelled')} text="Отклонить" color="red" />
                        </div>
                    );
                }
                return null;

            case 'needs_revision':
                if (userId === created_by) {
                    return <ActionButton onClick={() => handleStatusChange('submitted')} text="Повторно отправить" color="green" />;
                }
                return null;

            case 'approved':
                if (['admin', 'logistician'].includes(role)) {
                    return (
                        <div className="flex space-x-2">
                            <ActionButton onClick={() => handleStatusChange('in_progress')} text="Взять в исполнение" color="blue" />
                            <ActionButton onClick={() => handleStatusChange('submitted')} text="Отменить утверждение" color="gray" />
                        </div>
                    );
                }
                return null;

            case 'in_progress':
            case 'partially_completed':
                if (['admin', 'logistician'].includes(user.role)) {
                    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
                    // Проверяем, все ли позиции в заявке выполнены
                    const allItemsCompleted = requisition.items.every(
                        item => parseFloat(item.received_quantity) >= parseFloat(item.quantity)
                    );

                    return (
                         <div className="flex space-x-2">
                            <ActionButton 
                                onClick={() => handleStatusChange('completed')} 
                                text="Завершить выполнение" 
                                color="green"
                                // Кнопка будет неактивна, если не все позиции выполнены
                                disabled={!allItemsCompleted} 
                                title={!allItemsCompleted ? 'Сначала нужно принять все позиции' : ''}
                            />
                            <ActionButton 
                                onClick={() => handleStatusChange('approved')} 
                                text="Вернуть на утверждение" 
                                color="gray" 
                            />
                        </div>
                    );
                }
                return null;

            case 'completed':
            case 'cancelled':
            case 'overdue':
                
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