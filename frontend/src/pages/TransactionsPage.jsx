// frontend/src/pages/TransactionsPage.jsx
import React, { useEffect, useState, useMemo, useCallback  } from 'react';
import apiClient from '../api';
import Modal from '../components/Modal'; // Наше универсальное модальное окно
import OperationDetail from '../components/OperationDetail'; // Новый компонент для деталей
import { statusStyles } from '../utils/styleHelpers';

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]); // "Сырые" данные с бэкенда
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState(null);


  // Состояния для фильтров
  const [filters, setFilters] = useState({
        facility: '', // <-- Изменили имя
        transaction_type: '',
        start_date: '',
        end_date: '',
    });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
    
  const [facilities, setFacilities] = useState([]);


   // Загрузка справочников (один раз)
    useEffect(() => {
        apiClient.get('/facilities/').then(res => {
            setFacilities(res.data.results || res.data);
        });
    }, []); // <-- Пустой массив зависимостей

    // Эффект для debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
        }, 500); // 500 мс задержка
        return () => clearTimeout(timer);
    }, [filters]);

    // Загрузка транзакций (зависит от debouncedFilters)
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        // Формируем параметры из "отложенных" фильтров
        Object.entries(debouncedFilters).forEach(([key, value]) => {
            if (value) {
                if (key === 'start_date') {
                    params.append(key, `${value}T00:00:00`);
                } else if (key === 'end_date') {
                    params.append(key, `${value}T23:59:59`);
                } else {
                    params.append(key, value);
                }
            }
        });
        
        apiClient.get(`/transactions/?${params.toString()}`)
            .then(res => setTransactions(res.data.results || res.data))
            .catch(err => console.error("Failed to fetch transactions:", err))
            .finally(() => setLoading(false));
    }, [debouncedFilters]);

  const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
  
  const resetFilters = () => {
        setFilters({ facility: '', transaction_type: '', start_date: '', end_date: '' });
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

  const handleActionSuccess = () => {
    setSelectedOperation(null);
    fetchTransactions();
  };

  if (loading) return <p>Загрузка истории операций...</p>;

  

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 dark:text-gray-100">История операций</h1>
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end dark:bg-neutral-800">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Тип операции</label>
          <select name="transaction_type" value={filters.transaction_type} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700">
            <option value="">Все</option>
            <option value="add">Поступление</option>
            <option value="consume">Списание</option>
            <option value="transfer">Перемещение</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Объект (Откуда/Куда)</label>
          <select name="facility" value={filters.facility} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700">
            <option value="">Любой</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">С даты</label>
          <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">По дату</label>
          <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700" />
        </div>
        <button onClick={resetFilters} className="bg-gray-200 hover:bg-gray-300 p-2 rounded-md shadow-sm dark:bg-gray-700 dark:hover:bg-gray-400 transition-colors">Сбросить</button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead className='dark:bg-neutral-700'>
            <tr>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-gray-100">Дата</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-gray-100">Тип</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-gray-100">Объекты (Откуда → Куда)</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-gray-100">Комментарий</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-gray-100">Позиций</th>
            </tr>
          </thead>
          <tbody>
            {groupedOperations.map(({ uuid, items }) => { // Деструктурируем объект
              const representative = items[0];
              return (
                <tr 
                  key={uuid} 
                  className="hover:bg-gray-50 cursor-pointer dark:bg-gray-600 dark:hover:bg-neutral-500 transition-colors"
                  onClick={() => setSelectedOperation(items)}
                >
                  <td className="px-5 py-5 border-b text-sm dark:text-gray-200">{representative.operation_date 
    ? new Date(representative.operation_date).toLocaleString('ru-RU', { 
        year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      }) 
    : 'Нет даты'
}</td>
                  <td className="px-5 py-5 border-b text-sm capitalize dark:text-gray-200">{representative.transaction_type}</td>
                  <td className="px-5 py-5 border-b text-sm dark:text-gray-200">
                    {representative.from_facility || '—'} → {representative.to_facility || '—'}
                  </td>
                  <td className="px-5 py-5 border-b text-sm truncate max-w-sm dark:text-gray-200" title={representative.comment}>
                    {representative.comment || '—'}
                  </td>
                   <td className="px-5 py-5 border-b text-sm font-medium dark:text-gray-200">{items.length}</td>
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