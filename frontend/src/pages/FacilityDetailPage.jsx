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
        return <p className="text-center p-10">Загрузка данных по объекту...</p>;
    }

    if (error) {
        return <p className="text-center p-10 text-red-500">{error}</p>;
    }
    
    return (
        <div>
            {/* --- ШАПКА СТРАНИЦЫ --- */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link to="/" className="text-blue-600 hover:underline text-sm dark:text-red-500">&larr; К списку объектов</Link>
                    <h1 className="text-3xl font-bold dark:text-white">{facility?.name || 'Загрузка...'}</h1>
                </div>
                <Link 
                    to="/new-operation" 
                    state={{ from: location }}
                    className="bg-green-600 hover:bg-green-700 hover:shadow-lg text-white font-bold py-2 px-4 rounded-lg dark:bg-blue-500 dark:hover:shadow-blue-300 transition duration-300">
                    Провести операцию
                </Link>
            </div>

            {/* --- БЛОК ВЫБОРА ПЕРИОДА И УПРАВЛЕНИЯ ОТЧЕТОМ --- */}
            <div className="p-4 border rounded-lg mb-6 bg-white shadow-sm dark:bg-neutral-800 dark:border-black">
                <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-100">Отчет по движению реагентов</h3>
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-xs font-medium text-gray-600 dark:text-gray-100">С даты</label>
                        <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm w-full dark:bg-gray-700"/>
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-xs font-medium text-gray-600 dark:text-gray-100">По дату</label>
                        <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm w-full dark:bg-gray-700"/>
                    </div>
                    {/* Кнопка "Обновить" теперь не нужна, так как отчет обновляется автоматически при смене дат */}
                </div>
            </div>

            {/* --- БЛОК С ОБЩИМИ ИТОГАМИ (SUMMARY) --- */}
            {loading && <p className="text-center p-4">Обновление отчета...</p>}
            {reportData && !loading && (
                <div className="p-4 rounded-lg mb-6 bg-blue-50 border border-blue-200 dark:bg-neutral-800 dark:border-black">
                    <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-400">Итого за период:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-sm text-gray-600 dark:text-gray-200">Начальный остаток</div>
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{reportData.summary.opening_balance}</div>
                        </div>
                        <div>
                            <div className="text-sm text-green-700 dark:text-green-400">Приход</div>
                            <div className="text-xl font-bold text-green-700 dark:text-green-400">+{reportData.summary.income}</div>
                        </div>
                        <div>
                            <div className="text-sm text-red-700 dark:text-red-500">Расход</div>
                            <div className="text-xl font-bold text-red-700 dark:text-red-500">-{reportData.summary.outcome}</div>
                        </div>
                         <div>
                            <div className="text-sm text-gray-600 dark:text-gray-200">Конечный остаток</div>
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{reportData.summary.closing_balance}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ОСНОВНАЯ ТАБЛИЦА С ДЕТАЛИЗАЦИЕЙ --- */}
            <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">Детализация по реагентам</h2>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-neutral-700 dark:border-neutral-700">
                        <tr>
                            <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase dark:text-gray-100">Реагент</th>
                            <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase dark:text-gray-100">Нач. остаток</th>
                            <th className="p-3 text-right text-xs font-semibold text-green-600 uppercase dark:text-green-400">Приход</th>
                            <th className="p-3 text-right text-xs font-semibold text-red-600 uppercase dark:text-red-500">Расход</th>
                            <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase dark:text-gray-100">Кон. остаток</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {reportData?.details.slice().sort((a, b) => a.chemical_name.localeCompare(b.chemical_name)).map((item) => (
                            <tr key={item.chemical_id} className="hover:bg-gray-100 cursor-pointer dark:bg-neutral-600 dark:hover:bg-neutral-500" onClick={() => setHistoryChemical(item)} title="Нажмите, чтобы посмотреть детальное движение">
                                <td className="p-3 whitespace-nowrap dark:text-gray-200">{item.chemical_name} <span className="text-xs text-gray-400 dark:text-neutral-300">({item.unit})</span></td>
                                <td className="p-3 whitespace-nowrap text-right font-mono dark:text-gray-100">{item.opening_balance}</td>
                                <td className="p-3 whitespace-nowrap text-right font-mono text-green-600 dark:text-green-400">+{item.income}</td>
                                <td className="p-3 whitespace-nowrap text-right font-mono text-red-600 dark:text-red-600">-{item.outcome}</td>
                                <td className={`p-3 whitespace-nowrap text-right font-mono font-bold dark:text-gray-100 ${parseFloat(item.closing_balance) < 0 ? 'text-red-600' : ''}`}>{item.closing_balance}</td>
                            </tr>
                        ))}
                         {(!reportData?.details || reportData?.details.length === 0) && !loading && (
                            <tr>
                                <td colSpan="5" className="text-center p-10 text-gray-500">Нет данных о движении реагентов за выбранный период.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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