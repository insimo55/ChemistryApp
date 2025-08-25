// frontend/src/pages/RequisitionFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { statusStyles } from '../utils/styleHelpers';
import { useParams, useNavigate,Link } from 'react-router-dom';
import apiClient from '../api';
import RequisitionActionButtons from '../components/RequisitionActionButtons'; 

function RequisitionFormPage() {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    // Состояния шапки
    const [targetFacilityId, setTargetFacilityId] = useState('');
    const [requiredDate, setRequiredDate] = useState('');
    const [comment, setComment] = useState('');
    const [status, setStatus] = useState('draft'); // Статус по умолчанию

    // Состояния позиций
    const [items, setItems] = useState([{ id: Date.now(), chemical: '', quantity: '', notes: '' }]);
    
    // Справочники и UI
    const [facilities, setFacilities] = useState([]);
    const [chemicals, setChemicals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [requisitionData, setRequisitionData] = useState(null);

    // Загрузка справочников и/или данных для редактирования
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Всегда загружаем справочники
                const [chemRes, facRes] = await Promise.all([
                    apiClient.get('/chemicals/'),
                    apiClient.get('/facilities/'),
                ]);
                setChemicals(chemRes.data.results || chemRes.data);
                setFacilities(facRes.data.results || facRes.data);

                // Если это режим редактирования, загружаем данные самой заявки
                if (isEditMode) {
                    apiClient.get(`/requisitions/${id}/`).then(res => {
                        const data = res.data;
                        setRequisitionData(data); // <-- Сохраняем всю заявку
                        
                        // Заполняем состояния формы
                        setTargetFacilityId(data.target_facility);
                        setRequiredDate(data.required_date);
                        setComment(data.comment || '');
                        setStatus(data.status);
                        setItems(data.items.map(item => ({...item, id: item.id || Date.now()})));
                    });
                }
            } catch (err) {
                setError('Не удалось загрузить данные.');
                console.error("Fetch data error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [id, isEditMode]);

    // Функции для управления строками позиций
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleStatusUpdate = (updatedRequisition) => {
        setRequisitionData(updatedRequisition);
        setStatus(updatedRequisition.status); // Обновляем статус в форме
    };


    const addItem = () => {
        setItems([...items, { id: Date.now(), chemical: '', quantity: '', notes: '' }]);
    };
    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Отправка формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            target_facility: targetFacilityId,
            required_date: requiredDate,
            comment,
            items: items.filter(item => item.chemical && item.quantity)
                       .map(({ id, ...rest }) => rest) // Убираем временный 'id' перед отправкой
        };

        try {
            if (isEditMode) {
                await apiClient.patch(`/requisitions/${id}/`, payload);
            } else {
                payload.status = requisition.status;
                await apiClient.post('/api/requisitions/', payload);
            }
            navigate('/requisitions');
        } catch (err) {
            setError('Ошибка сохранения заявки. Проверьте все поля.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) {
        return <p>Загрузка заявки...</p>;
    }

    return (
        <div>
            <div className="mb-4">
                <Link to="/requisitions" className="text-blue-600 hover:underline font-semibold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    К реестру заявок
                </Link>
            </div>
            <h1 className="text-3xl font-bold mb-6">{isEditMode ? `Редактирование заявки №${id}` : 'Новая заявка'}</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
                {error && <p className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4 text-sm">{error}</p>}
                
                {/* Секция "Шапка" */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                    <div>
                        <label htmlFor="target_facility" className="block text-sm font-medium text-gray-700">Объект назначения</label>
                        <select id="target_facility" value={targetFacilityId} onChange={e => setTargetFacilityId(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="">Выберите объект...</option>
                            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="required_date" className="block text-sm font-medium text-gray-700">Желаемая дата поставки</label>
                        <input id="required_date" type="date" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Статус</label>
                        <input 
                            id="status"
                            type="text"
                            // Находим "человекочитаемое" имя статуса
                            value={statusStyles[requisition.status]?.text || 'Неизвестно'}
                            readOnly
                            disabled
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                         <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Комментарий</label>
                         <textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
                    </div>
                </div>

                {/* Секция "Позиции" */}
                <h3 className="text-lg font-semibold mb-4">Позиции заявки</h3>
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border p-3 rounded-md">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-gray-600">Реагент</label>
                                <select value={item.chemical} onChange={e => handleItemChange(index, 'chemical', e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    <option value="">Выберите реагент...</option>
                                    {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-gray-600">Требуемое количество</label>
                                <input type="number" step="0.01" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                            <div className="flex items-center space-x-2">
                               <div className="flex-grow">
                                    <label className="block text-xs font-medium text-gray-600">Примечание</label>
                                    <input type="text" value={item.notes} onChange={e => handleItemChange(index, 'notes', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                               </div>
                               <button type="button" onClick={() => removeItem(index)} title="Удалить позицию" className="p-2 text-red-500 hover:text-red-700">&times;</button>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addItem} className="mt-4 text-sm text-blue-600 hover:underline">+ Добавить позицию</button>

                <div className="mt-8 pt-4 border-t flex justify-end">
                     {/* Кнопки действий (слева) */}
                    <div>
                        {isEditMode && (
                            <RequisitionActionButtons 
                                requisition={requisitionData}
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