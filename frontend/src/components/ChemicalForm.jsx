// frontend/src/components/ChemicalForm.jsx
// (Это тот же код, что был в ChemicalsPage, просто в отдельном файле)
import React, { useState } from 'react';
import apiClient from '../api';

function ChemicalForm({ chemical, onSuccess, onClose }) {
    // --- Форма создания реагента (можно вынести в отдельный компонент) ---
    const [name, setName] = useState(chemical?.name || ''); // Если chemical есть, берем его данные
    const [unit, setUnit] = useState(chemical?.unit_of_measurement || 'кг');
    const [desc, setDesc] = useState(chemical?.description || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

     const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { name, unit_of_measurement: unit, description: desc };
        try {
            if (chemical) { // Если редактируем, то отправляем PATCH
                await apiClient.patch(`/chemicals/${chemical.id}/`, payload);
            } else { // Если создаем, то POST
                await apiClient.post('/chemicals/', payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError('Ошибка создания. Убедитесь, что все поля заполнены.');
            console.error("Failed to create chemical", err);
        } finally {
            setLoading(false);
        }
    };
    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-6">
                {chemical ? 'Редактирование реагента' : 'Новый реагент'}
            </h3>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Название</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Единица измерения</label>
                    <select value={unit} onChange={e => setUnit(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                        <option>кг</option>
                        <option>л</option>
                        <option>шт</option>
                        <option>т</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Описание</label>
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"></textarea>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Отмена</button>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>
        </form>
    )

}
export default ChemicalForm;