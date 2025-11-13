// frontend/src/pages/NewOperationPage.jsx
import React, { useState, useEffect, useCallback, useMemo  } from 'react';
import { useNavigate, useLocation, useParams  } from 'react-router-dom';
import  apiClient, {API_BASE_URL } from '../api';
import { useAuthStore } from '../store/auth';
import Modal from '../components/Modal';
import ChemicalForm from '../components/ChemicalForm';

// Кастомный хук для предупреждения о несохраненных данных
const useUnsavedChangesWarning = (isDirty) => {
    useEffect(() => {
        const beforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', beforeUnload);
        return () => window.removeEventListener('beforeunload', beforeUnload);
    }, [isDirty]);
};

function NewOperationPage() {
    const { uuid } = useParams(); // Получаем uuid из URL. Если его нет, то это режим создания.
    const isEditMode = !!uuid;
    const navigate = useNavigate();
    const location = useLocation(); // Чтобы знать, откуда пришли
    const { user } = useAuthStore();
    
     // Состояния формы
    const [transactionType, setTransactionType] = useState('add');
    const [fromFacilityId, setFromFacilityId] = useState('');
    const [toFacilityId, setToFacilityId] = useState('');
    const [comment, setComment] = useState('');
    const [items, setItems] = useState([{ id: Date.now(), chemicalId: '', quantity: '' }]);
    const [documentFile, setDocumentFile] = useState(null); 
    const [operationDate, setOperationDate] = useState(new Date().toISOString().slice(0, 16));
    const [sourceInventory, setSourceInventory] = useState([]);
    const [isCreateChemicalModalOpen, setCreateChemicalModalOpen] = useState(false);
    const [creatingChemicalForRow, setCreatingChemicalForRow] = useState(null);

    // Справочники и UI
    const [chemicals, setChemicals] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    useUnsavedChangesWarning(isDirty);



    // Загрузка справочников
    useEffect(() => {
        const fetchData = async () => {
            const [chemRes, facRes] = await Promise.all([
                apiClient.get('/chemicals/'),
                apiClient.get('/facilities/'),
            ]);
            const chemicalsData = chemRes.data;
            chemicalsData.sort((a, b) => a.name.localeCompare(b.name));
            setChemicals(chemicalsData);
            setFacilities(facRes.data);
        };
        fetchData();
    }, []);

    // Загрузка данных для РЕДАКТИРОВАНИЯ
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            const fetchOperationData = async () => {
                try {
                    const response = await apiClient.get(`/transactions/?operation_uuid=${uuid}`);
                    const operationItems = response.data;
                    if (operationItems.length > 0) {
                        const rep = operationItems[0];
                        setTransactionType(rep.transaction_type);
                        setFromFacilityId(rep.from_facility_id || '');
                        setToFacilityId(rep.to_facility_id || '');
                        setComment(rep.comment || '');
                        if (rep.operation_date) {
                            const date = new Date(rep.operation_date);
                            // Корректируем часовой пояс перед форматированием
                            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                            setOperationDate(date.toISOString().slice(0, 16));
                        }
                        setItems(operationItems.map(tx => ({
                            id: tx.id,
                            chemicalId: tx.chemical.id,
                            quantity: tx.quantity
                        })));
                    }
                } catch (err) {
                    setError('Не удалось загрузить данные операции для редактирования.');
                } finally {
                    setLoading(false);
                }
            };
            fetchOperationData();
        } else {
            // Установки по умолчанию для режима СОЗДАНИЯ
            if (user?.role === 'engineer') {
                setTransactionType('consume');
                setFromFacilityId(user.related_facility);
            }
        }
    }, [isEditMode, uuid, user]);

    useEffect(() => {
        if (fromFacilityId) {
            // Загружаем остатки для выбранного объекта
            apiClient.get(`/inventory/?facility=${fromFacilityId}`)
                .then(res => setSourceInventory(res.data))
                .catch(err => console.error("Failed to load source inventory", err));
        } else {
            setSourceInventory([]); // Очищаем, если объект не выбран
        }
    }, [fromFacilityId]);

    const sortedChemicals = useMemo(() => {
        if (transactionType === 'add' || sourceInventory.length === 0) {
            return chemicals;
        }
        const stockMap = new Map(sourceInventory.map(item => [item.chemical.id, parseFloat(item.quantity)]));
        const chemicalsCopy = [...chemicals];
        chemicalsCopy.sort((a, b) => {
            // Проверяем, есть ли реагент в остатках и СТРОГО БОЛЬШЕ ли он нуля
            const aInStock = (stockMap.get(a.id) || 0) > 0;
            const bInStock = (stockMap.get(b.id) || 0) > 0;

            if (aInStock && !bInStock) return -1;
            if (!aInStock && bInStock) return 1;
            return 0; // Алфавитный порядок уже задан
        });
        
        return chemicalsCopy;
    }, [chemicals, sourceInventory, transactionType]);

    const handleItemChange = (index, field, value) => {
        setIsDirty(true);
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setIsDirty(true);
        // Добавляем уникальный id для key в React
        setItems([...items, { id: Date.now(), chemicalId: '', quantity: '' }]);
    };

    const removeItem = (index) => {
        setIsDirty(true);
        setItems(items.filter((_, i) => i !== index));
    };

    const handleBack = () => {
        if (isDirty && !window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите уйти?')) {
            return;
        }
        // Возвращаемся на предыдущую страницу или на главную по умолчанию
        navigate(location.state?.from || '/');
    };

    const openCreateChemicalModal = (index) => {
        setCreatingChemicalForRow(index);
        setCreateChemicalModalOpen(true);
    };

    const handleChemicalCreated = async () => {
        // 1. Обновляем справочник реагентов
        const res = await apiClient.get('/chemicals/');
        setChemicals(res.data);
        
        // 2. TODO: Автоматически выбрать новый реагент.
        // Для этого бэкенд при создании должен возвращать созданный объект.
        // Пока просто закрываем окно.
        setCreateChemicalModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const itemsPayload = items
            .filter(item => item.chemicalId && item.quantity && parseFloat(item.quantity) > 0)
            .map(item => ({ chemicalId: item.chemicalId, quantity: item.quantity }));
        
        if (itemsPayload.length === 0) {
            setError('Добавьте хотя бы один реагент с корректным количеством (больше нуля).');
            setLoading(false);
            return;
        }

        try {
            if (isEditMode) {
                // --- РЕДАКТИРОВАНИЕ (отправляем JSON) ---
                const operationData = {
                    transaction_type: transactionType,
                    from_facility: fromFacilityId || null,
                    to_facility: toFacilityId || null,
                    comment: comment,
                    items: itemsPayload,
                    operation_date: operationDate, // Не забываем дату
                    // Файл при редактировании пока не отправляем для простоты
                };

                await apiClient.post('/operations/edit/', {
                    original_uuid: uuid,
                    new_operation_data: operationData,
                });
                alert('Операция успешно изменена!');

            } else {
                // --- СОЗДАНИЕ (отправляем FormData) ---
                const formData = new FormData(); // Объявляем здесь!
                
                formData.append('transaction_type', transactionType);
                if (fromFacilityId) formData.append('from_facility', fromFacilityId);
                if (toFacilityId) formData.append('to_facility', toFacilityId);
                formData.append('comment', comment);
                formData.append('operation_date', operationDate); // Добавляем дату
                if (documentFile) formData.append('document_file', documentFile);
                formData.append('items', JSON.stringify(itemsPayload));

                await apiClient.post('/operations/create/bulk/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                alert('Операция успешно создана!');
            }
            
            setIsDirty(false);
            navigate('/transactions');
        } catch (err) {
            // Универсальная обработка ошибок
            const errorData = err.response?.data;
            let errorMessage = 'Произошла неизвестная ошибка.';
            if (typeof errorData === 'object' && errorData !== null) {
                errorMessage = Object.entries(errorData)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
            } else if (typeof errorData === 'string' && errorData.includes('<html')) {
                errorMessage = "Внутренняя ошибка сервера. Подробности в консоли браузера.";
                console.error("Server Error Response:", err.response.data);
            } else if (typeof errorData === 'string') {
                errorMessage = errorData;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) return <p className="text-gray-900 dark:text-gray-100">Загрузка операции...</p>;

     return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={handleBack} className="text-blue-600 hover:text-blue-700 hover:underline font-semibold flex items-center dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Назад
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-50">{isEditMode ? 'Редактирование операции' : 'Новая операция'}</h1>
                <div></div> 
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 dark:border dark:border-gray-700">
                {error && <p className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4 text-sm whitespace-pre-wrap dark:bg-red-900/30 dark:border-red-600 dark:text-red-300">{error}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <label htmlFor="transaction_type" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Тип операции</label>
                        <select id="transaction_type" value={transactionType} onChange={e => { setTransactionType(e.target.value); setIsDirty(true); }} disabled={user?.role === 'engineer'} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:disabled:bg-gray-800 dark:disabled:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
                            {user?.role !== 'engineer' && <option value="add">Поступление</option>}
                            <option value="consume">Списание</option>
                            {user?.role !== 'engineer' && <option value="transfer">Перемещение</option>}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="operation_date" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Дата и время операции</label>
                        <input id="operation_date" type="datetime-local" value={operationDate} onChange={e => { setOperationDate(e.target.value); setIsDirty(true); }} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"/>
                    </div>
                    {(transactionType === 'consume' || transactionType === 'transfer') && (
                        <div>
                            <label htmlFor="from_facility" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Из объекта (Откуда)</label>
                            <select id="from_facility" value={fromFacilityId} onChange={e => { setFromFacilityId(e.target.value); setIsDirty(true); }} disabled={user?.role === 'engineer'} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:disabled:bg-gray-800 dark:disabled:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
                                <option value="">Выберите объект...</option>
                                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}
                    {(transactionType === 'add' || transactionType === 'transfer') && (
                        <div>
                            <label htmlFor="to_facility" className="block text-sm font-medium text-gray-700 dark:text-gray-200">В объект (Куда)</label>
                            <select id="to_facility" value={toFacilityId} onChange={e => { setToFacilityId(e.target.value); setIsDirty(true); }} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
                                <option value="">Выберите объект...</option>
                                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Общий комментарий</label>
                        <textarea id="comment" value={comment} onChange={e => { setComment(e.target.value); setIsDirty(true); }} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"></textarea>
                    </div>
                    <div>
                        <label htmlFor="document_file" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Сопроводительный документ</label>
                        <input id="document_file" type="file" onChange={(e) => { setDocumentFile(e.target.files[0]); setIsDirty(true); }} className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-900/70 transition-colors"/>
                    </div>
                </div>
                
                <h3 className="text-lg font-semibold mt-6 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4 text-gray-800 dark:text-gray-100">Реагенты</h3>
                <div className="space-y-6">
                {items.map((item, index) => {
                    const stock = sourceInventory.find(inv => inv.chemical.id === parseInt(item.chemicalId));
                    const stockQuantity = stock ? stock.quantity : null;
                    const inStockIds = new Set(sourceInventory.map(invItem => invItem.chemical.id));
                    const stockMap = new Map(sourceInventory.map(invItem => [invItem.chemical.id, parseFloat(invItem.quantity)]));  
                    return (
                        <div key={item.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600">
                            <div className="flex-grow">
                                <label className="text-xs text-gray-500 dark:text-gray-300">Реагент</label>
                                <div className="flex items-center space-x-1">
                                    <select required value={item.chemicalId} onChange={e => handleItemChange(index, 'chemicalId', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
                                        <option value="">Выберите реагент...</option>
                                        {sortedChemicals.map(c => {
                                const stockQuantity = stockMap.get(c.id);
                                let optionClassName = '';
                                // Если остаток определен...
                                if (stockQuantity !== undefined) {
                                    // ... и он строго больше нуля, делаем зеленым
                                    if (stockQuantity > 0) {
                                        optionClassName = 'font-bold text-green-700 dark:text-green-400';
                                    } 
                                    // ... а если меньше нуля, делаем оранжевым/красным
                                    else if (stockQuantity < 0) {
                                        optionClassName = 'font-semibold text-orange-600 dark:text-orange-400';
                                    }
                                }
                                
                                return (
                                    <option 
                                        key={c.id} 
                                        value={c.id}
                                        className={optionClassName}
                                    >
                                        {c.name}
                                    </option>
                                );
                            })}
                                    </select>
                                    <button type="button" onClick={() => openCreateChemicalModal(index)} title="Добавить новый реагент" className="p-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 transition-colors">+</button>
                                </div>
                            </div>
                            <div className="relative w-1/3">
                                <label className="text-xs text-gray-500 dark:text-gray-300">Количество, кг</label>
                                <input required type="number" step="0.01" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} placeholder="Кол-во в КГ" className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400" />
                                {(transactionType === 'consume' || transactionType === 'transfer') && item.chemicalId && (
                                    <span className={`absolute -bottom-5 right-0 text-xs ${stockQuantity !== null && stockQuantity > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-500 dark:text-red-400 font-semibold'}`}>
                                        {stockQuantity !== null ? `В наличии: ${stockQuantity}` : 'Нет в наличии'}
                                    </span>
                                )}
                            </div>
                            {items.length > 1 && (
                                <button type="button" onClick={() => removeItem(index)} title="Удалить строку" className="self-end mb-1 p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full text-2xl font-bold transition-colors">&times;</button>
                            )}
                        </div>
                    );
                })}
                </div>
                <button type="button" onClick={addItem} className="mt-4 text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition-colors">+ Добавить строку</button>
                
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
                    <button type="submit" disabled={loading} className="bg-green-600 text-white py-2 px-6 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-green-600 dark:hover:bg-green-500 dark:disabled:bg-gray-600 dark:disabled:text-gray-400 transition-colors">
                        {loading ? 'Выполнение...' : (isEditMode ? 'Сохранить изменения' : 'Выполнить операцию')}
                    </button>
                </div>
            </form>

            <Modal isOpen={isCreateChemicalModalOpen} onClose={() => setCreateChemicalModalOpen(false)}>
                <ChemicalForm onSuccess={handleChemicalCreated} onClose={() => setCreateChemicalModalOpen(false)} />
            </Modal>
        </div>
    );
}

export default NewOperationPage;