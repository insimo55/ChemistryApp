// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation  } from 'react-router-dom';
import  apiClient, {API_BASE_URL } from '../api';

function DashboardPage() {
  const [facilities, setFacilities] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation(); 

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Загружаем и объекты, и все остатки параллельно
        const [facilitiesRes, inventoryRes] = await Promise.all([
          apiClient.get('/facilities/'),
          apiClient.get('/inventory/')
        ]);
        setFacilities(facilitiesRes.data);
        const inventoryData = inventoryRes.data;
            // Сразу фильтруем нулевые остатки
        const filteredInventory = inventoryData.filter(item => parseFloat(item.quantity) !== 0);
        setInventory(filteredInventory);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // --- ОБНОВЛЕННАЯ ЛОГИКА ПОДСЧЕТА ---
  const facilityTotals = useMemo(() => {
    const totals = {};
    inventory.forEach(item => {
      const facilityId = item.facility.id;
      // Инициализируем объект для facility, если его еще нет
      if (!totals[facilityId]) {
        totals[facilityId] = {
          positionCount: 0,
          totalWeight: 0,
        };
      }
      
      // Считаем количество позиций
      totals[facilityId].positionCount += 1;
      
      // Суммируем вес/объем, если это возможно
      const unit = item.chemical.unit_of_measurement.toLowerCase();
      if (unit === 'кг' || unit === 'л' || unit === 'kg' || unit === 'l') {
        // Приводим к числу, на случай если с бэкенда пришла строка
        totals[facilityId].totalWeight += parseFloat(item.quantity);
      }
    });
    return totals;
  }, [inventory]);
  // --- КОНЕЦ ОБНОВЛЕННОЙ ЛОГИКИ ---


  if (loading) return <p>Загрузка объектов...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold dark:text-white">Объекты</h1>
                <Link 
                    to="/new-operation" 
                    state={{ from: location }} // Запоминаем, откуда пришли
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Провести операцию
                </Link>
            </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((facility) => {
          // Получаем готовый объект с посчитанными данными
          const totals = facilityTotals[facility.id] || { positionCount: 0, totalWeight: 0 };
          
          return (
            <Link 
              key={facility.id} 
              to={`/facilities/${facility.id}`} 
              className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow dark:bg-gray-400 "
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{facility.name}</h2>
              <p className="text-gray-500 capitalize mb-4 dark:text-white">{facility.type}</p>
              
              {/* --- ОБНОВЛЕННЫЙ ВЫВОД ДАННЫХ --- */}
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="font-semibold dark:text-white">{totals.positionCount} {getNoun(totals.positionCount, 'позиция', 'позиции', 'позиций')}</span>
                </div>
                {totals.totalWeight > 0 && (
                  <div className="flex items-center text-gray-700 ">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <span className="font-semibold dark:text-white">
                      {/* toLocaleString() для красивого разделения тысяч пробелами */}
                      {totals.totalWeight.toLocaleString('ru-RU')} кг/л
                    </span>
                  </div>
                )}
              </div>
              {/* --- КОНЕЦ ОБНОВЛЕННОГО ВЫВОДА --- */}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
// Маленькая утилита для правильного склонения слов
function getNoun(number, one, two, five) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) {
    return five;
  }
  n %= 10;
  if (n === 1) {
    return one;
  }
  if (n >= 2 && n <= 4) {
    return two;
  }
  return five;
}

export default DashboardPage;