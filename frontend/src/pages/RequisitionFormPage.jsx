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

    // Состояние для "шапки" и "позиций"
    const [requisition, setRequisition] = useState({
        req_number: '', 
        status: 'draft',
        target_facility: '',
        required_date: new Date().toISOString().split('T')[0],
        comment: '',
        items: [{ id: Date.now(), chemical: '', quantity: '', notes: '' }]
    });
    
    // ОТДЕЛЬНОЕ состояние для распределения
    const [distribution, setDistribution] = useState({});
    
    const [facilities, setFacilities] = useState([]);
    const [chemicals, setChemicals] = useState([]);
    const [loading, setLoading] = useState(isEditMode);
    const [error, setError] = useState('');
    const [receivingItem, setReceivingItem] = useState(null);

    const isEditable = ['draft', 'needs_revision'].includes(requisition.status);

    // --- ИСПРАВЛЕННАЯ ЛОГИКА ЗАГРУЗКИ ДАННЫХ ---
    const fetchData = useCallback(() => {
        if (!isEditMode) return;
        setLoading(true);
        apiClient.get(`/requisitions/${id}/`)
            .then(res => {
                const data = res.data;
                // Заполняем состояние `requisition`
                setRequisition({
                    ...data,
                    items: data.items.map(item => ({...item, id: item.id || Date.now()}))
                });

                // Преобразуем вложенные `distributions` в нашу "плоскую" структуру
                const initialDistribution = {};
                data.items.forEach(item => {
                    item.distributions.forEach(dist => {
                        if (!initialDistribution[dist.facility]) {
                            initialDistribution[dist.facility] = {};
                        }
                        initialDistribution[dist.facility][item.chemical] = dist.quantity;
                    });
                });
                setDistribution(initialDistribution);
            })
            .catch(err => setError('Не удалось обновить данные заявки.'))
            .finally(() => setLoading(false));
    }, [id, isEditMode]);

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

    

    // Вызывается, когда пользователь вводит количество в input внутри карточки
    const handleDistributionChange = (facilityId, chemicalId, quantity) => {
        setDistribution(prev => {
            // Создаем копию всего объекта распределения
            const newDistribution = { ...prev };
            // Создаем копию вложенного объекта для конкретного facility
            const facilityDistribution = { ...newDistribution[facilityId] };
            
            // Обновляем количество для конкретного chemical
            facilityDistribution[chemicalId] = quantity;
            
            // Записываем обновленный вложенный объект обратно
            newDistribution[facilityId] = facilityDistribution;

            return newDistribution;
        });
    };
    
    // Вызывается, когда пользователь выбирает объект из выпадающего списка
    const addFacilityToDistribution = (facilityId) => {
        // Проверяем, что ID не пустой и что такого объекта еще нет в распределении
        if (facilityId && !distribution[facilityId]) {
            setDistribution(prev => {
                const newDistribution = { ...prev };
                // Создаем пустой объект для нового объекта
                newDistribution[facilityId] = {}; 
                return newDistribution;
            });
        }
    };

    // Вызывается, когда пользователь нажимает на крестик на карточке объекта
    const removeFacilityFromDistribution = (facilityId) => {
        if (window.confirm("Удалить этот объект из распределения? Все введенные для него количества будут стерты.")) {
            setDistribution(prev => {
                const newDistribution = { ...prev };
                delete newDistribution[facilityId]; // Удаляем ключ из объекта
                return newDistribution;
            });
        }
    };
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
    

    // --- ИСПРАВЛЕННЫЙ handleSubmit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
