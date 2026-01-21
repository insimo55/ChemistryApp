import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import Modal from './Modal';
import { 
    Plus, 
    Trash2, 
    Edit2, 
    MapPin, 
    Building2, 
    Warehouse, 
    Activity, 
    Loader2, 
    Save, 
    X 
} from 'lucide-react';

// --- Хелпер для иконки и цвета типа объекта ---
const FacilityTypeBadge = ({ type }) => {
    // Настройка стилей для разных типов
    const config = {
        warehouse: { 
            label: 'Склад', 
            style: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            icon: <Warehouse size={14} className="mr-1.5"/>
        },
        well: { 
            label: 'Скважина / Куст', 
            style: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            icon: <Activity size={14} className="mr-1.5"/>
        },
        other: { 
            label: 'Прочее', 
            style: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
            icon: <Building2 size={14} className="mr-1.5"/>
        }
    };

    const current = config[type] || config.other;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.style}`}>
            {current.icon}
            {current.label}
        </span>
    );
};

// --- Форма для объекта ---
const FacilityForm = ({ facility, onSuccess, onClose }) => {
    const [name, setName] = useState(facility?.name || '');
    const [type, setType] = useState(facility?.type || 'warehouse');
    const [location, setLocation] = useState(facility?.location || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = { name, type, location };
        try {
            if (facility) {
                await apiClient.patch(`/facilities/${facility.id}/`, payload);
            } else {
                await apiClient.post('/facilities/', payload);
            }
            onSuccess();
            onClose(); // Закрываем модалку только при успехе
        } catch (error) {
            alert('Ошибка сохранения. Убедитесь, что все поля заполнены корректно.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Стандартизированные классы для инпутов (как в проектах)
    const inputClass = `
        mt-1 block w-full px-3 py-2 rounded-md text-sm shadow-sm 
        bg-white border border-gray-300 placeholder-gray-400 text-gray-900
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
        dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500
    `;
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {facility ? 'Редактирование объекта' : 'Новый объект'}
                </h3>
                
            </div>

            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Название</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        placeholder="Например: Центральный склад"
                        className={inputClass}
                    />
                </div>
                
                <div>
                    <label className={labelClass}>Тип объекта</label>
                    <select value={type} onChange={e => setType(e.target.value)} className={inputClass}>
                        <option value="warehouse">Склад</option>
                        <option value="well">Скважина / Куст</option>
                        <option value="other">Прочее</option>
                    </select>
                </div>
                
                <div>
                    <label className={labelClass}>Местоположение</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin size={16} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            value={location} 
                            onChange={e => setLocation(e.target.value)} 
                            className={`${inputClass} pl-10`} // отступ слева под иконку
                            placeholder="Например: г. Сургут, ул. Нефтяников"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                    Отмена
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>
        </form>
    );
};

// --- Сама страница ---
function FacilitiesAdminTab() {
    const [facilities, setFacilities] = useState([]);
    const [editingFacility, setEditingFacility] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchFacilities = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/facilities/');
            setFacilities(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены? Это действие необратимо.')) {
            try {
                await apiClient.delete(`/facilities/${id}/`);
                fetchFacilities();
            } catch (error) {
                alert(error.response?.data?.error || 'Произошла ошибка при удалении.');
            }
        }
    };

    const openEditModal = (facility) => {
        setEditingFacility(facility);
        setIsModalOpen(true);
    };
    const openCreateModal = () => {
        setEditingFacility(null);
        setIsModalOpen(true);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
            <Loader2 className="animate-spin mr-2"/> Загрузка объектов...
        </div>
    );

    return (
        <div className="p-1">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Объекты</h2>
                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Справочник месторождений, складов и кустов</p>
                </div>
                <button 
                    onClick={openCreateModal} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors font-medium dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                    <Plus size={18} />
                    Добавить объект
                </button>
            </div>
            
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <table className="min-w-full leading-normal">
                    <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Название</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Тип</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Местоположение</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {facilities.length > 0 ? facilities.map(fac => (
                            <tr key={fac.id} className="hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {/* Иконка здания для общего вида */}
                                        <div className="bg-gray-100 p-2 rounded-lg mr-3 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                            <Building2 size={18} />
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-gray-200">{fac.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <FacilityTypeBadge type={fac.type} />
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                    {fac.location ? (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-gray-400" />
                                            {fac.location}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic text-xs">— не указано —</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => openEditModal(fac)} 
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/30"
                                            title="Редактировать"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(fac.id)} 
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                                            title="Удалить"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    Список объектов пуст.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <FacilityForm
                    facility={editingFacility}
                    onSuccess={fetchFacilities}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}

export default FacilitiesAdminTab;