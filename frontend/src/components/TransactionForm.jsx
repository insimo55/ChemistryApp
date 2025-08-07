// frontend/src/components/TransactionForm.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuthStore } from '../store/auth';

function TransactionForm({ onSuccess, onClose }) {
  // Состояния для данных формы
  const [transactionType, setTransactionType] = useState('add');
  const [chemicalId, setChemicalId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fromFacilityId, setFromFacilityId] = useState('');
  const [toFacilityId, setToFacilityId] = useState('');
  const [comment, setComment] = useState('');
  const [documentFile, setDocumentFile] = useState(null);

  // Состояния для UI
  const [chemicals, setChemicals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuthStore();

  // Загружаем справочники (реагенты и объекты) при монтировании компонента
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chemResponse, facResponse] = await Promise.all([
          apiClient.get('/chemicals/'),
          apiClient.get('/facilities/'),
        ]);
        setChemicals(chemResponse.data);
        setFacilities(facResponse.data);
        
        // Для инженера сразу подставляем его объект
        if (user?.role === 'engineer') {
            setTransactionType('consume');
            setFromFacilityId(user.related_facility);
        }
      } catch (err) {
        setError('Не удалось загрузить справочники.');
      }
    };
    fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Файлы нужно отправлять через FormData, а не JSON
    const formData = new FormData();
    formData.append('transaction_type', transactionType);
    formData.append('chemical', chemicalId);
    formData.append('quantity', quantity);
    formData.append('comment', comment);

    if (transactionType === 'add') formData.append('to_facility', toFacilityId);
    if (transactionType === 'consume') formData.append('from_facility', fromFacilityId);
    if (transactionType === 'transfer') {
      formData.append('from_facility', fromFacilityId);
      formData.append('to_facility', toFacilityId);
    }
    if (documentFile) {
        formData.append('document_file', documentFile);
        formData.append('document_name', documentFile.name);
    }

    try {
      await apiClient.post('/transactions/create/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onSuccess(); // Вызываем колбэк успешного завершения (обновление данных)
      onClose();   // Закрываем модальное окно
    } catch (err) {
      const errorData = err.response?.data;
      // Преобразуем объект ошибок в строку
      const errorMessage = typeof errorData === 'object' ? JSON.stringify(errorData) : 'Произошла ошибка.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Новая операция</h2>
      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}
      
      {/* Тип транзакции */}
      <div className="mb-4">
        <label>Тип операции</label>
        <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} disabled={user?.role === 'engineer'} className="w-full p-2 border rounded">
          {/* Инженеру доступны не все типы */}
          {user?.role !== 'engineer' && <option value="add">Поступление</option>}
          <option value="consume">Списание</option>
          {user?.role !== 'engineer' && <option value="transfer">Перемещение</option>}
        </select>
      </div>

      {/* Реагент и Количество */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label>Реагент</label>
          <select value={chemicalId} onChange={(e) => setChemicalId(e.target.value)} required className="w-full p-2 border rounded">
            <option value="">Выберите реагент</option>
            {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label>Количество</label>
          <input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="w-full p-2 border rounded" />
        </div>
      </div>

      {/* Динамические поля для Объектов */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {(transactionType === 'consume' || transactionType === 'transfer') && (
          <div>
            <label>Из объекта (Откуда)</label>
            <select value={fromFacilityId} onChange={(e) => setFromFacilityId(e.target.value)} disabled={user?.role === 'engineer'} required className="w-full p-2 border rounded">
                <option value="">Выберите объект</option>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        )}
        {(transactionType === 'add' || transactionType === 'transfer') && (
          <div>
            <label>В объект (Куда)</label>
            <select value={toFacilityId} onChange={(e) => setToFacilityId(e.target.value)} required className="w-full p-2 border rounded">
                <option value="">Выберите объект</option>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Комментарий и Файл */}
      <div className="mb-4">
        <label>Комментарий</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-2 border rounded"></textarea>
      </div>
      <div className="mb-4">
        <label>Прикрепить документ</label>
        <input type="file" onChange={(e) => setDocumentFile(e.target.files[0])} className="w-full p-2 border rounded" />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:bg-gray-400">
        {loading ? 'Выполнение...' : 'Создать операцию'}
      </button>
    </form>
  );
}

export default TransactionForm;