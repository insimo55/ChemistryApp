// frontend/src/pages/ConsumptionReportPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import Select from 'react-select';

function ConsumptionReportPage() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Фильтры, которые меняются мгновенно
    const [filters, setFilters] = useState({
        selectedFacilities: [],
        startDate: '',
        endDate: '',
    });
    
    // Фильтры, которые используются для запроса (с задержкой)
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    
    const [facilities, setFacilities] = useState([]);

    // Загрузка справочника
    useEffect(() => {
        apiClient.get('/facilities/').then(res => {
            const options = (res.data.results || res.data).map(f => ({ value: f.id, label: f.name }));
            setFacilities(options);
        });
    }, []);

    // Эффект для "debounce"
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedFilters(filters), 500);
        return () => clearTimeout(timer);
    }, [filters]);

    // Функция загрузки данных, зависит от "отложенных" фильтров
    const generateReport = useCallback(async () => {
        const { selectedFacilities, startDate, endDate } = debouncedFilters;
        
        if (selectedFacilities.length === 0 || !startDate || !endDate) {
            setReportData([]);
            return;
        }
        
        setLoading(true);
        try {
            const params = new URLSearchParams();
            
            // По-прежнему ищем по `from_facility`, чтобы найти расход с нужных объектов
            selectedFacilities.forEach(f => params.append('facility_outcome', f.value)); 
            
            params.append('start_date', `${startDate}T00:00:00`);
            params.append('end_date', `${endDate}T23:59:59`);
            
            // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
            // Теперь запрашиваем ТОЛЬКО транзакции типа 'consume'
            params.append('transaction_type', 'consume');
            // Строку с 'transfer' мы удалили

            const response = await apiClient.get(`/transactions/?${params.toString()}`);
            const transactions = response.data.results || response.data;
            
            // Агрегация остается той же, но теперь она будет работать с правильными данными
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
            
            const sortedReport = Object.values(summary).sort((a, b) => a.name.localeCompare(b.name));
            setReportData(sortedReport);

        } catch (error) {
            console.error("Failed to generate report", error);
        } finally {
            setLoading(false);
        }
    }, [debouncedFilters]);

    // Запускаем отчет, когда "отложенные" фильтры изменились
    useEffect(() => {
        generateReport();
    }, [generateReport]);

    // Обработчики для полей
    const handleFacilitiesChange = (selectedOptions) => {
        setFilters(prev => ({...prev, selectedFacilities: selectedOptions || [] }));
    };
    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value }));
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Сводный отчет по расходу</h1>
            
            {/* --- ПАНЕЛЬ ФИЛЬТРОВ --- */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end dark:bg-neutral-700">
                <div className="lg:col-span-2 ">
                    <label className="block text-sm ">Объекты</label>
                    <Select
                        isMulti
                        options={facilities}
                        value={filters.selectedFacilities}
                        onChange={handleFacilitiesChange} 
                        className=' dark:text-black dark:bg-black'
                    />
                </div>
                <div>
                    <label className="block text-sm">С даты</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleDateChange} className="mt-1 w-full p-2 border rounded dark:text-black"/>
                </div>
                 <div>
                    <label className="block text-sm">По дату</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleDateChange} className="mt-1 w-full p-2 border rounded dark:text-black"/>
                </div>
                
            </div>

            {/* --- ТАБЛИЦА С РЕЗУЛЬТАТОМ --- */}
            <div className="bg-white shadow-md rounded-lg ">
                <table className="min-w-full dark:bg-neutral-700">
                    <thead className="bg-gray-50 dark:bg-neutral-700">
                        <tr>
                            <th className="p-3 text-left">Реагент</th>
                            <th className="p-3 text-right">Суммарный расход</th>
                            <th className="p-3 text-left">Ед. изм.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:bg-gray-600">
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