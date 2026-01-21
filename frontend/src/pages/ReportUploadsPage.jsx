// frontend/src/pages/ReportUploadsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';

function ReportUploadsPage() {
    const [reportGroups, setReportGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Функция для загрузки списка групп рапортов
    const fetchReportGroups = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/report-groups/');
            setReportGroups(response.data);
        } catch (err) {
            setError('Не удалось загрузить реестр.');
            console.error("Failed to fetch report groups:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Загружаем данные при первом рендере
    useEffect(() => {
        fetchReportGroups();
    }, [fetchReportGroups]);

    // Функция для удаления группы транзакций
    const handleDeleteGroup = async (uuid) => {
        if (window.confirm("Вы уверены, что хотите удалить все транзакции, связанные с этой загрузкой? Это действие необратимо и затронет остатки на складе.")) {
            try {
                // Отправляем DELETE запрос на детальный URL
                await apiClient.delete(`/report-groups/${uuid}/`);
                alert('Группа операций успешно удалена.');
                // Обновляем список, чтобы удаленная запись исчезла
                fetchReportGroups();
            } catch (err) {
                alert('Ошибка удаления: ' + (err.response?.data?.error || 'Неизвестная ошибка'));
                console.error("Delete report group failed:", err);
            }
        }
    };

    if (loading) return <p>Загрузка реестра...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Реестр загрузок суточных рапортов</h1>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase">Дата рапорта</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase">Проект</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase">Объект</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase">Загрузил</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase">Действие</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {reportGroups.length > 0 ? reportGroups.map(group => (
                            <tr key={group.operation_uuid}>
                                <td className="px-5 py-4 text-sm font-medium">{new Date(group.report_date).toLocaleDateString('ru-RU')}</td>
                                <td className="px-5 py-4 text-sm">{group.project_name}</td>
                                <td className="px-5 py-4 text-sm">{group.facility_name}</td>
                                <td className="px-5 py-4 text-sm">{group.uploader}</td>
                                <td className="px-5 py-4 text-sm text-right">
                                    <button 
                                        onClick={() => handleDeleteGroup(group.operation_uuid)}
                                        className="text-red-600 hover:text-red-900 font-semibold"
                                    >
                                        Удалить загрузку
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center py-10 text-gray-500">Нет загруженных рапортов.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ReportUploadsPage;