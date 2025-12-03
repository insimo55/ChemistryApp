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

  if (loading) return <p className="text-center p-10 text-gray-900 dark:text-gray-100">Загрузка истории операций...</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">История операций</h1>
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Тип операции</label>
          <select name="transaction_type" value={filters.transaction_type} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
            <option value="">Все</option>
            <option value="add">Поступление</option>
            <option value="consume">Списание</option>
            <option value="transfer">Перемещение</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Объект (Откуда/Куда)</label>
          <select name="facility" value={filters.facility} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
            <option value="">Любой</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">С даты</label>
          <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">По дату</label>
          <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400" />
        </div>
        <button onClick={resetFilters} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-medium p-2 rounded-md shadow-sm transition-colors border border-gray-300 dark:border-gray-600">Сбросить</button>
      </div>

      {/* Mobile cards */}
      <div className="space-y-4 md:hidden">
        {groupedOperations.map(({ uuid, items }) => {
          const representative = items[0];
          return (
            <div
              key={uuid}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
              onClick={() => setSelectedOperation(items)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {representative.operation_date
                    ? new Date(representative.operation_date).toLocaleString('ru-RU', {
                        year: 'numeric', month: 'numeric', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })
                    : 'Нет даты'}
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${
                          representative.transaction_type === "consume"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : representative.transaction_type === "add"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : representative.transaction_type === "transfer"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                        }`}
                >
                  {representative.transaction_type}
                </span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">
                {representative.from_facility || '—'} → {representative.to_facility || '—'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {representative.comment || 'Нет комментария'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Позиций: <span className="font-semibold text-gray-700 dark:text-gray-200">{items.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hidden md:block">
        <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className='bg-gray-50 dark:bg-gray-700/50'>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Дата</th>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Тип</th>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Объекты (Откуда → Куда)</th>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Комментарий</th>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Позиций</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {groupedOperations.map(({ uuid, items }) => { // Деструктурируем объект
              const representative = items[0];
              return (
                <tr 
                  key={uuid} 
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => setSelectedOperation(items)}
                >
                  <td className="px-5 py-5 text-sm dark:text-gray-100">{representative.operation_date 
    ? new Date(representative.operation_date).toLocaleString('ru-RU', { 
        year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      }) 
    : 'Нет даты'
}</td>
                  <td className="px-5 py-5 text-sm capitalize dark:text-gray-100">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          representative.transaction_type === "consume"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : representative.transaction_type === "add"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : representative.transaction_type === "transfer"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                        }`}
                    >
                      {representative.transaction_type}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-sm dark:text-gray-100 font-medium">
                    {representative.from_facility || '—'} → {representative.to_facility || '—'}
                  </td>
                  <td className="px-5 py-5 text-sm truncate max-w-sm dark:text-gray-100" title={representative.comment}>
                    {representative.comment || '—'}
                  </td>
                   <td className="px-5 py-5 text-sm font-medium dark:text-gray-100">{items.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Модальное окно для деталей. Оно откроется, когда selectedOperation не будет null */}
      <Modal isOpen={!!selectedOperation} onClose={() => setSelectedOperation(null)}>
        {selectedOperation && <OperationDetail items={selectedOperation} onActionSuccess={handleActionSuccess} />}
      </Modal>
    </div>
  );
}

export default TransactionsPage;