// frontend/src/pages/TransactionsPage.jsx
import React, { useEffect, useState, useMemo, useCallback  } from 'react';
import apiClient from '../api';
import Modal from '../components/Modal'; // Наше универсальное модальное окно
import OperationDetail from '../components/OperationDetail'; // Новый компонент для деталей

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]); // "Сырые" данные с бэкенда
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState(null);


  // Состояния для фильтров
  const [filters, setFilters] = useState({
    from_facility: '',
    to_facility: '',
    transaction_type: '',
    start_date: '',
    end_date: '',
  });

 // Состояния для выпадающих списков в фильтрах
  const [facilities, setFacilities] = useState([]);


   useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const facRes = await apiClient.get('/facilities/');
        setFacilities(facRes.data);
      } catch (err) {
        console.error("Failed to load facilities for filters", err);
      }
    };
    fetchFacilities();
  }, []);

   const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      // Формируем параметры запроса из состояния фильтров
      const params = new URLSearchParams();
      // Добавляем в запрос только те фильтры, у которых есть значение
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
                    // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
                    if (key === 'start_date') {
                        // Добавляем время "начало дня"
                        params.append(key, `${value}T00:00:00`);
                    } else if (key === 'end_date') {
                        // Добавляем время "конец дня"
                        params.append(key, `${value}T23:59:59`);
                    } else {
                        params.append(key, value);
                    }
                }
      });
      
      const response = await apiClient.get(`/transactions/?${params.toString()}`);
      setTransactions(response.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Зависимость от объекта filters

  // Загружаем транзакции при первом рендере и при изменении фильтров
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const handleActionSuccess = () => {
    setSelectedOperation(null);
    fetchTransactions();
  };
  const resetFilters = () => {
    setFilters({
      from_facility: '',
      to_facility: '',
      transaction_type: '',
      start_date: '',
      end_date: '',
    });
  };
  // Группируем транзакции по operation_uuid. Эта логика остается, она идеальна для нашей задачи.
  const groupedOperations = useMemo(() => {
    // 1. Проверка на пустой массив для избежания ошибок
    if (!transactions || transactions.length === 0) {
        return [];
    }

    // 2. Создаем Map для группировки.
    // Map - это как объект {}, но более надежный и производительный для таких задач.
    const groups = new Map();

    // 3. Проходим по всем транзакциям
    for (const tx of transactions) {
        const uuid = tx.operation_uuid;

        // 4. Если группы для этого UUID еще нет, создаем ее
        if (!groups.has(uuid)) {
            groups.set(uuid, []);
        }

        // 5. Добавляем текущую транзакцию в ее группу
        groups.get(uuid).push(tx);
    }

    // 6. Преобразуем Map в массив объектов, удобный для рендеринга
    const result = Array.from(groups.values()).map(items => ({
        // uuid нам нужен для уникального key в React
        uuid: items[0].operation_uuid,
        // items - это массив всех транзакций, входящих в одну операцию
        items: items
    }));
    
    // 7. Сортируем операции по дате, чтобы новые были вверху
    result.sort((a, b) => new Date(b.items[0].operation_date) - new Date(a.items[0].operation_date));

    return result;

  }, [transactions]);

  if (loading) return <p>Загрузка истории операций...</p>;

  

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">История операций</h1>
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Тип операции</label>
          <select name="transaction_type" value={filters.transaction_type} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
            <option value="">Все</option>
            <option value="add">Поступление</option>
            <option value="consume">Списание</option>
            <option value="transfer">Перемещение</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Объект (Откуда/Куда)</label>
          <select name="from_facility" value={filters.from_facility} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
            <option value="">Любой</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">С даты</label>
          <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">По дату</label>
          <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm" />
        </div>
        <button onClick={resetFilters} className="bg-gray-200 hover:bg-gray-300 p-2 rounded-md shadow-sm">Сбросить</button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Дата</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Тип</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Объекты (Откуда → Куда)</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Комментарий</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Позиций</th>
            </tr>
          </thead>
          <tbody>
            {groupedOperations.map(({ uuid, items }) => { // Деструктурируем объект
              const representative = items[0];
              return (
                <tr 
                  key={uuid} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedOperation(items)}
                >
                  <td className="px-5 py-5 border-b text-sm">{representative.operation_date 
    ? new Date(representative.operation_date).toLocaleString('ru-RU', { 
        year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      }) 
    : 'Нет даты'
}</td>
                  <td className="px-5 py-5 border-b text-sm capitalize">{representative.transaction_type}</td>
                  <td className="px-5 py-5 border-b text-sm">
                    {representative.from_facility || '—'} → {representative.to_facility || '—'}
                  </td>
                  <td className="px-5 py-5 border-b text-sm truncate max-w-sm" title={representative.comment}>
                    {representative.comment || '—'}
                  </td>
                   <td className="px-5 py-5 border-b text-sm font-medium">{items.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модальное окно для деталей. Оно откроется, когда selectedOperation не будет null */}
      <Modal isOpen={!!selectedOperation} onClose={() => setSelectedOperation(null)}>
        {selectedOperation && <OperationDetail items={selectedOperation} onActionSuccess={handleActionSuccess} />}
      </Modal>
    </div>
  );
}

export default TransactionsPage;