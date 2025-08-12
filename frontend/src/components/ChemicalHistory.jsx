// frontend/src/components/ChemicalHistory.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api';

function ChemicalHistory({ chemical, facilityId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Состояния для отчета
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!chemical || !facilityId) return; // Защита от запуска без данных

            setLoading(true);
            setError('');
            try {
                // --- УЛУЧШЕННЫЙ ЗАПРОС ---
                // Делаем ОДИН запрос, используя наш кастомный фильтр 'facility' на бэкенде
                const params = new URLSearchParams({
                    facility: facilityId,
                    chemical: chemical.id,
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
    }, [chemical, facilityId]); // Эффект перезапустится, если изменятся chemical или facilityId

    if (loading) return <p className="text-center p-4">Загрузка истории...</p>;
    if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

    const handleCalculateReport = async () => {
        if (!startDate || !endDate) {
            alert("Пожалуйста, выберите начальную и конечную дату.");
            return;
        }
        setReportLoading(true);
        try {
            const params = new URLSearchParams({
                facility_id: facilityId,
                chemical_id: chemical.id,
                start_date: startDate,
                end_date: endDate,
            });
            const response = await apiClient.get(`/reports/inventory-period/?${params.toString()}`);
            setReport(response.data);
        } catch (error) {
            console.error("Failed to calculate report", error);
        } finally {
            setReportLoading(false);
        }
    };

    return (
        <div className="p-1"> {/* Небольшой общий padding */}
            <h3 className="text-xl font-bold mb-4 text-gray-800 px-1">История: {chemical.name}</h3>
            {/* --- БЛОК ДЛЯ ОТЧЕТА --- */}
            <div className="p-4 border rounded-md mb-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Отчет за период</h4>
                <div className="flex items-end gap-4">
                    <div>
                        <label className="text-xs">С даты</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-1 border rounded w-full"/>
                    </div>
                    <div>
                        <label className="text-xs">По дату</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-1 border rounded w-full"/>
                    </div>
                    <button onClick={handleCalculateReport} disabled={reportLoading} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400">
                        {reportLoading ? '...' : 'Сформировать'}
                    </button>
                </div>
                {report && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm border-t pt-4">
                        <strong>Начальный остаток:</strong> <span>{report.opening_balance}</span>
                        <strong className="text-green-600">Приход за период:</strong> <span className="text-green-600">{report.total_income}</span>
                        <strong className="text-red-600">Расход за период:</strong> <span className="text-red-600">{report.total_outcome}</span>
                        <strong>Конечный остаток:</strong> <span>{report.closing_balance}</span>
                    </div>
                )}
            </div>

            <strong className="block text-sm text-gray-500 mb-2">Движение по операциям</strong>
            
            {/* --- КОНТЕЙНЕР ДЛЯ ПРОКРУТКИ --- */}
            {/* Он задает высоту и включает overflow. У него НЕТ горизонтальных отступов. */}
            <div className="max-h-[40vh] overflow-y-auto">
            
                {/* --- КОНТЕЙНЕР ДЛЯ КОНТЕНТА --- */}
                {/* У него есть отступы, которые не дадут тексту прилипнуть к краям и скроллбару. */}
                <div className="space-y-2 pr-2"> {/* pr-2 - отступ справа от скроллбара */}
                    {history.length > 0 ? (
                        history.map(tx => {
                            const isIncome = tx.to_facility_id === parseInt(facilityId);
                            const quantitySign = isIncome ? '+' : '-';
                            const quantityColor = isIncome ? 'text-green-600' : 'text-red-600';

                            return (
                                <div key={tx.id} className="p-3 bg-gray-50 rounded-md border grid grid-cols-3 gap-2 items-center">
                                    <div className="text-sm text-gray-600">
                                        {new Date(tx.operation_date).toLocaleDateString('ru-RU')}
                                    </div>
                                    <div className={`font-semibold font-mono text-center text-lg ${quantityColor}`}>
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
                        <p className="text-center p-4 text-gray-500">История по этому реагенту на данном объекте отсутствует.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChemicalHistory;