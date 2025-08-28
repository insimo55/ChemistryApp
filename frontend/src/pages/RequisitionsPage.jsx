// frontend/src/pages/RequisitionsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { statusStyles } from '../utils/styleHelpers';


function RequisitionsPage() {
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequisitions = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/requisitions/');
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
                <h1 className="text-3xl font-bold dark:text-white">Реестр заявок</h1>
                <Link 
                    to="/requisitions/new" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md"
                >
                    + Создать заявку
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead className='bg-gray-50 dark:bg-gray-700'>
                        <tr>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-white dark:border-red-600">Номер</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-white dark:border-red-600">Статус</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-white dark:border-red-600">Объект</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-white dark:border-red-600">Дата поставки</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-white dark:border-red-600">Автор</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-white dark:border-red-600">Подана</th> {/* <-- Новая колонка */}
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-white dark:border-red-600">Утверждена</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:text-white dark:border-red-600">Позиций</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {requisitions.map(req => {
                            const statusInfo = statusStyles[req.status] || statusStyles.default;
                            return (
                                <tr 
                                    key={req.id} 
                                    className="hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-600"
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
                                    <td className="...">{req.submitted_at ? new Date(req.submitted_at).toLocaleString('ru-RU') : '—'}</td>
                                    <td className="px-5 py-4 text-sm">
                                        {/* Если есть имя утвердившего, показываем его */}
                                        {req.approved_by_username ? (
                                            <div>
                                                <p className="font-medium text-gray-900">{req.approved_by_username}</p>
                                                {/* А если есть еще и дата, показываем ее ниже */}
                                                {req.approved_at && (
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(req.approved_at).toLocaleString('ru-RU')}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            // Если никто не утверждал, показываем прочерк
                                            '—'
                                        )}
                                    </td>
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