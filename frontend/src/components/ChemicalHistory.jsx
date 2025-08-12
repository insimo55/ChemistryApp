// frontend/src/components/ChemicalHistory.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import Modal from './Modal'; // Импортируем Modal для вложенного окна
import OperationDetail from './OperationDetail'; // Импортируем наш компонент с деталями



function ChemicalHistory({ chemical, facilityId, startDate, endDate }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Состояния для отчета
    const [selectedOperationItems, setSelectedOperationItems] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!chemical || !facilityId || !startDate || !endDate) return; // Защита от запуска без данных

            setLoading(true);
            setError('');
            try {
                // --- УЛУЧШЕННЫЙ ЗАПРОС ---
                // Делаем ОДИН запрос, используя наш кастомный фильтр 'facility' на бэкенде
                const params = new URLSearchParams({
                    facility: facilityId,
                    chemical: chemical.id,
                    start_date: startDate,
                    end_date: endDate,
                });
                const response = await apiClient.get(`/transactions/?${params.toString()}`);
                
                // Сортируем на клиенте, чтобы быть уверенными в порядке
                const sortedHistory = response.data.sort((a, b) => new Date(b.operation_date) - new Date(a.operation_date));
                setHistory(sortedHistory);
            } catch (err) {
                setError('Не удалось загрузить историю.');
                console.error("Failed to fetch chemical history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [chemical, facilityId, startDate, endDate]); // Эффект перезапустится, если изменятся chemical или facilityId


    // Функция для загрузки ВСЕХ транзакций одной операции по ее UUID
    const handleRowClick = async (operation_uuid) => {
        try {
            const response = await apiClient.get(`/api/transactions/?operation_uuid=${operation_uuid}`);
            setSelectedOperationItems(response.data.results || response.data);
        } catch (err) {
            console.error("Failed to fetch operation details", err);
        }
    };
    
    // Функция, которую мы передадим в OperationDetail, чтобы он мог обновить наш список
    const handleActionSuccess = () => {
        setSelectedOperationItems(null); // Закрываем вложенное окно
        // Здесь можно было бы перезагрузить историю, но пока просто закроем
    };

    if (loading) return <p className="text-center p-4">Загрузка истории...</p>;
    if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

    

    return (
        <div className="p-2">
            <h3 className="text-xl font-bold mb-1 text-gray-800">Движение: {chemical.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
                за период с {new Date(startDate).toLocaleDateString('ru-RU')} по {new Date(endDate).toLocaleDateString('ru-RU')}
            </p>
            
            <div className="max-h-[60vh] overflow-y-auto">
                <div className="space-y-2 pr-2">
                    {history.length > 0 ? (
                        history.map(tx => {
                            const isIncome = tx.to_facility_id === parseInt(facilityId);
                            const quantitySign = isIncome ? '+' : '-';
                            const quantityColor = isIncome ? 'text-green-600' : 'text-red-600';

                            return (
                                <div 
                                key={tx.id} 
                                className="p-3 bg-gray-50 rounded-md border grid grid-cols-3 gap-2 items-center cursor-pointer hover:bg-gray-100"
                                onClick={() => handleRowClick(tx.operation_uuid)}
                                title="Нажмите, чтобы посмотреть детали операции"
                            >
                                    <div className="text-gray-600">
                                        {new Date(tx.operation_date).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                    </div>
                                    <div className={`font-semibold font-mono text-center ${quantityColor}`}>
                                        {quantitySign} {tx.quantity}
                                    </div>
                                    <div className="text-xs text-right text-gray-500 capitalize">
                                        {tx.transaction_type}
                                        {tx.transaction_type === 'transfer' && (
                                            <div className="truncate">
                                                {isIncome ? `из "${tx.from_facility}"` : `в "${tx.to_facility}"`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center p-4 text-gray-500">Движения по этому реагенту за выбранный период отсутствуют.</p>
                    )}
                </div>
            </div>
            <Modal isOpen={!!selectedOperationItems} onClose={() => setSelectedOperationItems(null)}>
                {selectedOperationItems && (
                    <OperationDetail 
                        items={selectedOperationItems} 
                        onActionSuccess={handleActionSuccess} 
                    />
                )}
            </Modal>
        </div>
    );
}

export default ChemicalHistory;