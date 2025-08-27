// frontend/src/components/ReceiveItemModal.jsx
import React, { useState } from 'react';
import apiClient from '../api';

function ReceiveItemModal({ item, onClose, onReceiveSuccess }) {
    const remainingQty = item.quantity - item.received_quantity;
    const [quantity, setQuantity] = useState(remainingQty);
    const [operationDate, setOperationDate] = useState(new Date().toISOString().slice(0, 16));
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/requisitions/receive-item/', {
                item_id: item.id,
                quantity: quantity,
                operation_date: operationDate,
            });
            onReceiveSuccess(); // Перезагружаем данные на родительской странице
            onClose();
        } catch (error) {
            alert("Ошибка: " + JSON.stringify(error.response.data));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl">Приемка: {item.chemical_name}</h3>
            <p className="text-sm">Осталось принять: {remainingQty}</p>
            
            <div className="my-4">
                <label>Дата и время поступления</label>
                <input type="datetime-local" value={operationDate} onChange={e => setOperationDate(e.target.value)} required className="..."/>
            </div>
             <div className="my-4">
                <label>Принимаемое количество</label>
                <input type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} max={remainingQty} required className="..."/>
            </div>
            <button type="submit">Оприходовать</button>
        </form>
    );
}
export default ReceiveItemModal;