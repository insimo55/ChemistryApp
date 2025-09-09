// frontend/src/pages/ConsumptionReportPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api';
// Можно использовать мульти-селект компонент для удобства, например, react-select
// npm install react-select
import Select from 'react-select';

function ConsumptionReportPage() {
    // --- СОСТОЯНИЯ ---
    const [reportData, setReportData] = useState([]); // Сводные данные
    const [loading, setLoading] = useState(false);
    
    // Фильтры
    const [selectedFacilities, setSelectedFacilities] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Справочники
    const [facilities, setFacilities] = useState([]);

    // Загрузка справочника объектов
    useEffect(() => {
        apiClient.get('/api/facilities/').then(res => {
            // Преобразуем для react-select
            const options = (res.data.results || res.data).map(f => ({ value: f.id, label: f.name }));
            setFacilities(options);
        });
    }, []);

    // Функция для загрузки и обработки данных
    const handleGenerateReport = async () => {
        if (selectedFacilities.length === 0 || !startDate || !endDate) {
            alert("Выберите хотя бы один объект и укажите период.");
            return;
        }
        setLoading(true);
        try {
            // Формируем параметры запроса
            const params = new URLSearchParams();
            selectedFacilities.forEach(f => params.append('from_facility', f.value));
            params.append('start_date', `${startDate}T00:00:00`);
            params.append('end_date', `${endDate}T23:59:59`);
            params.append('transaction_type', 'consume'); // Нас интересует только расход

            const response = await apiClient.get(`/api/transactions/?${params.toString()}`);
            const transactions = response.data.results || response.data;
            
            // --- АГРЕГАЦИЯ НА ФРОНТЕНДЕ ---
            const summary = {};
            transactions.forEach(tx => {
                const chemId = tx.chemical.id;
                if (!summary[chemId]) {
                    summary[chemId] = {
                        name: tx.chemical.name,
                        unit: tx.chemical.unit_of_measurement,
                        total_quantity: 0
                    };
                }
                summary[chemId].total_quantity += parseFloat(tx.quantity);
            });
            
            // Преобразуем в массив и сортируем
            const sortedReport = Object.values(summary).sort((a, b) => a.name.localeCompare(b.name));
            setReportData(sortedReport);

        } catch (error) {
            console.error("Failed to generate report", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Сводный отчет по расходу</h1>
            
            {/* --- ПАНЕЛЬ ФИЛЬТРОВ --- */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2">
                    <label className="block text-sm">Объекты</label>
                    <Select
                        isMulti
                        options={facilities}
                        value={selectedFacilities}
                        onChange={setSelectedFacilities}
                        placeholder="Выберите один или несколько объектов..."
                    />
                </div>
                <div>
                    <label className="block text-sm">С даты</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full p-2 border rounded"/>
                </div>
                 <div>
                    <label className="block text-sm">По дату</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full p-2 border rounded"/>
                </div>
                <button onClick={handleGenerateReport} disabled={loading} className="bg-blue-600 text-white p-2 rounded w-full lg:w-auto">
                    {loading ? 'Загрузка...' : 'Сформировать'}
                </button>
            </div>

            {/* --- ТАБЛИЦА С РЕЗУЛЬТАТОМ --- */}
            <div className="bg-white shadow-md rounded-lg">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">Реагент</th>
                            <th className="p-3 text-right">Суммарный расход</th>
                            <th className="p-3 text-left">Ед. изм.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {reportData.map(item => (
                            <tr key={item.name}>
                                <td className="p-3">{item.name}</td>
                                <td className="p-3 text-right font-mono">{item.total_quantity.toLocaleString('ru-RU')}</td>
                                <td className="p-3">{item.unit}</td>
                            </tr>
                        ))}
                        {reportData.length === 0 && !loading && (
                            <tr><td colSpan="3" className="text-center p-10 text-gray-500">Нет данных для отображения.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ConsumptionReportPage;