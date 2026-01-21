import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { 
    X, 
    Calendar, 
    MapPin, 
    User, 
    FileText, 
    Activity, 
    Trash2, 
    FlaskConical, 
    CreditCard 
} from 'lucide-react';

function DailyReportDetail({ reportGroup, onDelete, onClose }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        apiClient.get(`/transactions/?operation_uuid=${reportGroup.operation_uuid}`)
            .then(res => {
                setTransactions(res.data.results || res.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [reportGroup.operation_uuid]);

    const representative = transactions[0];
    const totalCost = transactions.reduce((sum, tx) => sum + (parseFloat(tx.chemical.price) * parseFloat(tx.quantity)), 0);

    const formatMoney = (val) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(val);

    return (
        <div className="space-y-6">
            
            {/* Заголовок */}
            <div className="pr-8">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Детали рапорта
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                    UUID: {reportGroup.operation_uuid}
                </p>
            </div>

            {/* Сетка информации */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard 
                    icon={<Calendar size={18} className="text-blue-500 dark:text-blue-400" />} 
                    label="Дата" 
                    value={new Date(reportGroup.report_date).toLocaleDateString('ru-RU')} 
                />
                <InfoCard 
                    icon={<User size={18} className="text-purple-500 dark:text-purple-400" />} 
                    label="Загрузил" 
                    value={reportGroup.uploader} 
                />
                <InfoCard 
                    icon={<FileText size={18} className="text-green-500 dark:text-green-400" />} 
                    label="Проект" 
                    value={reportGroup.project_name} 
                />
                <InfoCard 
                    icon={<MapPin size={18} className="text-red-500 dark:text-red-400" />} 
                    label="Объект" 
                    value={reportGroup.facility_name} 
                />
            </div>

            {/* Описание работ */}
            {representative && (
                <div className="grid gap-3">
                    {representative.drilling_solution_ops && (
                        // Синий блок: в светлой теме светло-голубой, в темной — темно-синий с прозрачностью
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 dark:bg-blue-900/20 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-1 text-blue-800 dark:text-blue-300 font-semibold text-sm">
                                <FlaskConical size={16} />
                                <span>Раствор</span>
                            </div>
                            <p className="text-sm text-blue-900 dark:text-blue-100 pl-6">
                                {representative.drilling_solution_ops}
                            </p>
                        </div>
                    )}
                    {representative.drilling_rig_ops && (
                        // Серый блок: адаптирован под темный фон
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 dark:bg-gray-700/40 dark:border-gray-600">
                            <div className="flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                                <Activity size={16} />
                                <span>Буровая</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 pl-6">
                                {representative.drilling_rig_ops}
                            </p>
                        </div>
                    )}
                </div>
            )}
            
            {/* Таблица */}
            <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <CreditCard size={16} /> Расход по транзакциям
                </h4>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 dark:text-gray-500 flex justify-center items-center gap-2">
                            <span className="animate-spin">⏳</span> Загрузка...
                        </div>
                    ) : (
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-400">Реагент</th>
                                    <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-400">Кол-во</th>
                                    <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-400">Цена</th>
                                    <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-400">Сумма</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors">
                                        <td className="p-3 font-medium text-gray-800 dark:text-gray-200">
                                            {tx.chemical.name}
                                        </td>
                                        <td className="p-3 text-right font-mono text-gray-600 dark:text-gray-400">
                                            {tx.quantity}
                                        </td>
                                        <td className="p-3 text-right font-mono text-gray-500 dark:text-gray-500 text-xs">
                                            {parseFloat(tx.chemical.price).toLocaleString('ru-RU')}
                                        </td>
                                        <td className="p-3 text-right font-mono font-semibold text-gray-800 dark:text-gray-200">
                                            {(parseFloat(tx.quantity) * parseFloat(tx.chemical.price)).toLocaleString('ru-RU')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                <tr>
                                    <td colSpan="3" className="p-3 text-right text-gray-600 dark:text-gray-400">Итого:</td>
                                    <td className="p-3 text-right text-gray-900 dark:text-white font-mono text-base">
                                        {formatMoney(totalCost)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>

            {/* Кнопка действия */}
            <div className="pt-4 flex justify-end">
                <button 
                    onClick={() => onDelete(reportGroup.operation_uuid)} 
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800 px-4 py-2 rounded-lg font-medium transition-all text-sm shadow-sm"
                >
                    <Trash2 size={16} />
                    Удалить загрузку и списания
                </button>
            </div>
        </div>
    );
}

// Мини-компонент для инфо-карточек
const InfoCard = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="mt-0.5 opacity-80">{icon}</div>
        <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
                {label}
            </p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {value}
            </p>
        </div>
    </div>
);

export default DailyReportDetail;