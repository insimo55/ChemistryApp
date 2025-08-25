// frontend/src/pages/RequisitionsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api';

// Хелпер для красивого отображения статусов
const statusStyles = {
    draft: { text: 'Черновик', bg: 'bg-gray-200', text_color: 'text-gray-800' },
    submitted: { text: 'Подана', bg: 'bg-blue-200', text_color: 'text-blue-800' },
    reviewing: { text: 'На рассмотрении', bg: 'bg-yellow-200', text_color: 'text-yellow-800' },
    approved: { text: 'Утверждена', bg: 'bg-green-200', text_color: 'text-green-800' },
    in_progress: { text: 'В исполнении', bg: 'bg-indigo-200', text_color: 'text-indigo-800' },
    partially_completed: { text: 'Частично выполнена', bg: 'bg-purple-200', text_color: 'text-purple-800' },
    completed: { text: 'Выполнена', bg: 'bg-green-500', text_color: 'text-white' },
    cancelled: { text: 'Отменена', bg: 'bg-red-200', text_color: 'text-red-800' },
    overdue: { text: 'Просрочена', bg: 'bg-red-500', text_color: 'text-white' },
    default: { text: 'Неизвестно', bg: 'bg-gray-200', text_color: 'text-gray-800' },
};

function RequisitionsPage() {
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequisitions = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/api/requisitions/');
                setRequisitions(response.data.results || response.data);
            } catch (error) {
                console.error("Failed to fetch requisitions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRequisitions();
    }, []);

    if (loading) return <p>Загрузка заявок...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Реестр заявок</h1>
                <Link 
                    to="/requisitions/new" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"
                >
                    + Создать заявку
                </Link>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Номер</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Статус</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Объект</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Дата поставки</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Автор</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Позиций</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {requisitions.map(req => {
                            const statusInfo = statusStyles[req.status] || statusStyles.default;
                            return (
                                <tr 
                                    key={req.id} 
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/requisitions/${req.id}`)}
                                >
                                    <td className="px-5 py-4 text-sm font-medium">Заявка №{req.id}</td>
                                    <td className="px-5 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text_color}`}>
                                            {statusInfo.text}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm">{req.target_facility_name}</td>
                                    <td className="px-5 py-4 text-sm">{new Date(req.required_date).toLocaleDateString('ru-RU')}</td>
                                    <td className="px-5 py-4 text-sm">{req.created_by_username}</td>
                                    <td className="px-5 py-4 text-sm font-mono text-center">{req.items.length}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default RequisitionsPage;