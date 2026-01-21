// frontend/src/pages/ChemicalsPage.jsx (создать новый файл)
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import Modal from '../components/Modal'; // Нужен простой компонент модального окна
import ChemicalForm from '../components/ChemicalForm';

// --- Сама страница ---
function ChemicalsPage() {
  const [chemicals, setChemicals] = useState([]);
    const [editingChemical, setEditingChemical] = useState(null); // Для редактирования
    const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchChemicals = useCallback(async () => {
    const response = await apiClient.get('/chemicals/');
    setChemicals(response.data);
  }, []);

  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  });

  useEffect(() => {
    fetchChemicals();
  }, [fetchChemicals]);

  const handleDelete = async (id) => {
        // Спрашиваем подтверждение перед удалением
        if (window.confirm('Вы уверены, что хотите удалить этот реагент?')) {
            try {
                await apiClient.delete(`/chemicals/${id}/`);
                fetchChemicals(); // Обновляем список
            } catch (error) {
                // На бэкенде стоит on_delete=models.PROTECT, так что будет ошибка, если реагент используется
                alert('Ошибка: Нельзя удалить реагент, который используется в транзакциях.');
            }
        }
    };
    
  const openCreateModal = () => {
      setEditingChemical(null); // Убеждаемся, что форма будет для создания
      setIsModalOpen(true);
  };

  const openEditModal = (chemical) => {
      setEditingChemical(chemical); // Передаем данные в состояние
      setIsModalOpen(true);
  };

  const sortedChemicals = React.useMemo(() => {
    const sorted = [...chemicals];
  
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';
  
      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue, 'ru')
          : bValue.localeCompare(aValue, 'ru');
      }
  
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });
  
    return sorted;
  }, [chemicals, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-gray-100">Справочник реагентов</h1>
        <button onClick={openCreateModal} className="bg-blue-500 text-white py-2 px-4 rounded  dark:bg-blue-600 dark:hover:bg-blue-800 transition-colors">
          + Добавить реагент
        </button>
      </div>
      {/* Таблица с chemicals */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className='dark:bg-neutral-700'>
              <th onClick={() => handleSort('name')} className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-gray-100 hover:cursor-pointer">Название{renderSortIcon('name')}</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-gray-100">Ед. изм.</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-gray-100">Описание</th>
              <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase dark:text-gray-100">Функции</th>

            </tr>
          </thead>
          <tbody>
            {sortedChemicals.map((chem) => (
              <tr key={chem.id} className='dark:bg-gray-700'>
                <td className="px-5 py-5 border-b text-sm dark:text-gray-100">{chem.name}</td>
                <td className="px-5 py-5 border-b text-sm dark:text-gray-100">{chem.unit_of_measurement}</td>
                <td className="px-5 py-5 border-b text-sm dark:text-gray-100">{chem.description}</td>
                <td className="px-5 py-5 border-b text-sm text-right">
                                    <button onClick={() => openEditModal(chem)} className="text-indigo-600 hover:text-indigo-900 mr-4 dark:text-green-400 dark:hover:text-green-600">Редактировать</button>
                                    <button onClick={() => handleDelete(chem.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {/* Форма теперь получает данные для редактирования или null для создания */}
                <ChemicalForm 
                    chemical={editingChemical}
                    onSuccess={fetchChemicals} 
                    onClose={() => setIsModalOpen(false)} 
                />
            </Modal>
    </div>
  );
}
export default ChemicalsPage;