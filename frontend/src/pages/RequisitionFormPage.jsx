// frontend/src/pages/RequisitionFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api';
import { statusStyles } from '../utils/styleHelpers';
import RequisitionActionButtons from '../components/RequisitionActionButtons';
import Modal from '../components/Modal';
import ReceiveItemModal from '../components/ReceiveItemModal';
import { useAuthStore } from '../store/auth';

function RequisitionFormPage() {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const { user } = useAuthStore();
    // Единое состояние для всей заявки
    const [requisition, setRequisition] = useState({
        status: 'draft',
        target_facility: '',
        required_date: new Date().toISOString().split('T')[0],
        comment: '',
        items: [{ id: Date.now(), chemical: '', quantity: '', notes: '' }]
    });
    
    // Справочники и UI
    const [facilities, setFacilities] = useState([]);
    const [chemicals, setChemicals] = useState([]);
    const [loading, setLoading] = useState(isEditMode);
    const [error, setError] = useState('');
    const [receivingItem, setReceivingItem] = useState(null);

    // Определяем, можно ли редактировать форму
    const isEditable = ['draft', 'needs_revision'].includes(requisition.status);

    // Функция для перезагрузки данных (например, после приемки)
    const fetchData = useCallback(() => {
        if (!isEditMode) return;
        setLoading(true);
        apiClient.get(`/requisitions/${id}/`)
            .then(res => {
                const data = res.data;
                setRequisition({
                    ...data,
                    items: data.items.map(item => ({...item, id: item.id || Date.now()}))
                });
            })
            .catch(err => setError('Не удалось обновить данные заявки.'))
            .finally(() => setLoading(false));
    }, [id, isEditMode]);

    // Загрузка первоначальных данных
    useEffect(() => {
        Promise.all([
            apiClient.get('/chemicals/'),
            apiClient.get('/facilities/'),
        ]).then(([chemRes, facRes]) => {
            setChemicals(chemRes.data.results || chemRes.data);
            setFacilities(facRes.data.results || facRes.data);
        });

        if (isEditMode) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [id, isEditMode, fetchData]);

    
    // --- Обработчики, работающие с единым состоянием ---
    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setRequisition(prev => ({ ...prev, [name]: value }));
    };
    const handleItemChange = (index, field, value) => {
        const newItems = [...requisition.items];
        newItems[index][field] = value;
        setRequisition(prev => ({ ...prev, items: newItems }));
    };
    const addItem = () => {
        const newItems = [...requisition.items, { id: Date.now(), chemical: '', quantity: '', notes: '' }];
        setRequisition(prev => ({ ...prev, items: newItems }));
    };
    const removeItem = (index) => {
        const newItems = requisition.items.filter((_, i) => i !== index);
        setRequisition(prev => ({ ...prev, items: newItems }));
    };
    const handleStatusUpdate = (updatedRequisition) => {
        setRequisition(updatedRequisition);
    };
    const handleDelete = async () => {
        // Запрашиваем подтверждение у пользователя
        if (window.confirm(`Вы уверены, что хотите безвозвратно удалить заявку №${id}?`)) {
            try {
                setLoading(true);
                // Отправляем DELETE-запрос на нужный эндпоинт
                await apiClient.delete(`/requisitions/${id}/`);
                alert('Заявка успешно удалена.');
                navigate('/requisitions'); // Возвращаемся в реестр
            } catch (error) {
                setError('Не удалось удалить заявку.');
                console.error("Delete requisition failed:", error);
                setLoading(false);
            }
        }
    };

    const handleRevertItem = async (itemId) => {
    if (window.confirm("Вы уверены, что хотите отменить ВСЕ приемки по этой позиции? Связанные поступления на склад будут удалены.")) {
        try {
            const response = await apiClient.post('/requisitions/revert-item/', { item_id: itemId });
            // Бэкенд возвращает обновленную заявку целиком, обновляем состояние
            setRequisition(response.data);
        } catch (error) {
            setError("Ошибка отмены приемки.");
        }
    }
};
    

    // Отправка формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log("СОСТОЯНИЕ ПЕРЕД ФИЛЬТРАЦИЕЙ (requisition.items):", requisition.items);

        const payload = {
            target_facility: requisition.target_facility,
            required_date: requisition.required_date,
            comment: requisition.comment,
            // --- ПРАВИЛЬНАЯ ЛОГИКА ФИЛЬТРАЦИИ И MAP ---
            items: requisition.items
                .filter(item => item.chemical && item.quantity) // Проверяем `chemical`, а не `chemical_id`
                .map(item => ({
                    chemical: item.chemical, // Отправляем ID в поле `chemical`
                    quantity: item.quantity,
                    notes: item.notes || ''
                }))
        };
        // Статус добавляем только при создании
        if (!isEditMode) {
            payload.status = requisition.status;
        }

        console.log("ОТПРАВЛЯЕМ НА БЭКЕНД:", JSON.stringify(payload, null, 2));
        
        try {
            if (isEditMode) {
                await apiClient.patch(`/requisitions/${id}/`, payload);
            } else {
                await apiClient.post('/requisitions/', payload);
            }
            navigate('/requisitions');
        } catch (err) {
            setError('Ошибка сохранения заявки.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p className="text-red-500">{error}</p>

    return (
        <div>
            {/* --- ШАПКА И НАВИГАЦИЯ --- */}
            <div className="mb-4">
                <Link to="/requisitions" className="text-blue-600 hover:underline font-semibold flex items-center">
                   &larr; К реестру заявок
                </Link>
            </div>
            <h1 className="text-3xl font-bold mb-6">{isEditMode ? `Редактирование заявки №${id}` : 'Новая заявка'}</h1>
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
                {error && <p className="bg-red-100 p-3 rounded mb-4 text-sm">{error}</p>}
                
                {/* --- СЕКЦИЯ "ШАПКА" ЗАЯВКИ --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                    <div>
                        <label htmlFor="target_facility" className="block text-sm font-medium">Объект назначения</label>
                        <select id="target_facility" name="target_facility" value={requisition.target_facility} onChange={handleHeaderChange} required disabled={!isEditable} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <option value="">Выберите объект...</option>
                            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="required_date" className="block text-sm font-medium">Желаемая дата поставки</label>
                        <input id="required_date" name="required_date" type="date" value={requisition.required_date} onChange={handleHeaderChange} required disabled={!isEditable} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium">Статус</label>
                        <input id="status" type="text" value={statusStyles[requisition.status]?.text || 'Неизвестно'} readOnly disabled className="mt-1 block w-full p-2 border rounded bg-gray-100"/>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                         <label htmlFor="comment" className="block text-sm font-medium">Комментарий</label>
                         <textarea id="comment" name="comment" value={requisition.comment} onChange={handleHeaderChange} rows="3" disabled={!isEditable} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"></textarea>
                    </div>
                </div>

                {/* --- СЕКЦИЯ "ПОЗИЦИИ" ЗАЯВКИ --- */}
                <h3 className="text-lg font-semibold mb-4">Позиции заявки</h3>
                <div className="bg-white rounded-lg overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left text-xs font-semibold uppercase">Реагент</th>
                                <th className="p-3 text-right text-xs font-semibold uppercase">Заказано</th>
                                <th className="p-3 text-right text-xs font-semibold uppercase">Получено</th>
                                <th className="p-3 text-center text-xs font-semibold uppercase">Статус</th>
                                <th className="p-3 text-right text-xs font-semibold uppercase">Действие</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {requisition.items.map((item, index) => {
                                const remainingQty = (item.quantity || 0) - (item.received_quantity || 0);
                                const isCompleted = remainingQty <= 0;

                                return (
                                    <tr key={item.id}>
                                        <td className="p-2 w-1/3">{isEditable ? (
                                            <select value={item.chemical} onChange={e => handleItemChange(index, 'chemical', e.target.value)} required className="w-full p-2 border rounded">
                                                <option value="">Выберите...</option>
                                                {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        ) : (
                                            item.chemical_name || 'Загрузка...'
                                        )}</td>
                                        <td className="p-2 w-1/4 text-right">{isEditable ? (
                                            <input type="number" step="0.01" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required className="w-full p-2 border rounded text-right"/>
                                        ) : item.quantity}</td>
                                        <td className="p-2 w-1/6 text-right font-medium">{item.received_quantity || 0}</td>
                                        <td className="p-2 text-center">
                                            {isCompleted 
                                                ? <span className="text-green-600 font-semibold">✅&nbsp;Выполнено</span>
                                                : <span className="text-yellow-600">⏳&nbsp;В&nbsp;ожидании</span>
                                            }
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditable ? (
                                                requisition.items.length > 1 && <button type="button" onClick={() => removeItem(index)} title="Удалить позицию" className="text-red-500 hover:text-red-700 text-2xl px-2">&times;</button>
                                            ) : (
                                                <>
                                                    {['in_progress', 'partially_completed'].includes(requisition.status) && !isCompleted && (
                                                        <button type="button" onClick={() => setReceivingItem(item)} className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600">Принять</button>
                                                    )}
                                                    {item.received_quantity > 0 && ['in_progress', 'partially_completed'].includes(requisition.status) && (
                                                        <button type="button" onClick={() => handleRevertItem(item.id)} className="text-gray-500 hover:text-red-600 text-xs ml-2" title="Отменить все приемки по этой позиции">(откатить)</button>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {isEditable && <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600 hover:underline">+ Добавить позицию</button>}

                {/* --- БЛОК КНОПОК УПРАВЛЕНИЯ --- */}
                <div className="mt-8 pt-4 border-t flex justify-between items-center">
                    {/* Кнопки смены статуса (слева) */}
                    <div>
                        {isEditMode && (
                            <RequisitionActionButtons 
                                requisition={requisition}
                                onStatusChange={handleStatusUpdate}
                            />
                        )}
                    </div>
                    
                    {/* Кнопки сохранения и удаления (справа) */}
                    <div className="flex items-center space-x-3">
                        {isEditMode && user?.role === 'admin' && (
                            <button type="button" onClick={handleDelete} disabled={loading} className="bg-red-200 text-red-800 hover:bg-red-300 font-semibold py-2 px-4 rounded">Удалить</button>
                        )}
                        {isEditable && (
                            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">
                                {loading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать заявку')}
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* Модальное окно для приемки */}
            <Modal isOpen={!!receivingItem} onClose={() => setReceivingItem(null)}>
                {receivingItem && <ReceiveItemModal item={receivingItem} onClose={() => setReceivingItem(null)} onReceiveSuccess={() => { setReceivingItem(null); fetchData(); }} />}
            </Modal>
        </div>
    );
}

export default RequisitionFormPage;