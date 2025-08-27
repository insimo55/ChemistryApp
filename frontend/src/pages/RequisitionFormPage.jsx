// frontend/src/pages/RequisitionFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api';
import { statusStyles } from '../utils/styleHelpers';
import RequisitionActionButtons from '../components/RequisitionActionButtons';
import Modal from '../components/Modal';
import ReceiveItemModal from '../components/ReceiveItemModal';

function RequisitionFormPage() {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

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
    

    // Отправка формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            target_facility: requisition.target_facility,
            required_date: requisition.required_date,
            comment: requisition.comment,
            // Статус отправляем только при создании
            ...( !isEditMode && { status: requisition.status }),
            items: requisition.items
                .filter(item => item.chemical && item.quantity)
                .map(item => ({
                    chemical: item.chemical,
                    quantity: item.quantity,
                    notes: item.notes
                }))
        };

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
            <div className="mb-4">
                <Link to="/requisitions" className="text-blue-600 hover:underline font-semibold flex items-center">
                   &larr; К реестру заявок
                </Link>
            </div>
            <h1 className="text-3xl font-bold mb-6">{isEditMode ? `Редактирование заявки №${id}` : 'Новая заявка'}</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
                {error && <p className="bg-red-100 p-3 rounded mb-4 text-sm">{error}</p>}
                
                {/* --- СЕКЦИЯ "ШАПКА" --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                    <div>
                        <label htmlFor="target_facility" className="block text-sm font-medium text-gray-700">Объект назначения</label>
                        <select id="target_facility" name="target_facility" value={requisition.target_facility} onChange={handleHeaderChange} required disabled={!isEditable} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed">
                            <option value="">Выберите объект...</option>
                            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="required_date" className="block text-sm font-medium text-gray-700">Желаемая дата поставки</label>
                        <input id="required_date" name="required_date" type="date" value={requisition.required_date} onChange={handleHeaderChange} required disabled={!isEditable} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Статус</label>
                        <input id="status" type="text" value={statusStyles[requisition.status]?.text || 'Неизвестно'} readOnly disabled className="mt-1 block w-full p-2 border rounded bg-gray-100"/>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                         <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Комментарий</label>
                         <textarea id="comment" name="comment" value={requisition.comment} onChange={handleHeaderChange} rows="3" disabled={!isEditable} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"></textarea>
                    </div>
                </div>

                 {/* --- Секция "Позиции" (здесь основные изменения) --- */}
                <h3 className="text-lg font-semibold mb-4">Позиции заявки</h3>
                <div className="bg-white rounded-lg overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Реагент</th>
                                <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Заказано</th>
                                <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Получено</th>
                                <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase">Статус</th>
                                {isEditable ? <th className="p-3"></th> : (
                                    <th className="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Действие</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {requisition.items.map((item, index) => {
                                const remainingQty = item.quantity - item.received_quantity;
                                const isCompleted = remainingQty <= 0;

                                return (
                                    <tr key={item.id}>
                                        <td className="p-2">{isEditable ? (
                                            <select value={item.chemical} onChange={e => handleItemChange(index, 'chemical', e.target.value)} required className="w-full p-2 border rounded">
                                                <option value="">Выберите...</option>
                                                {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        ) : (
                                            item.chemical_name || 'Загрузка...'
                                        )}</td>
                                        <td className="p-2 text-right">{isEditable ? (
                                            <input type="number" step="0.01" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required className="w-full p-2 border rounded text-right"/>
                                        ) : item.quantity}</td>
                                        <td className="p-2 text-right font-medium">{item.received_quantity}</td>
                                        <td className="p-2 text-center">
                                            {isCompleted 
                                                ? <span className="text-green-600 font-semibold">✅&nbsp;Выполнено</span>
                                                : <span className="text-yellow-600">⏳&nbsp;В&nbsp;ожидании</span>
                                            }
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditable ? (
                                                requisition.items.length > 1 && <button type="button" onClick={() => removeItem(index)} title="Удалить позицию">&times;</button>
                                            ) : (
                                                ['in_progress', 'partially_completed'].includes(requisition.status) && !isCompleted && (
                                                    <button type="button" onClick={() => setReceivingItem(item)} className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600">Принять</button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {isEditable && <button type="button" onClick={addItem} className="mt-4 text-sm text-blue-600 hover:underline">+ Добавить позицию</button>}

                {/* --- БЛОК КНОПОК --- */}
                <div className="mt-8 pt-4 border-t flex justify-between items-center">
                    <div>
                        {isEditMode && <RequisitionActionButtons requisition={requisition} onStatusChange={handleStatusUpdate}/>}
                    </div>
                    {isEditable && (
                        <div className="flex items-center space-x-3">
                            <button type="button" onClick={handleDelete} disabled={loading} className="text-red-600 hover:underline px-4 py-2">Удалить</button>
                            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">
                                {loading ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        </div>
                    )}
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