// frontend/src/pages/FacilityDetailPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import apiClient from '../api';
import Modal from '../components/Modal';
import ChemicalHistory from '../components/ChemicalHistory';

// --- Хелперы для дат ---
const getFirstDayOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};
const getToday = () => {
    return new Date().toISOString().split('T')[0];
};


function FacilityDetailPage() {
    const { id } = useParams();
    const location = useLocation();

    // --- ЕДИНЫЙ БЛОК СОСТОЯНИЙ ---
    const [facility, setFacility] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true); // Один флаг для общей загрузки
    const [error, setError] = useState('');
    
    // Состояния для управления отчетом
    const [startDate, setStartDate] = useState(getFirstDayOfMonth());
    const [endDate, setEndDate] = useState(getToday());

    // Состояние для модального окна истории
    const [historyChemical, setHistoryChemical] = useState(null);

    // --- ЕДИНАЯ ФУНКЦИЯ ЗАГРУЗКИ ДАННЫХ ---
    const fetchData = useCallback(async () => {
        if (!startDate || !endDate) return;

        setLoading(true);
        setError('');
        try {
            // Загружаем и инфо об объекте, и отчет параллельно
            const params = new URLSearchParams({ facility_id: id, start_date: `${startDate}T00:00:00`, end_date: `${endDate}T23:59:59` });
            const [facilityRes, reportRes] = await Promise.all([
                apiClient.get(`/facilities/${id}/`),
                apiClient.get(`/reports/facility-detail/?${params.toString()}`)
            ]);

            setFacility(facilityRes.data);
            setReportData(reportRes.data);

        } catch (err) {
            setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, startDate, endDate]); // Зависимости

    // Запускаем загрузку данных при первом рендере и при изменении зависимостей
    useEffect(() => {
        fetchData();
    }, [fetchData]);


    // --- РЕНДЕРИНГ ---
    if (loading && !reportData) { // Показываем полную загрузку только в первый раз
        return <p className="text-center p-10 text-gray-900 dark:text-gray-100">Загрузка данных по объекту...</p>;
    }

    if (error) {
        return <p className="text-center p-10 text-red-600 dark:text-red-400">{error}</p>;
    }
    
    return (
        <div>
            {/* --- ШАПКА СТРАНИЦЫ --- */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link to="/" className="text-blue-600 hover:text-blue-700 hover:underline text-sm dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        К списку объектов
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-50">{facility?.name || 'Загрузка...'}</h1>
                </div>
                <Link 
                    to="/new-operation" 
                    state={{ from: location }}
                    className="bg-green-600 hover:bg-green-700 hover:shadow-lg text-white font-bold py-2 px-4 rounded-lg dark:bg-green-600 dark:hover:bg-green-500 dark:hover:shadow-green-500/50 transition-all shadow-sm">
                    Провести операцию
                </Link>
            </div>

            {/* --- БЛОК ВЫБОРА ПЕРИОДА И УПРАВЛЕНИЯ ОТЧЕТОМ --- */}
            <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg mb-6 bg-white dark:bg-gray-800 shadow-sm">
                <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Отчет по движению реагентов</h3>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">С даты</label>
                        <input 
                            id="start-date" 
                            type="date" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">По дату</label>
                        <input 
                            id="end-date" 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                    </div>
                </div>
            </div>

            {/* --- БЛОК С ОБЩИМИ ИТОГАМИ (SUMMARY) --- */}
            {loading && <p className="text-center p-4 text-gray-600 dark:text-gray-400">Обновление отчета...</p>}
            {reportData && !loading && (
    <div className="
        p-4 md:p-5 
        rounded-xl mb-6 
        bg-gradient-to-br from-blue-50 to-blue-100 
        dark:from-blue-900/20 dark:to-blue-800/20
        border border-blue-200 dark:border-blue-800/50 
        shadow-sm
    ">
        <h4 className="font-semibold mb-3 md:mb-4 text-blue-800 dark:text-blue-300 text-lg md:text-xl">
            Итого за период:
        </h4>

        {/* Мобильная версия: карточки одна под другой */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">

            {/* Начальный остаток */}
            <div className="
                bg-white dark:bg-gray-800/50 
                p-4 rounded-lg 
                border border-blue-200 dark:border-blue-700/50
                flex flex-col items-center
            ">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wide">
                    Начальный остаток
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {reportData.summary.opening_balance}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">кг</div>
            </div>

            {/* Приход */}
            <div className="
                bg-white dark:bg-gray-800/50 
                p-4 rounded-lg 
                border border-green-200 dark:border-green-700/50
                flex flex-col items-center
            ">
                <div className="text-xs text-green-700 dark:text-green-400 mb-1 uppercase tracking-wide">
                    Приход
                </div>
                <div className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">
                    +{reportData.summary.income}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">кг</div>
            </div>

            {/* Расход */}
            <div className="
                bg-white dark:bg-gray-800/50 
                p-4 rounded-lg 
                border border-red-200 dark:border-red-700/50
                flex flex-col items-center
            ">
                <div className="text-xs text-red-700 dark:text-red-400 mb-1 uppercase tracking-wide">
                    Расход
                </div>
                <div className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-400">
                    -{reportData.summary.outcome}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">кг</div>
            </div>

            {/* Конечный остаток */}
            <div className="
                bg-white dark:bg-gray-800/50 
                p-4 rounded-lg 
                border border-blue-200 dark:border-blue-700/50
                flex flex-col items-center
            ">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wide">
                    Конечный остаток
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {reportData.summary.closing_balance}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">кг</div>
            </div>
        </div>
    </div>
)}
            {/* {reportData && !loading && (
                <div className="p-5 rounded-lg mb-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                    <h4 className="font-semibold mb-4 text-blue-800 dark:text-blue-300">Итого за период:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-blue-200 dark:border-blue-700/50 text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wide">Начальный остаток</div>
                            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{reportData.summary.opening_balance}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">кг</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-green-200 dark:border-green-700/50 text-center">
                            <div className="text-xs text-green-700 dark:text-green-400 mb-1 uppercase tracking-wide">Приход</div>
                            <div className="md:text-2xl font-bold text-green-700 dark:text-green-400 text-xl">+{reportData.summary.income}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">кг</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-red-200 dark:border-red-700/50 text-center">
                            <div className="text-xs text-red-700 dark:text-red-400 mb-1 uppercase tracking-wide">Расход</div>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-400">-{reportData.summary.outcome}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">кг</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-blue-200 dark:border-blue-700/50 text-center">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wide">Конечный остаток</div>
                            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{reportData.summary.closing_balance}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">кг</div>
                        </div>
                    </div>
                </div>
            )} */}

            {/* --- ОСНОВНАЯ ТАБЛИЦА С ДЕТАЛИЗАЦИЕЙ --- */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Детализация по реагентам</h2>
            {/* Мобильные карточки */}
<div className="space-y-4 md:hidden">
    {reportData?.details.map(item => (
        <div
            key={item.chemical_id}
            onClick={() => setHistoryChemical(item)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm cursor-pointer hover:shadow-md transition"
        >
            <div className="flex justify-between items-center mb-2">
                <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                        {item.chemical_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.unit}
                    </div>
                </div>

                <div className={`text-right font-bold ${
                    parseFloat(item.closing_balance) < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-800 dark:text-gray-100'
                }`}>
                    {item.closing_balance}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                <div className="text-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Нач.</div>
                    <div className="font-mono">{item.opening_balance}</div>
                </div>
                <div className="text-center bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                    <div className="text-xs text-green-600 dark:text-green-400">Приход</div>
                    <div className="font-mono text-green-600 dark:text-green-400">
                        +{item.income}
                    </div>
                </div>
                <div className="text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                    <div className="text-xs text-red-600 dark:text-red-400">Расход</div>
                    <div className="font-mono text-red-600 dark:text-red-400">
                        -{item.outcome}
                    </div>
                </div>
            </div>
        </div>
    ))}

    {(!reportData?.details || reportData?.details.length === 0) && !loading && (
        <p className="text-center text-gray-500 dark:text-gray-400 p-4">
            Нет данных о движении реагентов.
        </p>
    )}
</div>

{/* Десктоп таблица */}
<div className="hidden md:block bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
    <table className="min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
                <th className="px-5 py-3 border-b text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Реагент</th>
                <th className="px-5 py-3 border-b text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Нач. остаток</th>
                <th className="px-5 py-3 border-b text-right text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Приход</th>
                <th className="px-5 py-3 border-b text-right text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Расход</th>
                <th className="px-5 py-3 border-b text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Кон. остаток</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {reportData?.details.map(item => (
                <tr
                    key={item.chemical_id}
                    onClick={() => setHistoryChemical(item)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition"
                >
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{item.chemical_name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({item.unit})</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm">{item.opening_balance}</td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-green-600 dark:text-green-400">+{item.income}</td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-red-600 dark:text-red-400">-{item.outcome}</td>
                    <td className={`px-5 py-4 text-right font-mono text-sm font-bold ${
                        parseFloat(item.closing_balance) < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-800 dark:text-gray-100'
                    }`}>
                        {item.closing_balance}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>
            {/* <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Реагент</th>
                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Нач. остаток, кг</th>
                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Приход, кг</th>
                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Расход, кг</th>
                            <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Кон. остаток, кг</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reportData?.details.slice().sort((a, b) => a.chemical_name.localeCompare(b.chemical_name)).map((item) => (
                            <tr 
                                key={item.chemical_id} 
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors bg-white dark:bg-gray-800" 
                                onClick={() => setHistoryChemical(item)} 
                                title="Нажмите, чтобы посмотреть детальное движение"
                            >
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    <span className="font-medium">{item.chemical_name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({item.unit})</span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-sm text-gray-700 dark:text-gray-300">{item.opening_balance}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-sm text-green-600 dark:text-green-400 font-medium">+{item.income}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-sm text-red-600 dark:text-red-400 font-medium">-{item.outcome}</td>
                                <td className={`px-5 py-4 whitespace-nowrap text-right font-mono text-sm font-bold dark:font-semibold ${parseFloat(item.closing_balance) < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                    {item.closing_balance}
                                </td>
                            </tr>
                        ))}
                         {(!reportData?.details || reportData?.details.length === 0) && !loading && (
                            <tr>
                                <td colSpan="5" className="text-center p-10 text-gray-500 dark:text-gray-400">
                                    Нет данных о движении реагентов за выбранный период.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div> */}

            {/* --- МОДАЛЬНОЕ ОКНО С ИСТОРИЕЙ ОПЕРАЦИЙ --- */}
            <Modal isOpen={!!historyChemical} onClose={() => setHistoryChemical(null)}>
                {historyChemical && (
                    <ChemicalHistory 
                        chemical={{ id: historyChemical.chemical_id, name: historyChemical.chemical_name }} 
                        facilityId={id}
                        startDate={startDate}
                        endDate={endDate}
                    />
                )}
            </Modal>
        </div>
    );
}

export default FacilityDetailPage;