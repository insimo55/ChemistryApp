// frontend/src/pages/WellClosureFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api';

function WellClosureFormPage() {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    // Состояния
    const [closure, setClosure] = useState({
        facility: '',
        well_number: '', bush_number: '', status: 'open',
        start_date: '', end_date: '', comment: '',
        items: []
    });
    const [chemicals, setChemicals] = useState([]);
    const [loading, setLoading] = useState(isEditMode);
    const [calcLoading, setCalcLoading] = useState(false);
    const [error, setError] = useState('');
    const [facilities, setFacilities] = useState([]);

    // Загрузка данных
    useEffect(() => {
        apiClient.get('/facilities/').then(res => setFacilities(res.data.results || res.data));
        apiClient.get('/chemicals/').then(res => setChemicals(res.data.results || res.data));
        if (isEditMode) {
            apiClient.get(`/well-closures/${id}/`)
                .then(res => setClosure(res.data))
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode]);

    // Обработчики
    const handleChange = (e) => {
        const { name, value } = e.target;
        setClosure(prev => ({ ...prev, [name]: value }));
    };
    const handleItemChange = (index, field, value) => {
        const newItems = [...closure.items];
        newItems[index][field] = value;
        setClosure(prev => ({ ...prev, items: newItems }));
    };
    const addItem = () => setClosure(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), chemical: '', actual_quantity: 0, closed_quantity: 0 }] }));
    const removeItem = (index) => setClosure(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

    const handleCalculateActuals = async () => {
        if (!window.confirm("Это действие перезапишет существующие позиции фактического расхода. Продолжить?")) return;
        setCalcLoading(true);
        try {
            const response = await apiClient.post('/well-closures/calculate-actuals/', { 
            facility_id: closure.facility,
            start_date: closure.start_date,
            end_date: closure.end_date
        });
            const actualsMap = response.data;
            const newItems = Object.entries(actualsMap).map(([chemId, qty]) => ({
                id: `new_${chemId}`,
                chemical: parseInt(chemId),
                actual_quantity: qty,
                closed_quantity: closure.items.find(i => i.chemical === parseInt(chemId))?.closed_quantity || 0,
            }));
            setClosure(prev => ({ ...prev, items: newItems }));
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка расчета.");
        } finally {
            setCalcLoading(false);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...closure,
            facility: closure.facility || null,
            items: closure.items.map(({ id, chemical_name, unit_of_measurement, ...rest }) => rest)
        };
        const request = isEditMode
            ? apiClient.put(`/well-closures/${id}/`, payload)
            : apiClient.post('/well-closures/', payload);

        request.then(() => navigate('/well-closures')).catch(err => setError('Ошибка сохранения.'));
    };

    const handleFacilityChange = (e) => {
        const facilityId = e.target.value;
        const selectedFacility = facilities.find(f => f.id === parseInt(facilityId));
        
        setClosure(prev => ({
            ...prev,
            facility: facilityId,
            // Автоматически заполняем well_number и bush_number, если можем
            well_number: selectedFacility ? selectedFacility.name : '',
            bush_number: '' // Логику для куста можно добавить, если она есть
        }));
    };
    const handleDelete = async () => {
        // Запрашиваем подтверждение, так как действие необратимо
        if (window.confirm('Вы уверены, что хотите безвозвратно удалить эту запись о закрытии скважины?')) {
            try {
                setLoading(true); // Показываем индикатор загрузки
                await apiClient.delete(`/well-closures/${id}/`);
                alert('Запись успешно удалена.');
                navigate('/well-closures'); // Возвращаемся в реестр
            } catch (error) {
                setError('Не удалось удалить запись.');
                console.error("Delete well closure failed:", error);
                setLoading(false); // Выключаем индикатор загрузки в случае ошибки
            }
        }
    };
    // ... JSX формы (шапка, таблица позиций с кнопками, кнопка Сохранить)
 return (
        <div>
            {/* --- ШАПКА СТРАНИЦЫ И НАВИГАЦИЯ --- */}
            <div className="flex justify-between items-center mb-4">
                <Link to="/well-closures" className="text-blue-600 hover:underline font-semibold flex items-center dark:text-blue-400 dark:hover:text-blue-600 transition-colors">
                   &larr; К реестру закрытых скважин
                </Link>
                <h1 className="text-3xl font-bold">{isEditMode ? `Редактирование закрытия скважины` : 'Новая запись'}</h1>
                {/* Пустой div для выравнивания */}
                <div className="w-48"></div> 
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
                {error && <p className="bg-red-100 p-3 rounded mb-4 text-sm whitespace-pre-wrap">{error}</p>}
                
                {/* --- СЕКЦИЯ "ШАПКА ЗАЯВКИ" --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                    <div>
                        <label htmlFor="bush_number" className="block text-sm font-medium">Номер куста</label>
                        <input id="bush_number" name="bush_number" type="text" value={closure.bush_number} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded dark:bg-gray-700"/>
                    </div>
                    <div>
                        <label htmlFor="well_number" className="block text-sm font-medium">Номер скважины</label>
                        <input id="well_number" name="well_number" type="text" value={closure.well_number} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded dark:bg-gray-700"/>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium">Статус</label>
                        <select id="status" name="status" value={closure.status} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded dark:bg-gray-700">
                            <option value="open">Не закрыта</option>
                            <option value="partially_closed">Закрыта частично</option>
                            <option value="closed">Закрыта</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium">Дата начала работ</label>
                        <input id="start_date" name="start_date" type="date" value={closure.start_date} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label htmlFor="end_date" className="block text-sm font-medium">Дата окончания работ</label>
                        <input id="end_date" name="end_date" type="date" value={closure.end_date} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded dark:bg-gray-700"/>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                         <label htmlFor="comment" className="block text-sm font-medium">Комментарий</label>
                         <textarea id="comment" name="comment" value={closure.comment} onChange={handleChange} rows="2" className="mt-1 block w-full p-2 border rounded dark:bg-gray-700"></textarea>
                    </div>

                    {/* --- ИСПРАВЛЕННЫЙ БЛОК ДЛЯ СВЯЗИ С ОБЪЕКТОМ --- */}
                    {/* Он находится ВНУТРИ основной сетки */}
                    <div className="lg:col-span-3 border-t pt-4 mt-4">
                        <label htmlFor="facility" className="block text-sm font-medium text-gray-700 dark:text-gray-100">Связанный объект из справочника (опционально)</label>
                        <p className="text-xs text-gray-500 mb-1 dark:text-gray-300">Выберите объект, чтобы включить автоматический расчет фактического расхода.</p>
                        <select 
                            id="facility" 
                            name="facility" 
                            value={closure.facility || ''} 
                            onChange={handleFacilityChange}
                            className="mt-1 block w-full md:w-1/2 p-2 border rounded dark:bg-gray-700"
                        >
                            <option value="">Не выбрано</option>
                            {facilities.filter(f => f.type === 'well').map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                </div> {/* <-- ПРАВИЛЬНОЕ МЕСТО ДЛЯ ЗАКРЫТИЯ СЕТКИ "ШАПКИ" */}

                {/* --- СЕКЦИЯ "ПОЗИЦИИ" --- */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Расход реагентов</h3>
                    <button 
                        type="button" 
                        onClick={handleCalculateActuals} 
                        disabled={!closure.facility || calcLoading} 
                        className="bg-indigo-500 text-white text-sm px-4 py-2 rounded-md shadow-sm hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={!closure.facility ? "Сначала выберите и сохраните связанный объект" : "Рассчитать фактический расход по транзакциям"}
                    >
                        {calcLoading ? 'Расчет...' : 'Рассчитать факт'}
                    </button>
                </div>
                <div className=" rounded-lg overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-200 dark:bg-neutral-600 dark:border-gray-700">
                            <tr>
                                <th className="p-3 w-2/5 text-left text-xs font-semibold text-black uppercase dark:text-gray-100">Реагент</th>
                                <th className="p-3 w-1/4 text-right text-xs font-semibold text-black uppercase dark:text-gray-100">Фактический расход</th>
                                <th className="p-3 w-1/4 text-right text-xs font-semibold text-black uppercase dark:text-gray-100">Закрытое количество</th>
                                <th className="p-3 w-auto"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {closure.items.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="p-2">
                                        <select value={item.chemical} onChange={e => handleItemChange(index, 'chemical', e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700">
                                            <option value="">Выберите...</option>
                                            {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input type="number" step="0.01" value={item.actual_quantity} onChange={e => handleItemChange(index, 'actual_quantity', e.target.value)} required className="w-full p-2 border rounded text-right dark:bg-gray-700"/>
                                    </td>
                                    <td className="p-2">
                                        <input type="number" step="0.01" value={item.closed_quantity} onChange={e => handleItemChange(index, 'closed_quantity', e.target.value)} required className="w-full p-2 border rounded text-right dark:bg-gray-700"/>
                                    </td>
                                    <td className="p-2 text-center">
                                        <button type="button" onClick={() => removeItem(index)} title="Удалить позицию" className="text-red-500 hover:text-red-700 text-2xl font-bold">&times;</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-500 dark:hover:text-blue-300">+ Добавить позицию</button>

                {/* --- КНОПКА СОХРАНЕНИЯ --- */}
                <div className="mt-8 pt-4 border-t flex justify-between items-center">
                    {/* Кнопка "Удалить" (слева), видна только в режиме редактирования */}
                    <div>
                        {isEditMode && (
                            <button
                                type="button" // Важно, чтобы не отправлять форму
                                onClick={handleDelete}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md disabled:bg-gray-400"
                            >
                                Удалить запись
                            </button>
                        )}
                    </div>
                    
                    {/* Кнопка "Сохранить" (справа) */}
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 dark:hover:bg-blue-900 transition-colors"
                    >
                        {loading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать запись')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default WellClosureFormPage;