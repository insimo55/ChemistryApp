// frontend/src/components/ReceiveItemModal.jsx
import React, { useState } from 'react';
import apiClient from '../api';

function ReceiveItemModal({ item, onClose, onReceiveSuccess }) {
    const remainingQty = (item.quantity - item.received_quantity).toFixed(2);
    const [quantity, setQuantity] = useState(remainingQty);
    const [operationDate, setOperationDate] = useState(new Date().toISOString().slice(0, 16));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiClient.post('/api/requisitions/receive-item/', {
                item_id: item.id,
                quantity: quantity,
                operation_date: operationDate,
            });
            onReceiveSuccess();
            onClose();
        } catch (error) {
            setError(error.response?.data?.error || "Произошла ошибка.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-2">Приемка: {item.chemical_name}</h3>
            <p className="text-sm text-gray-500 mb-6">Заказано: {item.quantity}, получено: {item.received_quantity}. Осталось принять: {remainingQty}.</p>
            
            {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}

            <div className="space-y-4">
                <div>
                    <label htmlFor="operation_date" className="block text-sm font-medium text-gray-700">Дата и время поступления</label>
                    <input id="operation_date" type="datetime-local" value={operationDate} onChange={e => setOperationDate(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                </div>
                 <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Принимаемое количество</label>
                    <input id="quantity" type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} max={remainingQty} min="0.01" required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Отмена</button>
                <button type="submit" disabled={loading} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                    {loading ? 'Обработка...' : 'Оприходовать'}
                </button>
            </div>
        </form>
    );
}

export default ReceiveItemModal;