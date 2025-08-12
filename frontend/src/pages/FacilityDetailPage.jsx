// frontend/src/pages/FacilityDetailPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import apiClient from '../api';
// import TransactionModal from '../components/TransactionModal';
// import TransactionForm from '../components/TransactionForm';
import Modal from '../components/Modal'; // <-- Импортируем Modal
import ChemicalHistory from '../components/ChemicalHistory'; // <-- Импортируем новый компонент

function FacilityDetailPage() {
  const { id } = useParams(); // Получаем id объекта из URL
  const location = useLocation();
  // Состояния для основной информации об объекте
    const [facility, setFacility] = useState(null);
    const [loading, setLoading] = useState(true); // Общая загрузка страницы
    const [error, setError] = useState('');

    // Состояния для отчета (данные и даты)
    const [reportData, setReportData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false); // Загрузка только отчета
    
    // Устанавливаем даты по умолчанию
    const getFirstDayOfMonth = () => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    };
    const getToday = () => {
        return new Date().toISOString().split('T')[0];
    };
    const [startDate, setStartDate] = useState(getFirstDayOfMonth());
    const [endDate, setEndDate] = useState(getToday());

    // Состояние для модального окна истории по одному реагенту
    const [historyChemical, setHistoryChemical] = useState(null);
    
    // --- КОНЕЦ БЛОКА СОСТОЯНИЙ ---

  // const fetchData = useCallback(async () => {
  //   setError('');
  //   setLoading(true);
  //   try {
  //     // Загружаем инфо об объекте и его отфильтрованные остатки
  //     const [facilityRes, inventoryRes] = await Promise.all([
  //       apiClient.get(`/facilities/${id}/`),
  //       apiClient.get(`/inventory/?facility=${id}`) // <-- Этот запрос уже возвращает отфильтрованные данные
  //     ]);
  //     setFacility(facilityRes.data);
  //     const inventoryData = inventoryRes.data.results || inventoryRes.data;
  //     // Фильтруем массив, оставляя только те элементы, где количество НЕ равно 0
  //     const filteredInventory = inventoryData.filter(item => parseFloat(item.quantity) !== 0);
  //     setInventoryForFacility(filteredInventory); // <-- Сохраняем отфильтрованные данные в правильное состояние
  //   } catch (err) {
  //     setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [id]); // Зависимость от id, чтобы функция перезагружала данные при смене URL

  // // Запускаем загрузку данных при первом рендере и при изменении id
  // useEffect(() => {
  //   fetchData();
  // }, [fetchData]);

  // Функция для загрузки отчета
    const fetchReport = useCallback(async () => {
        if (!startDate || !endDate) return;
        setReportLoading(true);
        try {
            const params = new URLSearchParams({ facility_id: id, start_date: startDate, end_date: endDate });
            const response = await apiClient.get(`/reports/facility-detail/?${params.toString()}`);
            setReportData(response.data);
        } finally {
            setReportLoading(false);
        }
    }, [id, startDate, endDate]);
    
    // Загружаем отчет при изменении дат
    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Загрузка основной инфо об объекте
    useEffect(() => {
        apiClient.get(`/facilities/${id}/`).then(res => setFacility(res.data));
    }, [id]);

  if (loading) return <p>Загрузка данных по объекту...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  // const handleCalculateReport = async () => {
  //     if (!startDate || !endDate) { alert("Выберите период."); return; }
  //     setReportLoading(true);
  //     try {
  //         const params = new URLSearchParams({
  //             facility_id: id,
  //             start_date: startDate,
  //             end_date: endDate,
  //         });
  //         const response = await apiClient.get(`/reports/facility-period/?${params.toString()}`);
  //         setReport(response.data);
  //     } finally {
  //         setReportLoading(false);
  //     }
  // };

  return (
        <div>
            {/* --- ШАПКА СТРАНИЦЫ --- */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; К списку объектов</Link>
                    <h1 className="text-3xl font-bold">{facility?.name || 'Загрузка...'}</h1>
                </div>
                <Link 
                    to="/operation/new" 
                    state={{ from: location }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"
                >
                    Провести операцию
                </Link>
            </div>

            {/* --- БЛОК ВЫБОРА ПЕРИОДА И УПРАВЛЕНИЯ ОТЧЕТОМ --- */}
            <div className="p-4 border rounded-lg mb-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-2 text-gray-700">Отчет по движению реагентов</h3>
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-xs font-medium text-gray-600">С даты</label>
                        <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm w-full"/>
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-xs font-medium text-gray-600">По дату</label>
                        <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 p-2 border border-gray-300 rounded-md shadow-sm w-full"/>
                    </div>
                    <button onClick={fetchReport} disabled={reportLoading || !startDate || !endDate} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
                        {reportLoading ? 'Обновление...' : 'Обновить отчет'}
                    </button>
                </div>
            </div>

            {/* --- БЛОК С ОБЩИМИ ИТОГАМИ (SUMMARY) --- */}
            {reportLoading && <p className="text-center p-4">Загрузка отчета...</p>}
            {reportData && !reportLoading && (
                <div className="p-4 rounded-lg mb-6 bg-blue-50 border border-blue-200">
                    <h4 className="font-semibold mb-2 text-blue-800">Итого за период:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-sm text-gray-600">Начальный остаток</div>
                            <div className="text-xl font-bold text-gray-800">{reportData.summary.opening_balance}</div>
                        </div>
                        <div>
                            <div className="text-sm text-green-700">Приход</div>
                            <div className="text-xl font-bold text-green-700">+{reportData.summary.income}</div>
                        </div>
                        <div>
                            <div className="text-sm text-red-700">Расход</div>
                            <div className="text-xl font-bold text-red-700">-{reportData.summary.outcome}</div>
                        </div>
                         <div>
                            <div className="text-sm text-gray-600">Конечный остаток</div>
                            <div className="text-xl font-bold text-gray-800">{reportData.summary.closing_balance}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ОСНОВНАЯ ТАБЛИЦА С ДЕТАЛИЗАЦИЕЙ --- */}
            <h2 className="text-2xl font-semibold mb-4">Детализация по реагентам</h2>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Реагент</th>
                            <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Нач. остаток</th>
                            <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider text-green-600">Приход</th>
                            <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider text-red-600">Расход</th>
                            <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Кон. остаток</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {reportData?.details.map((item) => (
                            <tr key={item.chemical_id} className="hover:bg-gray-100 cursor-pointer" onClick={() => setHistoryChemical(item)} title="Нажмите, чтобы посмотреть детальное движение">
                                <td className="p-3 whitespace-nowrap">{item.chemical_name} <span className="text-xs text-gray-400">({item.unit})</span></td>
                                <td className="p-3 whitespace-nowrap text-right font-mono">{item.opening_balance}</td>
                                <td className="p-3 whitespace-nowrap text-right font-mono text-green-600">+{item.income}</td>
                                <td className="p-3 whitespace-nowrap text-right font-mono text-red-600">-{item.outcome}</td>
                                <td className={`p-3 whitespace-nowrap text-right font-mono font-bold ${parseFloat(item.closing_balance) < 0 ? 'text-red-600' : ''}`}>{item.closing_balance}</td>
                            </tr>
                        ))}
                         {(!reportData || reportData?.details.length === 0) && !reportLoading && (
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