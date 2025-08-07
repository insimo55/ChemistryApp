// frontend/src/components/OperationDetail.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';

function OperationDetail({ items, onActionSuccess }) {
  if (!items || items.length === 0) {
    return <p>Нет данных для отображения.</p>;
  }

  // Берем первую транзакцию для отображения общих данных
  const representative = items[0];
  const documentUrl = representative.document_file;

  // Функция для удаления (отправляет запрос на бэкенд)
  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите безвозвратно удалить эту операцию? Это действие затронет остатки.')) {
        try {
            await apiClient.post('/operations/delete/', { operation_uuid: representative.operation_uuid });
            alert('Операция успешно удалена.');
            onActionSuccess(); // Вызываем колбэк, чтобы обновить список и закрыть окно
        } catch (error) {
            alert('Ошибка удаления: ' + JSON.stringify(error.response?.data));
        }
    }
  };

  return (
    <div className="p-2 max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Детали операции</h3>
      
      {/* Секция с общей информацией */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6 text-sm">
        <div><strong className="text-gray-500">Дата и время:</strong></div>
        <div>{representative.operation_date ? new Date(representative.operation_date).toLocaleString('ru-RU') : 'Нет даты'}</div>
        
        <div><strong className="text-gray-500">Тип операции:</strong></div>
        <div className="capitalize">{representative.transaction_type}</div>
        
        <div><strong className="text-gray-500">Из объекта:</strong></div>
        <div>{representative.from_facility || '—'}</div>
        
        <div><strong className="text-gray-500">В объект:</strong></div>
        <div>{representative.to_facility || '—'}</div>
        
        <div><strong className="text-gray-500">Исполнитель:</strong></div>
        <div>{representative.performed_by || '—'}</div>
      </div>

      {/* Комментарий и документ */}
      <div className="mb-6">
        <strong className="block text-sm text-gray-500 mb-1">Комментарий:</strong>
        <p className="text-sm bg-gray-50 p-3 rounded-md border">{representative.comment || 'Нет комментария.'}</p>
        {documentUrl && (
            <div className="mt-4">
                <a 
                    href={documentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline text-sm font-medium"
                >
                    Просмотреть прикрепленный документ
                </a>
            </div>
        )}
      </div>

      {/* Список реагентов */}
      <div>
        <strong className="block text-sm text-gray-500 mb-2">Список реагентов ({items.length} поз.):</strong>
        <div className="border rounded-md divide-y">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-3 gap-4 p-3">
              <div className="col-span-2 text-gray-800">{item.chemical.name}</div>
              <div className="text-right font-mono text-gray-900">{item.quantity} {item.chemical.unit_of_measurement}</div>
            </div>
          ))}
        </div>
      </div>

       {/* Кнопки действий */}
       <div className="mt-6 pt-4 border-t flex justify-between items-center">
            <button 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
                Удалить
            </button>
            <Link
                to={`/operation/edit/${representative.operation_uuid}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
                Редактировать
            </Link>
        </div>
    </div>
  );
}

export default OperationDetail;