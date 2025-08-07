// frontend/src/pages/FacilitiesAdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import Modal from '../components/Modal';

// --- Форма для объекта ---
const FacilityForm = ({ facility, onSuccess, onClose }) => {
    const [name, setName] = useState(facility?.name || '');
    const [type, setType] = useState(facility?.type || 'warehouse');
    const [location, setLocation] = useState(facility?.location || '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { name, type, location };
        try {
            if (facility) {
                await apiClient.patch(`/facilities/${facility.id}/`, payload);
            } else {
                await apiClient.post('/facilities/', payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            alert('Ошибка сохранения. Убедитесь, что все поля заполнены корректно.');
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-6">{facility ? 'Редактирование объекта' : 'Новый объект'}</h3>
            <div className="space-y-4">
                {/* Поле для Названия */}
                <div>
                    <label className="block text-sm">Название</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full p-2 border rounded"/>
                </div>
                {/* Поле для Типа */}
                <div>
                    <label className="block text-sm">Тип</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full p-2 border rounded">
                        <option value="warehouse">Склад</option>
                        <option value="well">Скважина</option>
                        <option value="other">Прочее</option>
                    </select>
                </div>
                {/* Поле для Местоположения */}
                 <div>
                    <label className="block text-sm">Местоположение</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full p-2 border rounded"/>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-gray-200 py-2 px-4 rounded">Отмена</button>
                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded">Сохранить</button>
            </div>
        </form>
    );
};

// --- Сама страница ---
function FacilitiesAdminPage() {
    const [facilities, setFacilities] = useState([]);
    const [editingFacility, setEditingFacility] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchFacilities = useCallback(async () => {
        setLoading(true);
        const res = await apiClient.get('/facilities/');
        setFacilities(res.data);
        setLoading(false);
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

    if (loading) return <p>Загрузка...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Управление объектами</h1>
                <button onClick={openCreateModal} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">+ Добавить объект</button>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Название</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Тип</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Местоположение</th>
                            <th className="px-5 py-3 border-b-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {facilities.map(fac => (
                            <tr key={fac.id}>
                                <td className="px-5 py-5 border-b text-sm">{fac.name}</td>
                                <td className="px-5 py-5 border-b text-sm capitalize">{fac.type}</td>
                                <td className="px-5 py-5 border-b text-sm">{fac.location || '—'}</td>
                                <td className="px-5 py-5 border-b text-sm text-right">
                                    <button onClick={() => openEditModal(fac)} className="text-indigo-600 hover:text-indigo-900 mr-4">Редактировать</button>
                                    <button onClick={() => handleDelete(fac.id)} className="text-red-600 hover:text-red-900">Удалить</button>
                                </td>
                            </tr>
                        ))}
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

export default FacilitiesAdminPage;