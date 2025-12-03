// frontend/src/pages/ConsumptionReportPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import Select from 'react-select';
import { useTheme } from '../context/ThemeProvider';

function ConsumptionReportPage() {
    const { theme } = useTheme();
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

    // Кастомные стили для React Select (адаптивные для темной темы)
    const isDark = theme === 'dark';
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: isDark ? '#374151' : '#ffffff',
            borderColor: state.isFocused 
                ? (isDark ? '#60a5fa' : '#3b82f6')
                : (isDark ? '#4b5563' : '#d1d5db'),
            boxShadow: state.isFocused 
                ? (isDark ? '0 0 0 1px #60a5fa' : '0 0 0 1px #3b82f6')
                : 'none',
            '&:hover': {
                borderColor: isDark ? '#60a5fa' : '#3b82f6',
            },
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: isDark ? '#374151' : '#ffffff',
            border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? (isDark ? '#2563eb' : '#3b82f6')
                : state.isFocused
                ? (isDark ? '#4b5563' : '#f3f4f6')
                : 'transparent',
            color: isDark ? '#f3f4f6' : '#111827',
            '&:active': {
                backgroundColor: isDark ? '#2563eb' : '#3b82f6',
            },
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: isDark ? '#f3f4f6' : '#111827',
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: isDark ? '#f3f4f6' : '#111827',
            '&:hover': {
                backgroundColor: isDark ? '#ef4444' : '#dc2626',
                color: '#ffffff',
            },
        }),
        input: (base) => ({
            ...base,
            color: isDark ? '#f3f4f6' : '#111827',
        }),
        placeholder: (base) => ({
            ...base,
            color: isDark ? '#9ca3af' : '#6b7280',
        }),
        singleValue: (base) => ({
            ...base,
            color: isDark ? '#f3f4f6' : '#111827',
        }),
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-50">Сводный отчет по расходу</h1>
            
            {/* --- ПАНЕЛЬ ФИЛЬТРОВ --- */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Объекты</label>
                    <Select
                        isMulti
                        options={facilities}
                        value={filters.selectedFacilities}
                        onChange={handleFacilitiesChange}
                        placeholder="Выберите объекты..."
                        styles={customSelectStyles}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">С даты</label>
                    <input 
                        type="date" 
                        name="startDate" 
                        value={filters.startDate} 
                        onChange={handleDateChange} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">По дату</label>
                    <input 
                        type="date" 
                        name="endDate" 
                        value={filters.endDate} 
                        onChange={handleDateChange} 
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                </div>
            </div>

            {/* Индикатор загрузки */}
            {loading && (
                <div className="text-center p-4 text-gray-600 dark:text-gray-400 mb-4">
                    Загрузка данных...
                </div>
            )}

            {/* --- ТАБЛИЦА С РЕЗУЛЬТАТОМ --- */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Реагент</th>
                                <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Суммарный расход</th>
                                <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Ед. изм.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {reportData.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan="3" className="text-center p-10 text-gray-500 dark:text-gray-400">
                                        {filters.selectedFacilities.length === 0 || !filters.startDate || !filters.endDate
                                            ? 'Выберите объекты и период для формирования отчета'
                                            : 'Нет данных для отображения за выбранный период'}
                                    </td>
                                </tr>
                            ) : (
                                reportData.map(item => (
                                    <tr 
                                        key={item.name}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors bg-white dark:bg-gray-800"
                                    >
                                        <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{item.name}</td>
                                        <td className="px-5 py-4 text-right font-mono text-sm text-gray-800 dark:text-gray-200 font-semibold">
                                            {item.total_quantity.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{item.unit}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ConsumptionReportPage;