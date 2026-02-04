// frontend/src/pages/WellClosureFormPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api';

const IconCalc = ({ className = 'h-4 w-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M8 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-2V3a1 1 0 00-1-1H8zM7 7h6v2H7V7z"/></svg>
);
const IconTrash = ({ className = 'h-4 w-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-.993.883L5 3v1H3a1 1 0 000 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zM7 7a1 1 0 00-1 1v7a2 2 0 002 2h4a2 2 0 002-2V8a1 1 0 10-2 0v7H9V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
);
const IconPlus = ({ className = 'h-4 w-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/></svg>
);

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

    // helper - load chemical
    const chemicalMap = useMemo(() => {
        const map = {};
        chemicals.forEach(c => {
            map[c.id] = c;
        });
        return map;
    }, [chemicals]);
    
    const formatMoney = (value) =>
        new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 2
    }).format(value);


    // Обработчики
    const handleChange = (e) => {
        const { name, value } = e.target;
        setClosure(prev => ({ ...prev, [name]: value }));
    };
    const handleItemChange = (index, field, value) => {
        const newItems = [...closure.items];
        if (field === 'actual_quantity' || field === 'closed_quantity') {
            newItems[index][field] = value === '' ? '' : parseFloat(value);
        } else if (field === 'chemical') {
            newItems[index][field] = value === '' ? '' : parseInt(value);
        } else {
            newItems[index][field] = value;
        }
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
            <div className="flex justify-between items-center mb-6">
                <Link to="/well-closures" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold flex items-center dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    К реестру закрытых скважин
                </Link>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-50">{isEditMode ? `Редактирование закрытия скважины` : 'Новая запись'}</h1>
                <div className="w-48"></div> 
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                {error && <p className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 p-3 rounded mb-4 text-sm whitespace-pre-wrap">{error}</p>}
                
                {/* --- СЕКЦИЯ "ШАПКА ЗАЯВКИ" --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <label htmlFor="bush_number" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Номер куста</label>
                        <input 
                            id="bush_number" 
                            name="bush_number" 
                            type="text" 
                            value={closure.bush_number} 
                            onChange={handleChange} 
                            required 
                            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="well_number" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Номер скважины</label>
                        <input 
                            id="well_number" 
                            name="well_number" 
                            type="text" 
                            value={closure.well_number} 
                            onChange={handleChange} 
                            required 
                            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Статус</label>
                        <select 
                            id="status" 
                            name="status" 
                            value={closure.status} 
                            onChange={handleChange} 
                            required 
                            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        >
                            <option value="open">Не закрыта</option>
                            <option value="partially_closed">Закрыта частично</option>
                            <option value="closed">Закрыта</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Дата начала работ</label>
                        <input 
                            id="start_date" 
                            name="start_date" 
                            type="date" 
                            value={closure.start_date} 
                            onChange={handleChange} 
                            required 
                            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                    </div>
                     <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Дата окончания работ</label>
                        <input 
                            id="end_date" 
                            name="end_date" 
                            type="date" 
                            value={closure.end_date} 
                            onChange={handleChange} 
                            required 
                            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                         <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Комментарий</label>
                         <textarea 
                            id="comment" 
                            name="comment" 
                            value={closure.comment} 
                            onChange={handleChange} 
                            rows="3" 
                            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        ></textarea>
                    </div>

                    {/* --- ИСПРАВЛЕННЫЙ БЛОК ДЛЯ СВЯЗИ С ОБЪЕКТОМ --- */}
                    <div className="lg:col-span-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <label htmlFor="facility" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Связанный объект из справочника (опционально)</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Выберите объект, чтобы включить автоматический расчет фактического расхода.</p>
                        <select 
                            id="facility" 
                            name="facility" 
                            value={closure.facility || ''} 
                            onChange={handleFacilityChange}
                            className="block w-full md:w-1/2 p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        >
                            <option value="">Не выбрано</option>
                            {facilities.filter(f => f.type === 'well').map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* --- СЕКЦИЯ "ПОЗИЦИИ" --- */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4 mb-3 md:mb-0">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Расход реагентов</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 px-3 py-1 rounded-md">
                            {closure.items.length} позиция{closure.items.length !== 1 ? 'й' : 'я'}
                        </div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100 ml-2">
                            Незакрытая стоимость: <span className="text-lg font-semibold text-blue-600 dark:text-blue-400 ml-2">{formatMoney(closure.items.reduce((sum, i) => {
                                const chem = chemicalMap[i.chemical];
                                return sum + (Number(i.actual_quantity) - Number(i.closed_quantity)) * (chem?.price || 0);
                            }, 0))}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button 
                            type="button" 
                            onClick={handleCalculateActuals} 
                            disabled={!closure.facility || calcLoading} 
                            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm px-3 py-2 rounded-md shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                            title={!closure.facility ? "Выберите объект для расчета" : "Рассчитать фактический расход по транзакциям"}
                        >
                            <IconCalc className="h-4 w-4 mr-2" /> {calcLoading ? 'Расчет...' : 'Рассчитать факт'}
                        </button>
                        <button type="button" onClick={addItem} className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded-md shadow-sm transition-colors">
                            <IconPlus className="h-4 w-4 mr-2" /> Добавить позицию
                        </button>
                    </div>
                </div> 
                <div className="rounded-lg overflow-x-auto custom-scrollbar border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800"> 
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Реагент</th>
                                <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Фактический расход, кг</th>
                                <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Закрытое количество, кг</th>
                                <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Δ, кг</th>
                                <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Цена за кг</th>
                                <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Δ, ₽</th>
                                <th className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 w-auto"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {closure.items.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-10 text-gray-500 dark:text-gray-400">
                                        <div className="mb-3 text-lg font-medium">Нет позиций</div>
                                        <button type="button" onClick={addItem} className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm shadow-sm">
                                            <IconPlus className="h-4 w-4 mr-2" /> Добавить позицию
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                closure.items.map((item, index) => {
                                    const actual = Number(item.actual_quantity || 0);
                                    const closed = Number(item.closed_quantity || 0);
                                    const deltaQty = actual - closed;

                                    const chemical = chemicalMap[item.chemical];
                                    const price = Number(chemical?.price || 0);
                                    const deltaMoney = deltaQty * price;

                                    const isMismatch = deltaQty !== 0;
                                    return (
                                    <tr
                                        key={item.id}
                                        className={`
                                            transition-colors
                                            ${isMismatch ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                                            hover:bg-gray-50 dark:hover:bg-gray-700/30
                                        `}
                                    >
                                        {/* Реагент */}
                                        <td className="px-4 py-3">
                                            <select 
                                                value={item.chemical} 
                                                onChange={e => handleItemChange(index, 'chemical', e.target.value)} 
                                                required 
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                            >
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
                                        </td>
                                        {/* Факт */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end space-x-2">
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={item.actual_quantity} 
                                                    onChange={e => handleItemChange(index, 'actual_quantity', e.target.value)} 
                                                    required 
                                                    className="w-28 p-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 text-right text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                                />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{chemical?.unit_of_measurement || 'кг'}</span>
                                            </div>
                                        </td> 
                                        {/* Закрыто */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end space-x-2">
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={item.closed_quantity} 
                                                    onChange={e => handleItemChange(index, 'closed_quantity', e.target.value)} 
                                                    required 
                                                    className="w-28 p-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 text-right text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                                />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{chemical?.unit_of_measurement || 'кг'}</span>
                                            </div>
                                        </td>
                                        {/* Δ количество */}
                                        <td className="px-4 py-3 text-right font-semibold">
                                            <span className={
                                                deltaQty > 0
                                                    ? 'text-red-600'
                                                    : deltaQty < 0
                                                    ? 'text-green-600'
                                                    : 'text-gray-500'
                                            }>
                                                {deltaQty.toFixed(2)}
                                            </span>
                                        </td>

                                        {/* Цена */}
                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                                            {price ? formatMoney(price) : '—'}
                                        </td>

                                        {/* Δ деньги */}
                                        <td className="px-4 py-3 text-right font-bold">
                                            <span className={
                                                deltaMoney > 0
                                                    ? 'text-red-600'
                                                    : deltaMoney < 0
                                                    ? 'text-green-600'
                                                    : 'text-gray-500'
                                            }>
                                                {formatMoney(deltaMoney)}
                                            </span>
                                        </td>
                                        {/* Удалить */}
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(index)} 
                                                title="Удалить позицию" 
                                                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                                            >
                                                <IconTrash className="h-4 w-4" />
                                            </button>
                                        </td> 
                                    </tr>
                                )}
                            )
                            )}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-700/40 font-semibold">
                            <tr>
                                <td colSpan="5" className="px-4 py-3 text-right">
                                    Итоговая незакрытая стоимость:
                                </td>
                                <td className="px-4 py-3 text-right text-lg">
                                    {formatMoney(
                                        closure.items.reduce((sum, i) => {
                                            const chem = chemicalMap[i.chemical];
                                            return sum + (Number(i.actual_quantity) - Number(i.closed_quantity)) * (chem?.price || 0);
                                        }, 0)
                                    )}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <button 
                    type="button" 
                    onClick={addItem} 
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
                >
                    + Добавить позицию
                </button>

                {/* --- КНОПКА СОХРАНЕНИЯ --- */}
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Удалить запись
                            </button>
                        )}
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать запись')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default WellClosureFormPage;