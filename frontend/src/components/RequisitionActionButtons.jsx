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
     // --- ДОБАВЬТЕ ЭТОТ ЛОГ ---
    console.log("ActionButtons: Получены пропсы", { requisition, user });
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
                const allItemsCompleted = requisition.items.every(item => item.received_quantity >= item.quantity);

                 if (['admin', 'logistician'].includes(role)) {
                    return <ActionButton 
                onClick={() => handleStatusChange('completed')} 
                text="Завершить выполнение" 
                color="green"
                disabled={!allItemsCompleted} // <-- Добавляем disabled
            />;
                }
                return null;

            case 'completed':
            case 'cancelled':
            case 'overdue':
                if (role === 'admin') {
                    return <ActionButton onClick={() => handleStatusChange('draft')} text="Открыть заново (в черновик)" color="gray" />;
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