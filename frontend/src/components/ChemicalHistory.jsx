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
                    start_date: `${startDate}T00:00:00`, 
                    end_date: `${endDate}T23:59:59`
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
            const response = await apiClient.get(`/transactions/?operation_uuid=${operation_uuid}`);
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

    if (loading) return <p className="text-center p-4 text-gray-900 dark:text-gray-100">Загрузка истории...</p>;
    if (error) return <p className="text-center p-4 text-red-600 dark:text-red-400">{error}</p>;

    

    return (
        <div className="p-4">
            <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-50">Движение: {chemical.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    за период с <span className="font-medium">{new Date(startDate).toLocaleDateString('ru-RU')}</span> по <span className="font-medium">{new Date(endDate).toLocaleDateString('ru-RU')}</span>
                </p>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-3">
                    {history.length > 0 ? (
                        history.map(tx => {
                            const isIncome = tx.to_facility_id === parseInt(facilityId);
                            const quantitySign = isIncome ? '+' : '-';
                            const quantityColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                            const bgColor = isIncome ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50';

                            return (
                                <div 
                                    key={tx.id} 
                                    className={`p-4 rounded-lg border ${bgColor} grid grid-cols-3 gap-4 items-center cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] dark:hover:bg-opacity-20`}
                                    onClick={() => handleRowClick(tx.operation_uuid)}
                                    title="Нажмите, чтобы посмотреть детали операции"
                                >
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        <div className="font-medium">
                                            {new Date(tx.operation_date).toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(tx.operation_date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                                        </div>
                                    </div>
                                    <div className={`font-bold font-mono text-lg text-center ${quantityColor}`}>
                                        {quantitySign} {tx.quantity}
                                    </div>
                                    <div className="text-xs text-right">
                                        <span className="inline-block px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize font-medium mb-1">
                                            {tx.transaction_type === 'add' ? 'Поступление' : tx.transaction_type === 'consume' ? 'Списание' : 'Перемещение'}
                                        </span>
                                        {tx.transaction_type === 'transfer' && (
                                            <div className="text-gray-600 dark:text-gray-400 mt-1 truncate text-xs">
                                                {isIncome ? `из "${tx.from_facility}"` : `в "${tx.to_facility}"`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">Движения по этому реагенту за выбранный период отсутствуют.</p>
                        </div>
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