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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Справочник реагентов</h1>
        <button onClick={openCreateModal} className="bg-blue-500 text-white py-2 px-4 rounded">
          + Добавить реагент
        </button>
      </div>
      {/* Таблица с chemicals */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Название</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Ед. изм.</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Описание</th>
              <th className="px-5 py-3 border-b-2 text-right text-xs font-semibold uppercase">Функции</th>

            </tr>
          </thead>
          <tbody>
            {chemicals.map((chem) => (
              <tr key={chem.id}>
                <td className="px-5 py-5 border-b text-sm">{chem.name}</td>
                <td className="px-5 py-5 border-b text-sm">{chem.unit_of_measurement}</td>
                <td className="px-5 py-5 border-b text-sm">{chem.description}</td>
                <td className="px-5 py-5 border-b text-sm text-right">
                                    <button onClick={() => openEditModal(chem)} className="text-indigo-600 hover:text-indigo-900 mr-4">Редактировать</button>
                                    <button onClick={() => handleDelete(chem.id)} className="text-red-600 hover:text-red-900">Удалить</button>
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