import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
// import components for page's
import ManualEntryTab from '../components/ManualEntryTab';
import ReportUploadTab from '../components/ReportUploadTab';
import UploadsRegistryTab from '../components/UploadsRegistryTab';

function OperationsCenterPage() {
    const { user } = useAuthStore();
    
    // Определяем вкладку по умолчанию в зависимости от роли
    const getDefaultTab = () => {
        if (!user) return 'upload'; // На случай, если user еще не загрузился
        return (user.role === 'admin' || user.role === 'logistician') ? 'manual' : 'upload';
    };

    const [activeTab, setActiveTab] = useState(getDefaultTab());

    // Синхронизируем вкладку, если роль пользователя изменится
    useEffect(() => {
        setActiveTab(getDefaultTab());
    }, [user]);

    // Хелпер для стилизации кнопок вкладок
    const getTabClassName = (tabName) => {
        return `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === tabName
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
        }`;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold dark:text-white">Центр управления операциями</h1>

            {/* --- Переключатель вкладок --- */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {(user?.role === 'admin' || user?.role === 'logistician') && (
                        <button onClick={() => setActiveTab('manual')} className={getTabClassName('manual')}>
                            Ручная операция
                        </button>
                    )}
                    <button onClick={() => setActiveTab('upload')} className={getTabClassName('upload')}>
                        Загрузка рапорта
                    </button>
                    <button onClick={() => setActiveTab('registry')} className={getTabClassName('registry')}>
                        Реестр загрузок
                    </button>
                </nav>
            </div>

            {/* --- Содержимое вкладок --- */}
            <div className="mt-4">
                {activeTab === 'manual' && (user?.role === 'admin' || user?.role === 'logistician') && <ManualEntryTab />}
                {activeTab === 'upload' && <ReportUploadTab />}
                {activeTab === 'registry' && <UploadsRegistryTab />}
            </div>
        </div>
    );
}

export default OperationsCenterPage;