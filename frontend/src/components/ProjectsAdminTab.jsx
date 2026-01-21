import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import Modal from './Modal';
// Импортируем иконки
import { 
    Plus, 
    Trash2, 
    Edit2, 
    Calendar, 
    Briefcase, 
    CheckCircle, 
    Clock, 
    AlertCircle,
    Save,
    X
} from 'lucide-react';

// --- Компонент Бэджа Статуса (для красоты) ---
const StatusBadge = ({ status }) => {
    const styles = {
        planning: "bg-gray-100 text-gray-800 border-gray-200",
        in_progress: "bg-blue-50 text-blue-700 border-blue-200",
        completed: "bg-green-50 text-green-700 border-green-200",
        on_hold: "bg-amber-50 text-amber-700 border-amber-200",
    };

    const labels = {
        planning: "Планируется",
        in_progress: "В работе",
        completed: "Завершен",
        on_hold: "Приостановлен",
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.planning}`}>
            {labels[status] || status}
        </span>
    );
};

// --- Форма создания/редактирования ---
const ProjectForm = ({ project, onSuccess, onClose, facilities, chemicals }) => {
    const isEditMode = !!project;
    
    const [name, setName] = useState(project?.name || '');
    const [facilityId, setFacilityId] = useState(project?.facility || '');
    const [startDate, setStartDate] = useState(project?.start_date || '');
    const [endDate, setEndDate] = useState(project?.end_date || '');
    const [status, setStatus] = useState(project?.status || 'planning');
    const [budgetLines, setBudgetLines] = useState(project?.budget_lines || [{ id: Date.now(), chemical: '', planned_quantity: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLineChange = (index, field, value) => {
        const newLines = [...budgetLines];
        newLines[index][field] = value;
        setBudgetLines(newLines);
    };

    const addLine = () => {
        setBudgetLines([...budgetLines, { id: Date.now(), chemical: '', planned_quantity: '' }]);
    };

    const removeLine = (index) => {
        setBudgetLines(budgetLines.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            name,
            facility: facilityId,
            start_date: startDate,
            end_date: endDate,
            status,
            budget_lines: budgetLines
                .filter(line => line.chemical && line.planned_quantity)
                .map(({ id, chemical_name, ...rest }) => rest)
        };

        try {
            if (isEditMode) {
                await apiClient.put(`/projects/${project.id}/`, payload);
            } else {
                await apiClient.post('/projects/', payload);
            }
            onSuccess();
        } catch (err) {
            setError(JSON.stringify(err.response?.data) || 'Ошибка сохранения.');
        } finally {
            setLoading(false);
        }
    };

    // Общий стиль для инпутов
    const inputClass = `
        mt-1 block w-full px-3 py-2 rounded-md text-sm shadow-sm 
        bg-white border border-gray-300 placeholder-gray-400 text-gray-900
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
        dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500
    `;
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {isEditMode ? 'Редактирование проекта' : 'Новый проект'}
                </h3>
                
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    <AlertCircle size={16} /> {error}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <label className={labelClass}>Название проекта / Скважина</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        placeholder="Например: Скважина №123 (Куст 5)"
                        className={inputClass}
                    />
                </div>
                
                <div>
                    <label className={labelClass}>Основной объект</label>
                    <select value={facilityId} onChange={e => setFacilityId(e.target.value)} required className={inputClass}>
                        <option value="">Выберите объект...</option>
                        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Статус</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} required className={inputClass}>
                        <option value="planning">Планируется</option>
                        <option value="in_progress">В работе</option>
                        <option value="completed">Завершен</option>
                        <option value="on_hold">Приостановлен</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Дата начала</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className={inputClass}/>
                </div>
                
                <div>
                    <label className={labelClass}>Дата окончания</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className={inputClass}/>
                </div>
            </div>

            {/* Секция бюджета */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide dark:text-gray-300">Плановый бюджет</h4>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600">
                        Позиций: {budgetLines.length}
                    </span>
                </div>
                
                <div className="space-y-3">
                    {budgetLines.map((line, index) => (
                        <div key={line.id} className="flex gap-3 items-end bg-white p-3 rounded-lg shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex-grow">
                                <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Реагент</label>
                                <select 
                                    value={line.chemical} 
                                    onChange={e => handleLineChange(index, 'chemical', e.target.value)} 
                                    required 
                                    // Инлайн класс для селекта внутри списка, дублирует стили inputClass, но чуть компактнее
                                    className="block w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                >
                                    <option value="">Выберите...</option>
                                    {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="w-32">
                                <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Количество</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={line.planned_quantity} 
                                    onChange={e => handleLineChange(index, 'planned_quantity', e.target.value)} 
                                    required 
                                    placeholder="0.00"
                                    className="block w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-right dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                />
                            </div>
                            <button 
                                type="button" 
                                onClick={() => removeLine(index)} 
                                className="mb-0.5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                                title="Удалить строку"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
                <button 
                    type="button" 
                    onClick={addLine} 
                    className="mt-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    <Plus size={16} className="mr-1"/> Добавить позицию
                </button>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                    Отмена
                </button>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                    {loading ? <Clock size={16} className="animate-spin"/> : <Save size={16}/>}
                    {loading ? 'Сохранение...' : 'Сохранить проект'}
                </button>
            </div>
        </form>
    );
};

// --- Основной компонент вкладки ---
function ProjectsAdminTab() {
    const [projects, setProjects] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [chemicals, setChemicals] = useState([]);
    const [editingProject, setEditingProject] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/projects/');
            setProjects(response.data.results || response.data);
        } catch (err) {
            setError('Не удалось загрузить список проектов.');
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchProjects();
        apiClient.get('/facilities/').then(res => setFacilities(res.data.results || res.data));
        apiClient.get('/chemicals/').then(res => setChemicals(res.data.results || res.data));
    }, [fetchProjects]);
    
    const handleDelete = async (projectId) => {
        if (window.confirm("Вы уверены, что хотите удалить этот проект?")) {
            try {
                await apiClient.delete(`/projects/${projectId}/`);
                fetchProjects();
            } catch (error) {
                alert('Ошибка удаления. Возможно, с проектом связаны транзакции.');
            }
        }
    };

    const openModal = (project = null) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
    };

    const handleSuccess = () => {
        closeModal();
        fetchProjects();
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
            <Clock className="animate-spin mr-2"/> Загрузка проектов...
        </div>
    );
    if (error) return <p className="text-red-500 dark:text-red-400 p-4">{error}</p>;

    return (
        <div className="p-1">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Проекты</h2>
                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Управление буровыми проектами и бюджетирование</p>
                </div>
                <button 
                    onClick={() => openModal(null)} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors font-medium dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                    <Plus size={18} />
                    Новый проект
                </button>
            </div>
            
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Название</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Объект</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Статус</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Период работ</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {projects.length > 0 ? projects.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg mr-3 dark:bg-indigo-900/30 dark:text-indigo-400">
                                            <Briefcase size={18} />
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-gray-200">{p.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                    {p.facility_name}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={p.status} />
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} className="text-gray-400 dark:text-gray-500"/>
                                        <span>{new Date(p.start_date).toLocaleDateString('ru-RU')} — {new Date(p.end_date).toLocaleDateString('ru-RU')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => openModal(p)} 
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/30"
                                            title="Редактировать"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(p.id)} 
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
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    Список проектов пуст. Создайте первый проект!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Модальное окно */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                maxWidth="max-w-3xl" // Чуть шире, так как форма в две колонки
                overflow="overflow-auto" maxHeigth="max-h-[75%]"
            >
                {/* 
                   Обрати внимание: мы НЕ передаем overflow и maxHeigth в Modal, 
                   так как мы договорились, что Modal сам управляет скроллом, 
                   а форма просто занимает столько места, сколько ей нужно.
                */}
                <ProjectForm 
                    project={editingProject} 
                    onSuccess={handleSuccess} 
                    onClose={closeModal} 
                    facilities={facilities} 
                    chemicals={chemicals} 
                />
            </Modal>
        </div>
    );
}

export default ProjectsAdminTab;