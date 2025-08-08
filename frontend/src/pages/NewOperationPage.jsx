// frontend/src/pages/NewOperationPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams  } from 'react-router-dom';
import { apiClient, API_BASE_URL } from '../api';
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
            setChemicals(chemRes.data);
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

    if (loading && isEditMode) return <p>Загрузка операции...</p>;

     return (
        <div>
            {/* --- НАВИГАЦИЯ И ЗАГОЛОВОК --- */}
            <div className="flex items-center justify-between mb-4">
                <button 
                    onClick={handleBack} 
                    className="text-blue-600 hover:underline font-semibold flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Назад
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? 'Редактирование операции' : 'Новая операция'}
                </h1>
                {/* Пустой div для выравнивания заголовка по центру */}
                <div></div> 
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
                {error && <p className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4 text-sm whitespace-pre-wrap">{error}</p>}
                
                {/* --- СЕКЦИЯ: ОБЩИЕ ДАННЫЕ ОПЕРАЦИИ --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 pb-4 border-b">
                    {/* ТИП ОПЕРАЦИИ */}
                    <div>
                        <label htmlFor="transaction_type" className="block text-sm font-medium text-gray-700">Тип операции</label>
                        <select 
                            id="transaction_type"
                            value={transactionType} 
                            onChange={e => { setTransactionType(e.target.value); setIsDirty(true); }} 
                            disabled={user?.role === 'engineer'} 
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        >
                            {user?.role !== 'engineer' && <option value="add">Поступление</option>}
                            <option value="consume">Списание</option>
                            {user?.role !== 'engineer' && <option value="transfer">Перемещение</option>}
                        </select>
                    </div>
                    {/* ДАТА И ВРЕМЯ */}
                    <div>
                        <label htmlFor="operation_date" className="block text-sm font-medium text-gray-700">Дата и время операции</label>
                        <input 
                            id="operation_date"
                            type="datetime-local" 
                            value={operationDate}
                            onChange={e => { setOperationDate(e.target.value); setIsDirty(true); }}
                            required
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    {/* ОБЪЕКТ "ОТКУДА" */}
                    {(transactionType === 'consume' || transactionType === 'transfer') && (
                        <div>
                            <label htmlFor="from_facility" className="block text-sm font-medium text-gray-700">Из объекта (Откуда)</label>
                            <select 
                                id="from_facility"
                                value={fromFacilityId} 
                                onChange={e => { setFromFacilityId(e.target.value); setIsDirty(true); }} 
                                disabled={user?.role === 'engineer'} 
                                required 
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                            >
                                <option value="">Выберите объект...</option>
                                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}
                    {/* ОБЪЕКТ "КУДА" */}
                    {(transactionType === 'add' || transactionType === 'transfer') && (
                        <div>
                            <label htmlFor="to_facility" className="block text-sm font-medium text-gray-700">В объект (Куда)</label>
                            <select 
                                id="to_facility"
                                value={toFacilityId} 
                                onChange={e => { setToFacilityId(e.target.value); setIsDirty(true); }} 
                                required 
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Выберите объект...</option>
                                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                {/* КОММЕНТАРИЙ И ФАЙЛ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Общий комментарий</label>
                        <textarea 
                            id="comment"
                            value={comment} 
                            onChange={e => { setComment(e.target.value); setIsDirty(true); }} 
                            rows="3"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="document_file" className="block text-sm font-medium text-gray-700">Сопроводительный документ</label>
                        <input 
                            id="document_file"
                            type="file" 
                            onChange={(e) => { setDocumentFile(e.target.files[0]); setIsDirty(true); }} 
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                </div>
                
                {/* --- СЕКЦИЯ: СПИСОК РЕАГЕНТОВ --- */}
                <h3 className="text-lg font-semibold mt-6 mb-4 border-t pt-4">Реагенты</h3>
                <div className="space-y-6">
                {items.map((item, index) => {
                    const stock = sourceInventory.find(inv => inv.chemical.id === parseInt(item.chemicalId));
                    const stockQuantity = stock ? stock.quantity : null;

                    return (
                        <div key={item.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border">
                            {/* Выбор реагента */}
                            <div className="flex-grow">
                                <label className="text-xs text-gray-500">Реагент</label>
                                <div className="flex items-center space-x-1">
                                    <select required value={item.chemicalId} onChange={e => handleItemChange(index, 'chemicalId', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                        <option value="">Выберите реагент...</option>
                                        {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button type="button" onClick={() => openCreateChemicalModal(index)} title="Добавить новый реагент" className="p-2 bg-gray-200 rounded hover:bg-gray-300">+</button>
                                </div>
                            </div>
                            {/* Количество */}
                            <div className="relative w-1/3">
                                <label className="text-xs text-gray-500">Количество</label>
                                <input required type="number" step="0.01" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} placeholder="Кол-во" className="w-full p-2 border border-gray-300 rounded-md" />
                                {(transactionType === 'consume' || transactionType === 'transfer') && item.chemicalId && (
                                    <span className={`absolute -bottom-5 right-0 text-xs ${
                                        stockQuantity !== null && stockQuantity > 0 ? 'text-gray-500' : 'text-red-500 font-semibold'
                                    }`}>
                                        {stockQuantity !== null ? `В наличии: ${stockQuantity}` : 'Нет в наличии'}
                                    </span>
                                )}
                            </div>
                            {/* Кнопка удаления строки */}
                            {items.length > 1 && (
                                <button type="button" onClick={() => removeItem(index)} title="Удалить строку" className="self-end mb-1 p-2 text-red-500 hover:text-red-700 rounded-full text-2xl font-bold">×</button>
                            )}
                        </div>
                    );
                })}
                </div>
                <button type="button" onClick={addItem} className="mt-4 text-sm text-blue-600 hover:underline">+ Добавить строку</button>
                
                {/* --- КНОПКА ОТПРАВКИ ФОРМЫ --- */}
                <div className="mt-8 pt-4 border-t text-right">
                    <button type="submit" disabled={loading} className="bg-green-600 text-white py-2 px-6 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400">
                        {loading ? 'Выполнение...' : (isEditMode ? 'Сохранить изменения' : 'Выполнить операцию')}
                    </button>
                </div>
            </form>

            {/* Модальное окно для создания реагента "на лету" */}
            <Modal isOpen={isCreateChemicalModalOpen} onClose={() => setCreateChemicalModalOpen(false)}>
                <ChemicalForm onSuccess={handleChemicalCreated} onClose={() => setCreateChemicalModalOpen(false)} />
            </Modal>
        </div>
    );
}

export default NewOperationPage;