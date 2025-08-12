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
  const [facility, setFacility] = useState(null);
  const [inventoryForFacility, setInventoryForFacility] = useState([]); // Состояние для остатков ИМЕННО ЭТОГО ОБЪЕКТА
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyChemical, setHistoryChemical] = useState(null); // null - окно закрыто, объект chemical - открыто
  const location = useLocation();

  // --- НОВЫЕ СОСТОЯНИЯ ДЛЯ ОТЧЕТА ---
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

  // Функция для загрузки данных
  const fetchData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      // Загружаем инфо об объекте и его отфильтрованные остатки
      const [facilityRes, inventoryRes] = await Promise.all([
        apiClient.get(`/facilities/${id}/`),
        apiClient.get(`/inventory/?facility=${id}`) // <-- Этот запрос уже возвращает отфильтрованные данные
      ]);
      setFacility(facilityRes.data);
      const inventoryData = inventoryRes.data.results || inventoryRes.data;
      // Фильтруем массив, оставляя только те элементы, где количество НЕ равно 0
      const filteredInventory = inventoryData.filter(item => parseFloat(item.quantity) !== 0);
      setInventoryForFacility(filteredInventory); // <-- Сохраняем отфильтрованные данные в правильное состояние
    } catch (err) {
      setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]); // Зависимость от id, чтобы функция перезагружала данные при смене URL

  // Запускаем загрузку данных при первом рендере и при изменении id
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <p>Загрузка данных по объекту...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const handleCalculateReport = async () => {
      if (!startDate || !endDate) { alert("Выберите период."); return; }
      setReportLoading(true);
      try {
          const params = new URLSearchParams({
              facility_id: id,
              start_date: startDate,
              end_date: endDate,
          });
          const response = await apiClient.get(`/api/reports/facility-period/?${params.toString()}`);
          setReport(response.data);
      } finally {
          setReportLoading(false);
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/" className="text-blue-600 hover:underline">← К списку объектов</Link>
          <h1 className="text-3xl font-bold">{facility?.name}</h1>
        </div>
        {/* --- ОСТАВЛЯЕМ ТОЛЬКО ОДНУ КНОПКУ --- */}
        <Link 
            to="/new-operation" 
            state={{ from: location }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"
        >
            Провести операцию
        </Link>
      </div>
      {/* --- НОВЫЙ БЛОК ОТЧЕТА --- */}
      <div className="p-4 border rounded-lg mb-6 bg-white shadow-sm">
          <h3 className="font-semibold mb-2">Общий отчет по объекту за период</h3>
          <div className="flex items-end gap-4 mb-4">
              {/* ... (поля для startDate, endDate и кнопка "Сформировать", как в ChemicalHistory) ... */}
          </div>
          {report && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                      <div className="text-xs text-gray-500">Начальный остаток</div>
                      <div className="text-lg font-bold">{report.opening_balance_total}</div>
                  </div>
                  <div>
                      <div className="text-xs text-green-600">Приход</div>
                      <div className="text-lg font-bold text-green-600">+{report.total_income_period}</div>
                  </div>
                  <div>
                      <div className="text-xs text-red-600">Расход</div>
                      <div className="text-lg font-bold text-red-600">-{report.total_outcome_period}</div>
                  </div>
                    <div>
                      <div className="text-xs text-gray-500">Конечный остаток</div>
                      <div className="text-lg font-bold">{report.closing_balance_total}</div>
                  </div>
              </div>
          )}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Остатки на объекте</h2>
      
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Реагент</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Количество</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ед. изм.</th>
            </tr>
          </thead>
          <tbody>
            {/* Итерируемся по inventoryForFacility, который содержит только нужные нам данные */}
            {inventoryForFacility.length > 0 ? (
              inventoryForFacility.map((item) => (
                <tr 
                  key={item.id} 
                  // Добавляем условные классы
                  className={`hover:bg-gray-100 cursor-pointer ${
                    parseFloat(item.quantity) < 0 ? 'bg-red-100 text-red-800 font-semibold' : ''
                  }`}
                  onClick={() => setHistoryChemical(item.chemical)}
                  title="Нажмите, чтобы посмотреть историю операций"
                >
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.chemical.name}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.quantity}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.chemical.unit_of_measurement}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-10 text-gray-500">На этом объекте нет остатков.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <TransactionForm 
          onSuccess={fetchData} 
          onClose={() => setIsModalOpen(false)} 
        />
      </TransactionModal> */}
      <Modal isOpen={!!historyChemical} onClose={() => setHistoryChemical(null)}>
        {/* Рендерим компонент истории, только если historyChemical не null */}
        {historyChemical && <ChemicalHistory chemical={historyChemical} facilityId={id} />}
      </Modal>
    </div>
  );
}
export default FacilityDetailPage;