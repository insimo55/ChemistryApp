import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import Modal from '../components/Modal';
import ChemicalForm from '../components/ChemicalForm';
import { 
    Plus, 
    Trash2, 
    Edit2, 
    FlaskConical, 
    ArrowUpDown, 
    ArrowUp, 
    ArrowDown,
    Loader2,
    Search // Задел на будущее
} from 'lucide-react';

// --- Хелпер для заголовка таблицы с сортировкой ---
const SortableHeader = ({ label, sortKey, currentSort, onSort }) => {
    const isActive = currentSort.key === sortKey;
    
    return (
        <th 
            onClick={() => onSort(sortKey)} 
            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group select-none dark:text-gray-400"
        >
            <div className="flex items-center gap-1">
                {label}
                <span className={`text-gray-400 ${isActive ? 'text-blue-500' : 'opacity-0 group-hover:opacity-50'}`}>
                    {isActive ? (
                        currentSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                        <ArrowUpDown size={14} />
                    )}
                </span>
            </div>
        </th>
    );
};

function ChemicalsPage() {
    const [chemicals, setChemicals] = useState([]);
    const [editingChemical, setEditingChemical] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [sortConfig, setSortConfig] = useState({
        key: 'name',
        direction: 'asc',
    });

    const fetchChemicals = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/chemicals/');
            setChemicals(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChemicals();
    }, [fetchChemicals]);

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот реагент?')) {
            try {
                await apiClient.delete(`/chemicals/${id}/`);
                fetchChemicals();
            } catch (error) {
                alert('Ошибка: Нельзя удалить реагент, который используется в транзакциях.');
            }
        }
    };
    
    const openCreateModal = () => {
        setEditingChemical(null);
        setIsModalOpen(true);
    };

    const openEditModal = (chemical) => {
        setEditingChemical(chemical);
        setIsModalOpen(true);
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedChemicals = React.useMemo(() => {
        const sorted = [...chemicals];
        sorted.sort((a, b) => {
            const aValue = a[sortConfig.key] ?? '';
            const bValue = b[sortConfig.key] ?? '';

            if (typeof aValue === 'string') {
                return sortConfig.direction === 'asc'
                    ? aValue.localeCompare(bValue, 'ru')
                    : bValue.localeCompare(aValue, 'ru');
            }
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        });
        return sorted;
    }, [chemicals, sortConfig]);

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
            <Loader2 className="animate-spin mr-2"/> Загрузка справочника...
        </div>
    );

    return (
        <div className="p-1">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Справочник реагентов</h1>
                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Управление номенклатурой химии и материалов</p>
                </div>
                <button 
                    onClick={openCreateModal} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors font-medium dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                    <Plus size={18} />
                    Добавить реагент
                </button>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                            <tr>
                                <SortableHeader label="Название" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Ед. изм." sortKey="unit_of_measurement" currentSort={sortConfig} onSort={handleSort} />
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                    Описание
                                </th>
                                <th className="px-6 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {sortedChemicals.length > 0 ? sortedChemicals.map((chem) => (
                                <tr key={chem.id} className="hover:bg-gray-50 transition-colors group dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-purple-50 text-purple-600 p-2 rounded-lg mr-3 dark:bg-purple-900/30 dark:text-purple-400">
                                                <FlaskConical size={18} />
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-gray-200">{chem.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                            {chem.unit_of_measurement}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {chem.description || <span className="text-gray-300 italic">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => openEditModal(chem)} 
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-gray-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/30"
                                                title="Редактировать"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(chem.id)} 
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
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center">
                                            <FlaskConical className="w-10 h-10 text-gray-300 mb-2 dark:text-gray-600" />
                                            <p>Список реагентов пуст.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ChemicalForm 
                    chemical={editingChemical}
                    onSuccess={fetchChemicals} 
                    onClose={() => setIsModalOpen(false)} 
                />
            </Modal>
        </div>
    );
}

export default ChemicalsPage;