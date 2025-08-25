// frontend/src/pages/RequisitionFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api';
import { statusStyles } from '../utils/styleHelpers';
import RequisitionActionButtons from '../components/RequisitionActionButtons';

function RequisitionFormPage() {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    // --- ЕДИНОЕ СОСТОЯНИЕ ДЛЯ ВСЕЙ ЗАЯВКИ ---
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

    // Загрузка данных
    useEffect(() => {
        // Загрузка справочников
        Promise.all([
            apiClient.get('/chemicals/'),
            apiClient.get('/facilities/'),
        ]).then(([chemRes, facRes]) => {
            setChemicals(chemRes.data.results || chemRes.data);
            setFacilities(facRes.data.results || facRes.data);
        }).catch(err => {
            setError('Не удалось загрузить справочники.');
            console.error(err);
        });

        // Если режим редактирования, загружаем данные заявки
        if (isEditMode) {
            setLoading(true);
            apiClient.get(`/requisitions/${id}/`)
                .then(res => {
                    const data = res.data;
                    setRequisition({
                        ...data,
                        items: data.items.map(item => ({...item, id: item.id || Date.now()}))
                    });
                })
                .catch(err => setError('Не удалось загрузить данные заявки.'))
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode]);

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
                .map(({ id, chemical_name, ...rest }) => rest)
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                    <div>
                        <label htmlFor="target_facility" className="block text-sm font-medium">Объект назначения</label>
                        <select id="target_facility" name="target_facility" value={requisition.target_facility} onChange={handleHeaderChange} required className="mt-1 block w-full p-2 border rounded">
                            <option value="">Выберите объект...</option>
                            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="required_date" className="block text-sm font-medium">Желаемая дата поставки</label>
                        <input id="required_date" name="required_date" type="date" value={requisition.required_date} onChange={handleHeaderChange} required className="mt-1 block w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium">Статус</label>
                        <input id="status" type="text" value={statusStyles[requisition.status]?.text || 'Неизвестно'} readOnly disabled className="mt-1 block w-full p-2 border rounded bg-gray-100"/>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                         <label htmlFor="comment" className="block text-sm font-medium">Комментарий</label>
                         <textarea id="comment" name="comment" value={requisition.comment} onChange={handleHeaderChange} rows="3" className="mt-1 block w-full p-2 border rounded"></textarea>
                    </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Позиции заявки</h3>
                <div className="space-y-4">
                    {requisition.items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border p-3 rounded-md">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-medium">Реагент</label>
                                <select value={item.chemical} onChange={e => handleItemChange(index, 'chemical', e.target.value)} required className="mt-1 block w-full p-2 border rounded">
                                    <option value="">Выберите реагент...</option>
                                    {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium">Требуемое количество</label>
                                <input type="number" step="0.01" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required className="mt-1 block w-full p-2 border rounded"/>
                            </div>
                            <div className="flex items-center space-x-2">
                               <div className="flex-grow">
                                    <label className="block text-xs font-medium">Примечание</label>
                                    <input type="text" value={item.notes} onChange={e => handleItemChange(index, 'notes', e.target.value)} className="mt-1 block w-full p-2 border rounded"/>
                               </div>
                               {requisition.items.length > 1 && (
                                   <button type="button" onClick={() => removeItem(index)} title="Удалить позицию" className="p-2 text-red-500 hover:text-red-700">&times;</button>
                               )}
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addItem} className="mt-4 text-sm text-blue-600 hover:underline">+ Добавить позицию</button>

                <div className="mt-8 pt-4 border-t flex justify-between items-center">
                    <div>
                        {isEditMode && (
                            <RequisitionActionButtons 
                                requisition={requisition}
                                onStatusChange={handleStatusUpdate}
                            />
                        )}
                    </div>
                    <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400">
                        {loading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать заявку')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RequisitionFormPage;