setError('');

        const payload = {
            req_number: requisition.req_number,
            target_facility: requisition.target_facility,
            required_date: requisition.required_date,
            comment: requisition.comment,
            // Преобразуем "плоское" состояние distribution обратно во вложенную структуру
            items: requisition.items
                .filter(item => item.chemical && item.quantity)
                .map(item => {
                    const distributions_for_item = Object.entries(distribution)
                        .map(([facilityId, chemicalsInFacility]) => {
                            const quantityForChemical = chemicalsInFacility[item.chemical];
                            if (quantityForChemical && parseFloat(quantityForChemical) > 0) {
                                return { facility: facilityId, quantity: quantityForChemical };
                            }
                            return null;
                        })
                        .filter(Boolean); // Убираем null

                    return {
                        chemical: item.chemical,
                        quantity: item.quantity,
                        notes: item.notes || '',
                        distributions: distributions_for_item
                    };
                })
        };
        
        if (!isEditMode) payload.status = requisition.status;

        console.log("ОТПРАВЛЯЕМ НА БЭКЕНД:", JSON.stringify(payload, null, 2));
        
        try {
            if (isEditMode) {
                await apiClient.put(`/requisitions/${id}/`, payload);
            } else {
                await apiClient.post('/requisitions/', payload);
            }
            navigate('/requisitions');
        } catch (err) {
            setError('Ошибка сохранения заявки. Проверьте все поля.');
            console.error("Ошибка API:", err.response?.data);
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
                <Link to="/requisitions" className="text-blue-600 hover:underline font-semibold flex items-center dark:text-blue-300">
                   &larr; К реестру заявок
                </Link>
            </div>
            <h1 className="text-3xl font-bold mb-6 dark:text-white">{isEditMode ? `Редактирование заявки №${requisition.req_number}` : 'Новая заявка'}</h1>
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</p>}
                
                {/* --- СЕКЦИЯ "ШАПКА" ЗАЯВКИ --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                    <div>
                        <label htmlFor="req_number" className="block text-sm font-medium">Номер заявки</label>
                        <input id="req_number" name="req_number" type="text" value={requisition.req_number} onChange={handleHeaderChange} required className="mt-1 block w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label htmlFor="target_facility" className="block text-sm font-medium dark:text-white">Объект назначения</label>
                        <select id="target_facility" name="target_facility" value={requisition.target_facility} onChange={handleHeaderChange} required disabled={!isEditable} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed dark:text-white dark:bg-black dark:border-black">
                            <option value="">Выберите объект...</option>
                            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="required_date" className="block text-sm font-medium dark:text-white ">Желаемая дата поставки</label>
                        <input id="required_date" name="required_date" type="date" value={requisition.required_date} onChange={handleHeaderChange} required disabled={!isEditable} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed dark:text-white dark:bg-black dark:border-black"/>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium dark:text-white">Статус</label>
                        <input id="status" type="text" value={statusStyles[requisition.status]?.text || 'Неизвестно'} readOnly disabled className="mt-1 block w-full p-2 border rounded bg-gray-100 dark:text-white dark:bg-black dark:border-black"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Утвердил</label>
                        <input 
                            type="text"
                            value={requisition.approved_by_username || 'Ожидает утверждения'}
                            readOnly
                            disabled
                            className="mt-1 block w-full p-2 border rounded bg-gray-100"
                        />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                         <label htmlFor="comment" className="block text-sm font-medium dark:text-white">Комментарий</label>
                         <textarea id="comment" name="comment" value={requisition.comment} onChange={handleHeaderChange} rows="3" disabled={!isEditable} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed dark:text-white dark:bg-black dark:border-black"></textarea>
                    </div>
                </div>

                 {/* --- СЕКЦИЯ "ПОЗИЦИИ" ЗАЯВКИ --- */}
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Общий список требуемых реагентов</h3>
                
                {isEditable ? (
                    // --- РЕЖИМ РЕДАКТИРОВАНИЯ (для 'draft', 'needs_revision') ---
                    <div className="space-y-4">
                        {requisition.items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border p-3 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Реагент</label>
                                    <select value={item.chemical} onChange={e => handleItemChange(index, 'chemical', e.target.value)} required className="mt-1 block w-full p-2 border rounded">
                                        <option value="">Выберите...</option>
                                        {chemicals
                                                    .slice()
                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                    .map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                    ))}
                                    </select>
                                </div>
                                <div className="flex items-end space-x-2">
                                    <div className="flex-grow">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Общее количество, кг</label>
                                        <input type="number" step="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} required className="mt-1 block w-full p-2 border rounded text-left"/>
                                    </div>
                                    {requisition.items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} title="Удалить позицию" className="h-10 w-10 flex-shrink-0 text-red-500 hover:text-red-700 text-2xl">&times;</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // --- РЕЖИМ ПРОСМОТРА И ПРИЕМКИ ---
                    <div className="bg-white dark:bg-gray-700 rounded-lg overflow-x-auto border dark:border-gray-600">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-600">
                                <tr>
                                    <th className="p-3 text-left text-xs font-semibold uppercase dark:text-gray-300">Реагент</th>
                                    <th className="p-3 text-right text-xs font-semibold uppercase dark:text-gray-300">Заказано</th>
                                    <th className="p-3 text-right text-xs font-semibold uppercase dark:text-gray-300">Получено</th>
                                    <th className="p-3 text-center text-xs font-semibold uppercase dark:text-gray-300">Статус</th>
                                    <th className="p-3 text-right text-xs font-semibold uppercase dark:text-gray-300">Действие</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {requisition.items.map((item) => {
                                    const remainingQty = (parseFloat(item.quantity) || 0) - (parseFloat(item.received_quantity) || 0);
                                    const isCompleted = remainingQty <= 0;

                                    return (
                                        <tr key={item.id}>
                                            <td className="p-2 w-1/3 dark:text-white">{item.chemical_name || '...'}</td>
                                            <td className="p-2 w-1/4 text-right dark:text-white">{item.quantity}</td>
                                            <td className="p-2 w-1/6 text-right font-medium dark:text-white">{item.received_quantity || 0}</td>
                                            <td className="p-2 text-center">
                                                {isCompleted ? <span className="text-green-600 font-semibold">✅&nbsp;Выполнено</span> : <span className="text-yellow-600">⏳&nbsp;В&nbsp;ожидании</span>}
                                            </td>
                                            <td className="p-2 text-right">
                                                {['in_progress', 'partially_completed'].includes(requisition.status) && !isCompleted && (
                                                    <button type="button" onClick={() => setReceivingItem(item)} className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600">Принять</button>
                                                )}
                                                {item.received_quantity > 0 && ['in_progress', 'partially_completed'].includes(requisition.status) && (
                                                    <button type="button" onClick={() => handleRevertItem(item.id)} className="text-gray-500 hover:text-red-600 text-xs ml-2 dark:text-white" title="Отменить все приемки по этой позиции">(откатить)</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {isEditable && <button type="button" onClick={addItem} className="mt-4 text-sm text-blue-600 hover:underline dark:text-blue-300">+ Добавить позицию</button>}

                {/* --- НОВАЯ СЕКЦИЯ "РАСПРЕДЕЛЕНИЕ ПО ОБЪЕКТАМ" --- */}
                <div className="mt-8 pt-6 border-t dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Распределение по объектам-потребителям</h3>
                    {/* --- НОВЫЙ БЛОК "СВОДКА" --- */}
                <div className="p-3 mb-6 bg-gray-100 dark:bg-gray-700 rounded-md space-y-2">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Сводка для распределения:</h4>
                    {requisition.items.filter(item => item.chemical && item.quantity).map(item => {
                        const chemical = chemicals.find(c => c.id === parseInt(item.chemical));
                        const totalQuantity = parseFloat(item.quantity) || 0;

                        // Считаем, сколько уже распределено для этого реагента по всем объектам
                        const distributedSum = Object.values(distribution).reduce((sum, facilityChemicals) => {
                            return sum + (parseFloat(facilityChemicals[item.chemical]) || 0);
                        }, 0);

                        const remainingToDistribute = totalQuantity - distributedSum;

                        return (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-800 dark:text-gray-200">{chemical?.name || '...'}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 dark:text-gray-400">Заказано: {totalQuantity}</span>
                                    <span className={`font-semibold ${remainingToDistribute < 0 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                        Осталось распределить: {remainingToDistribute.toLocaleString('ru-RU')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                    {isEditable && (
                        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <label htmlFor="add-facility-dist" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Добавить объект в распределение</label>
                            <select 
                                id="add-facility-dist" 
                                onChange={(e) => addFacilityToDistribution(e.target.value)} 
                                value=""
                                className="mt-1 p-2 border rounded w-full md:w-1/2"
                            >
                                <option value="" disabled>Выберите объект...</option>
                                {facilities.map(f => (
                                    // Показываем только те объекты, которых еще нет в распределении
                                    !distribution[f.id] && <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {/* Контейнер для карточек */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.keys(distribution).map(facilityId => {
                            const facility = facilities.find(f => f.id === parseInt(facilityId));
                            // Считаем сумму, уже распределенную на этот объект
                            const sumForFacility = Object.values(distribution[facilityId]).reduce((sum, qty) => sum + (parseFloat(qty) || 0), 0);

                            return (
                                <div key={facilityId} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 relative">
                                    {isEditable && (
                                        <button type="button" onClick={() => removeFacilityFromDistribution(facilityId)} title="Убрать объект из распределения" className="absolute top-2 right-2 text-gray-400 hover:text-red-500">&times;</button>
                                    )}
                                    <h4 className="font-bold mb-3 dark:text-white">{facility?.name || 'Объект не найден'}</h4>
                                    <div className="space-y-2">
                                        {requisition.items.filter(item => item.chemical).map(item => {
                                            const chemical = chemicals.find(c => c.id === parseInt(item.chemical));
                                            // Считаем остаток по этой позиции для валидации
                                            const totalQuantity = parseFloat(item.quantity) || 0;
                                            const distributedSum = Object.keys(distribution).reduce((sum, fId) => sum + (parseFloat(distribution[fId][item.chemical]) || 0), 0);
                                            const remainingForChemical = totalQuantity - distributedSum;

                                            return (
                                                <div key={item.chemical} className="flex justify-between items-center">
                                                    <label className="text-sm dark:text-gray-300">{chemical?.name}</label>
                                                    <input 
                                                        type="number" 
                                                        step="1"
                                                        className="w-28 p-1 border rounded text-right"
                                                        placeholder="0"
                                                        value={distribution[facilityId][item.chemical] || ''}
                                                        onChange={(e) => handleDistributionChange(facilityId, item.chemical, e.target.value)}
                                                        disabled={!isEditable}
                                                        title={`Осталось распределить: ${remainingForChemical + (parseFloat(distribution[facilityId][item.chemical]) || 0)}`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t dark:border-gray-600 mt-3 pt-2 text-right text-sm font-semibold dark:text-white">
                                        Итого: {sumForFacility.toLocaleString('ru-RU')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                     {Object.keys(distribution).length === 0 && <p className="text-center text-gray-500 py-4">Ни один объект не добавлен в распределение.</p>}
                </div>

                {/* --- БЛОК КНОПОК УПРАВЛЕНИЯ --- */}
                <div className="mt-8 pt-4 border-t dark:border-gray-700 flex justify-between items-center">
                    {/* Кнопки смены статуса (слева) */}
                    <div>
                        {isEditMode && <RequisitionActionButtons requisition={requisition} onStatusChange={handleStatusUpdate}/>}
                    </div>
                    
                    {/* Кнопки сохранения и удаления (справа) */}
                    <div className="flex items-center space-x-3">
                        {isEditMode && user?.role === 'admin' && (
                            <button type="button" onClick={handleDelete} disabled={loading} className="bg-red-200 text-red-800 hover:bg-red-300 font-semibold py-2 px-4 rounded">Удалить</button>
                        )}
                        {isEditable && (
                            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">
                                {loading ? 'Сохранение...' : 'Сохранить изменения'}
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