// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api';
import TransactionModal from '../components/TransactionModal';
import TransactionForm from '../components/TransactionForm';

function DashboardPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Состояние для модального окна

  // useCallback - для мемоизации функции, чтобы она не пересоздавалась при каждом рендере
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/inventory/');
      setInventory(response.data);
    } catch (err) {
      setError('Не удалось загрузить данные об остатках.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  if (error) return <p className="text-red-500">{error}</p>;


  return (
    <div className="relative h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Текущие остатки</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
        >
          + Новая операция
        </button>
      </div>
      
      {/* Таблица */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        {loading ? (
            <p className="text-center p-10">Загрузка...</p>
        ) : (
            <table className="min-w-full leading-normal">
                {/* thead и tbody как и раньше */}
                <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Объект</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Реагент</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Количество</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ед. изм.</th>
            </tr>
          </thead>
                <tbody>
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.facility.name}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.chemical.name}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.quantity}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.chemical.unit_of_measurement}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-10">Нет данных об остатках</td>
              </tr>
            )}
          </tbody>
            </table>
        )}
      </div>

      {/* Модальное окно */}
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <TransactionForm 
          onSuccess={fetchInventory} // Передаем функцию обновления данных
          onClose={() => setIsModalOpen(false)} 
        />
      </TransactionModal>
    </div>

  );
}

export default DashboardPage;