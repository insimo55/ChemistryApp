import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuthStore } from '../store/auth';

function ReportUploadTab({ onUploadSuccess }) {
    const { user } = useAuthStore();

    // Состояния формы
    const [projectId, setProjectId] = useState('');
    const [facilityId, setFacilityId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Справочники
    const [projects, setProjects] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);

    // Загрузка справочников
    useEffect(() => {
        apiClient.get('/facilities/').then(res => {
            let userFacilities = res.data.results || res.data;
            if (user?.role === 'engineer' && user.related_facility) {
                userFacilities = userFacilities.filter(f => f.id === user.related_facility);
                if (userFacilities.length > 0) setFacilityId(userFacilities[0].id);
            }
            setFacilities(userFacilities);
        });
    }, [user]);

    useEffect(() => {
        if (facilityId) {
            // Загружаем проекты, отфильтрованные по facility
            apiClient.get(`/projects/?facility=${facilityId}`).then(res => {
                setProjects(res.data.results || res.data);
                setProjectId(''); // Сбрасываем выбор проекта при смене объекта
            });
        } else {
            setProjects([]); // Очищаем, если объект не выбран
        }
    }, [facilityId]);

    // Эффект для каскадной фильтрации проектов
    useEffect(() => {
        if (facilityId) {
            const facilitySpecificProjects = projects.filter(p => p.facility === parseInt(facilityId));
            setFilteredProjects(facilitySpecificProjects);
            setProjectId(''); // Сбрасываем выбор проекта при смене объекта
        } else {
            setFilteredProjects([]);
        }
    }, [facilityId, projects]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !facilityId || !date || !projectId) {
            setError('Пожалуйста, заполните все поля и выберите файл.');
            return;
        }
        setUploading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('facility_id', facilityId);
        const operation_datetime = `${date}T23:50:00`;
        formData.append('operation_date', operation_datetime); // <-- Правильное имя
        formData.append('report_file', file);         // <-- Правильное имя
        try {
            await apiClient.post('/reports/upload-transactions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setFile(null);
            if(e.target.reset) e.target.reset(); // Безопасный вызов reset
            alert('Рапорт отправлен на обработку!');
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки файла.');
            console.error("Upload error:", err.response?.data);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Загрузить новый рапорт</h2>
            {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
                    <label htmlFor="facility" className="block text-sm font-medium dark:text-gray-300">Объект</label>
                    <select id="facility" value={facilityId} onChange={e => setFacilityId(e.target.value)} required disabled={user?.role === 'engineer' && facilities.length === 1} className="mt-1 block w-full p-2 border rounded dark:bg-neutral-800 dark:border-gray-600">
                        <option value="">Выберите объект...</option>
                        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="project" className="block text-sm font-medium dark:text-gray-300">Проект/Скважина</label>
                    <select id="project" value={projectId} onChange={e => setProjectId(e.target.value)} required className="mt-1 block w-full p-2 border rounded dark:bg-neutral-800 dark:border-gray-600">
                        <option value="">Выберите проект...</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                
                <div>
                    <label htmlFor="report_date" className="block text-sm font-medium dark:text-gray-300">Дата рапорта</label>
                    <input id="report_date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full p-2 border rounded dark:bg-neutral-800 dark:border-gray-600"/>
                </div>
                <div>
                    <label htmlFor="report_file" className="block text-sm font-medium dark:text-gray-300">Файл (.xlsx)</label>
                    <input id="file" type="file" onChange={e => setFile(e.target.files[0])} required accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-300 hover:cursor-pointer"/>
                </div>
                <div className="md:col-span-2">
                    <button type="submit" disabled={uploading} className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 hover:cursor-pointer disabled:bg-gray-400">
                        {uploading ? 'Загрузка...' : 'Загрузить'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportUploadTab;