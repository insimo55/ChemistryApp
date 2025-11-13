// frontend/src/components/OperationDetail.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';

function OperationDetail({ items, onActionSuccess }) {
  if (!items || items.length === 0) {
    return <p className="text-gray-900 dark:text-gray-100 p-4">Нет данных для отображения.</p>;
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

  // Функция для получения русского названия типа операции
  const getTransactionTypeLabel = (type) => {
    const labels = {
      'add': 'Поступление',
      'consume': 'Списание',
      'transfer': 'Перемещение'
    };
    return labels[type] || type;
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-50 pb-3 border-b border-gray-200 dark:border-gray-700">Детали операции</h3>
      
      {/* Секция с общей информацией */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="font-medium text-gray-600 dark:text-gray-300">Дата и время:</div>
          <div className="text-gray-900 dark:text-gray-100">{representative.operation_date ? new Date(representative.operation_date).toLocaleString('ru-RU') : 'Нет даты'}</div>
          
          <div className="font-medium text-gray-600 dark:text-gray-300">Тип операции:</div>
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {getTransactionTypeLabel(representative.transaction_type)}
            </span>
          </div>
          
          <div className="font-medium text-gray-600 dark:text-gray-300">Из объекта:</div>
          <div className="text-gray-900 dark:text-gray-100">{representative.from_facility || <span className="text-gray-400 dark:text-gray-500">—</span>}</div>
          
          <div className="font-medium text-gray-600 dark:text-gray-300">В объект:</div>
          <div className="text-gray-900 dark:text-gray-100">{representative.to_facility || <span className="text-gray-400 dark:text-gray-500">—</span>}</div>
          
          <div className="font-medium text-gray-600 dark:text-gray-300">Исполнитель:</div>
          <div className="text-gray-900 dark:text-gray-100">{representative.performed_by || <span className="text-gray-400 dark:text-gray-500">—</span>}</div>
        </div>
      </div>

      {/* Комментарий и документ */}
      <div className="mb-6">
        <strong className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Комментарий:</strong>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{representative.comment || <span className="text-gray-400 dark:text-gray-500 italic">Нет комментария.</span>}</p>
        </div>
        {documentUrl && (
            <div className="mt-4">
                <a 
                    href={documentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    Просмотреть прикрепленный документ
                </a>
            </div>
        )}
      </div>

      {/* Список реагентов */}
      <div>
        <strong className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
          Список реагентов <span className="text-gray-500 dark:text-gray-400">({items.length} {items.length === 1 ? 'позиция' : items.length < 5 ? 'позиции' : 'позиций'})</span>
        </strong>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <div className="col-span-2 text-gray-900 dark:text-gray-100 font-medium">{item.chemical.name}</div>
              <div className="text-right font-mono text-gray-800 dark:text-gray-200 font-semibold">
                {item.quantity} <span className="text-gray-500 dark:text-gray-400 text-xs">{item.chemical.unit_of_measurement}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

       {/* Кнопки действий */}
       <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-3">
            <button 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-sm"
            >
                Удалить
            </button>
            <Link
                to={`/operation/edit/${representative.operation_uuid}`}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-sm text-center"
            >
                Редактировать
            </Link>
        </div>
    </div>
  );
}

export default OperationDetail;