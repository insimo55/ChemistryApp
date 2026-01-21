import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import { useAuthStore } from '../store/auth';
import Modal from './Modal';
import DailyReportDetail from './DailyReportDetail';
// Импортируем иконки для красивого интерфейса
import { Trash2, Eye, FileText, Loader2, AlertCircle } from 'lucide-react';

function UploadsRegistryTab({ refreshTrigger }) {
    const { user } = useAuthStore();
    const [reportGroups, setReportGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);

    const fetchReportGroups = useCallback(async () => {
        setLoading(true);
        setError(''); // Сбрасываем ошибку перед запросом
        try {
            let url = '/report-groups/';
            if (user?.role === 'engineer' && user.related_facility) {
                url += `?from_facility=${user.related_facility}`;
            }
            const response = await apiClient.get(url);
            setReportGroups(response.data);
        } catch (err) {
            console.error("Failed to fetch report groups:", err);
            setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchReportGroups();
    }, [fetchReportGroups, refreshTrigger]);

    const handleDeleteGroup = async (uuid) => {
        if (window.confirm("Вы уверены? Это действие удалит все связанные транзакции и изменит остатки.")) {
            try {
                await apiClient.delete(`/report-groups/${uuid}/`);
                // Не используем alert, лучше просто обновить список
                setSelectedGroup(null);
                fetchReportGroups();
            } catch (err) {
                alert('Ошибка удаления: ' + (err.response?.data?.error || 'Неизвестная ошибка'));
            }
        }
    };

    // --- УЛУЧШЕННЫЙ UI ЗАГРУЗКИ ---
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p>Загрузка реестра...</p>
        </div>
    );

    // --- УЛУЧШЕННЫЙ UI ОШИБКИ ---
    if (error) return (
        <div className="flex items-center justify-center h-64 text-red-500 space-x-2">
            <AlertCircle />
            <p>{error}</p>
        </div>
    );

    return (
        <div className="p-1">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Реестр суточных рапортов</h1>
                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">История загрузок и управление данными</p>
                </div>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            {/* Исправил bg-neutral-800 на bg-gray-900 для единообразия палитры */}
                            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400">
                                <th className="px-6 py-4">Дата</th>
                                <th className="px-6 py-4">Проект / Объект</th>
                                <th className="px-6 py-4">Автор загрузки</th>
                                <th className="px-6 py-4 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {reportGroups.length > 0 ? reportGroups.map(group => (
                                <tr 
                                    key={group.operation_uuid} 
                                    // Сделал hover темнее (bg-gray-700/50), чтобы не слепило глаза
                                    className="hover:bg-gray-50 transition-colors duration-150 group dark:hover:bg-gray-700/50" 
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {/* Фон иконки теперь темный и полупрозрачный в Dark Mode */}
                                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3 dark:bg-blue-900/30 dark:text-blue-400">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">
                                                    {new Date(group.report_date).toLocaleDateString('ru-RU')}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">ID: {group.operation_uuid.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{group.project_name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{group.facility_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {/* Бэдж теперь тоже темнеет */}
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            {group.uploader}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3">
                                            <button 
                                                onClick={() => setSelectedGroup(group)}
                                                className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-full transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                                                title="Просмотреть детали"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleDeleteGroup(group.operation_uuid)}
                                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                                                title="Удалить навсегда"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4">
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            {/* Иконка и текст для пустого состояния в Dark Mode */}
                                            <div className="bg-gray-100 p-4 rounded-full mb-3 dark:bg-gray-700">
                                                <FileText className="text-gray-400 w-8 h-8 dark:text-gray-500" />
                                            </div>
                                            <h3 className="text-gray-900 font-medium dark:text-gray-200">Нет загруженных рапортов</h3>
                                            <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Загрузите первый отчет, чтобы он появился здесь.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Пагинация (футер таблицы) */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-xs text-gray-500 text-right dark:text-gray-400">
                        Всего записей: {reportGroups.length}
                    </p>
                </div>

                <Modal isOpen={!!selectedGroup} onClose={() => setSelectedGroup(null)} maxWidth="max-w-4xl" overflow="overflow-auto" maxHeigth="max-h-[75%]">
                    {selectedGroup && (
                        <DailyReportDetail
                            reportGroup={selectedGroup}
                            onDelete={handleDeleteGroup}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
}

export default UploadsRegistryTab;