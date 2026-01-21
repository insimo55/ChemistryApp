import React, { useState } from 'react';
// Импортируем компоненты вкладок
import FacilitiesAdminPage from '../components/FacilitiesAdminTab';
import ProjectsAdminTab from '../components/ProjectsAdminTab';
// Импортируем иконки
import { Building2, Briefcase, Settings } from 'lucide-react';

function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('facilities');

    // Конфигурация вкладок (так легче добавлять новые в будущем)
    const tabs = [
        { 
            id: 'facilities', 
            label: 'Объекты и Месторождения', 
            icon: <Building2 size={20} /> 
        },
        { 
            id: 'projects', 
            label: 'Проекты и Скважины', 
            icon: <Briefcase size={20} /> 
        },
        // Сюда легко добавить, например: { id: 'users', label: 'Пользователи', icon: <Users /> }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* --- ЗАГОЛОВОК СТРАНИЦЫ --- */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-600 rounded-lg shadow-lg text-white">
                    <Settings size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">Администрирование</h1>
                    <p className="text-gray-500 mt-1 dark:text-gray-400">Управление справочниками, проектами и настройками системы.</p>
                </div>
            </div>
            
            {/* --- НАВИГАЦИЯ (ТАБЫ) --- */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ease-in-out whitespace-nowrap
                                    ${isActive 
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-100 dark:text-gray-300'
                                    }
                                `}
                            >
                                <span className={`mr-2 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-200'}`}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
            
            {/* --- КОНТЕНТ ВКЛАДОК --- */}
            <div className="animate-fade-in"> 
                {/* animate-fade-in можно реализовать в CSS или просто убрать, если нет кастомных анимаций */}
                
                {activeTab === 'facilities' && (
                    <div className="transition-opacity duration-300">
                        <FacilitiesAdminPage />
                    </div>
                )}
                
                {activeTab === 'projects' && (
                    <div className="transition-opacity duration-300">
                        <ProjectsAdminTab />
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminSettingsPage;