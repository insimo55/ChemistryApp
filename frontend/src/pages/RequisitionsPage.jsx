// frontend/src/pages/RequisitionsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { statusStyles } from '../utils/styleHelpers';


function RequisitionsPage() {
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        status: '',
        target_facility: '',
        start_date: '',
        end_date: '',
    });
    const [facilities, setFacilities] = useState([]);

    useEffect(() => {
        apiClient.get('/facilities/').then(res => setFacilities(res.data.results || res.data));
    }, []);

    // Загрузка заявок с учетом фильтров
    useEffect(() => {
        const fetchRequisitions = async () => {
            setLoading(true);
            const params = new URLSearchParams(filters);
            try {
                const response = await apiClient.get(`/requisitions/?${params.toString()}`);
                setRequisitions(response.data.results || response.data);
            } finally {
                setLoading(false);
            }
        };
        fetchRequisitions();
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => setFilters({ status: '', target_facility: '', start_date: '', end_date: '' });

    if (loading) return <p>Загрузка заявок...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold dark:text-white">Реестр заявок</h1>
                <Link 
                    to="/requisitions/new" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md dark:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
                >
                    + Создать заявку
                </Link>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-sm">Статус</label>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md">
                        <option value="">Все</option>
                        {Object.entries(statusStyles).map(([key, value]) => (
                            value.text !== 'Неизвестно' && <option key={key} value={key}>{value.text}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm">Объект</label>
                    <select name="target_facility" value={filters.target_facility} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md">
                        <option value="">Все</option>
                        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm">С даты</label>
                    <input
                        type="date"
                        name="start_date"
                        value={filters.start_date}
                        onChange={handleFilterChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700"
                    />
                    </div>
                    <div>
                    <label className="block text-sm">По дату</label>
                    <input
                        type="date"
                        name="end_date"
                        value={filters.end_date}
                        onChange={handleFilterChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700"
                    />
                </div>
                <button onClick={resetFilters} className="bg-gray-200 p-2 rounded-md">Сбросить</button>
            </div>


            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead className='bg-gray-50 dark:bg-neutral-800'>
                        <tr className='dark:text-white'>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase  dark:border-red-600">Номер</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:border-red-600">Статус</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:border-red-600">Объект</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:border-red-600">Дата поставки</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:border-red-600">Автор</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:border-red-600">Подана</th> 
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:border-red-600">Утверждена</th>
                            <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase dark:border-red-600">Позиций</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {requisitions.map(req => {
                            const statusInfo = statusStyles[req.status] || statusStyles.default;
                            return (
                                <tr 
                                    key={req.id} 
                                    className="hover:bg-gray-50 cursor-pointer dark:hover:bg-neutral-500 dark:bg-gray-700 dark:text-gray-100"
                                    onClick={() => navigate(`/requisitions/${req.id}`)}
                                >
                                    <td className="px-5 py-4 text-sm font-medium">Заявка №{req.req_number}</td>
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