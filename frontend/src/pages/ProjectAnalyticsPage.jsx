import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import { useTheme } from '../context/ThemeProvider'; // Импорт для темной темы
import { Calendar, Zap, TrendingUp, TrendingDown, DollarSign, FileText, ChevronDown, Loader2, Building2, Search, Check } from 'lucide-react'; // Иконки

function ProjectAnalyticsPage() {
    const { theme } = useTheme();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Фильтры
    const [selectedProjects, setSelectedProjects] = useState([]); // Массив ID выбранных проектов
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activePeriod, setActivePeriod] = useState(null);
    
    // Справочник проектов
    const [projects, setProjects] = useState([]); // Полная информация о проектах
    const [searchQuery, setSearchQuery] = useState(''); // Поиск по проектам

    // Загрузка справочника проектов
    useEffect(() => {
        apiClient.get('/projects/').then(res => {
            const projectsData = (res.data.results || res.data).map(p => ({ 
                id: p.id, 
                name: p.name,
                facility_name: p.facility_name,
                start_date: p.start_date, 
                end_date: p.end_date,
                status: p.status
            }));
            setProjects(projectsData);
        });
    }, []);

    // --- useEffect ДЛЯ АВТО-ПОДСТАНОВКИ ДАТ ---
    useEffect(() => {
        // Если выбран ТОЛЬКО ОДИН проект и даты еще не заданы вручную...
        if (selectedProjects.length === 1) {
            const project = projects.find(p => p.id === selectedProjects[0]);
            if (project) {
                // ...то подставляем его даты в фильтры
                setStartDate(project.start_date || '');
                setEndDate(project.end_date || '');
            }
        }
    }, [selectedProjects, projects]);

    const setQuickPeriod = (period) => {
        const today = new Date();
        let start = new Date();
        const end = new Date();
        
        switch(period) {
            case 'today':
                break;
            case 'yesterday':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'week':
                start.setDate(today.getDate() - 6);
                break;
            case 'month':
                start.setMonth(today.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(today.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(today.getFullYear() - 1);
                break;
            default:
                return;
        }
        
        // Форматируем в YYYY-MM-DD
        setStartDate(start.toLocaleDateString('en-CA'));
        setEndDate(end.toLocaleDateString('en-CA'));
        setActivePeriod(period);
    };

    const handleGenerateReport = async () => {
        if (selectedProjects.length === 0 || !startDate || !endDate) {
            setError("Пожалуйста, выберите хотя бы один проект и укажите полный период.");
            return;
        }
        setLoading(true);
        setError('');
        setReportData(null);
        try {
            const params = new URLSearchParams();
            selectedProjects.forEach(id => params.append('project_ids[]', id));
            params.append('start_date', startDate);
            params.append('end_date', endDate);
            
            const response = await apiClient.get(`/reports/project-analytics/?${params.toString()}`);
            setReportData(response.data);
        } catch (err) {
            setError("Не удалось сформировать отчет.");
            console.error("Report generation failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const quickPeriods = [
        { id: 'today', label: 'Сегодня', icon: '📅' },
        { id: 'yesterday', label: 'Вчера', icon: '⏮️' },
        { id: 'week', label: 'Неделя', icon: '📆' },
        { id: 'month', label: 'Месяц', icon: '🗓️' },
        { id: 'quarter', label: 'Квартал', icon: '📊' },
        { id: 'year', label: 'Год', icon: '📈' },
    ];

    // Обработчик выбора проекта
    const toggleProject = (projectId) => {
        setSelectedProjects(prev => 
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    // Фильтрация проектов по поисковому запросу
    // const filteredProjects = projects.filter(project => {
    //     const searchLower = searchQuery.toLowerCase();
    //     return project.name.toLowerCase().includes(searchLower) ||
    //            project.facility_name.toLowerCase().includes(searchLower);
    // });

    const sortedProjects = [...projects].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return 0;
    });

    const filteredProjects = sortedProjects.filter(project => {
        const searchLower = searchQuery.toLowerCase();
        return project.name.toLowerCase().includes(searchLower) ||
            project.facility_name.toLowerCase().includes(searchLower);
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold dark:text-white">Аналитика по проектам</h1>
            </div>
            
            {/* --- ФИЛЬТРЫ --- */}
            {/* <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-semibold dark:text-white">1. Выберите период</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {quickPeriods.map(period => (
                        <button
                            key={period.id}
                            onClick={() => setQuickPeriod(period.id)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                                activePeriod === period.id
                                    ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white shadow-lg'
                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                        >
                            <div className="text-2xl mb-1">{period.icon}</div>
                            <div className="text-xs font-medium">{period.label}</div>
                        </button>
                    ))}
                </div>
            </div> */}

            {/* Блок выбора проектов */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-semibold dark:text-white">1. Выберите Проект (Скважину)</h2>
                    {selectedProjects.length > 0 && (
                        <span className="ml-auto bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                            Выбрано: {selectedProjects.length}
                        </span>
                    )}
                </div>
                
                {/* Поиск по проектам */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск по названию проекта или объекта..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                </div>

                {/* Карточки проектов */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2 mb-4">
                    {filteredProjects.length > 0 ? (
                        filteredProjects.map(project => {
                            const isSelected = selectedProjects.includes(project.id);
                            const isCompleted = project.status === 'completed';
                            return (
                                <button
                                    key={project.id}
                                    onClick={() => toggleProject(project.id)}
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            toggleProject(project.id);
                                        }
                                    }}
                                    aria-pressed={isSelected}
                                    title={isCompleted ? 'Проект завершён' : project.name}
                                    className={`relative p-4 rounded-lg border-2 text-left transition-all duration-200 transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400 ${isCompleted
                                        ? 'bg-gray-100 dark:bg-gray-800 opacity-60 border-gray-200 dark:border-gray-600'
                                        : isSelected
                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 shadow-md'
                                            : 'bg-white dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm'
                                    }`}
                                >
                                    {/* status badge */}
                                    {isCompleted ? (
                                        <span className="absolute top-3 right-12 text-xs px-2 py-0.5 rounded-full bg-gray-400 text-white">Завершён</span>
                                    ) : null}

                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Building2 className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                                                <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {project.name}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs bg-gray-100 dark:bg-gray-700/40 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full truncate">{project.facility_name}</span>
                                                {(project.start_date || project.end_date) && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{project.start_date ? new Date(project.start_date).toLocaleDateString('ru-RU') : ''}{project.start_date && project.end_date ? ' — ' : ''}{project.end_date ? new Date(project.end_date).toLocaleDateString('ru-RU') : ''}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500' : 'border-gray-300 dark:border-gray-500'}`}>
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Проекты не найдены</p>
                        </div>
                    )}
                </div>

                {/* Кнопка формирования отчета */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={handleGenerateReport} 
                        disabled={loading || selectedProjects.length === 0 || !startDate || !endDate}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-[0.98]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Формирование...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="h-5 w-5" />
                                <span>Сформировать отчет</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Блок выбора дат */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-semibold dark:text-white">2. Укажите период вручную</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Дата начала (с):
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => { setStartDate(e.target.value); setActivePeriod(null); }} 
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Дата окончания (по):
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => { setEndDate(e.target.value); setActivePeriod(null); }} 
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            />
                        </div>
                    </div>
                </div>
                {startDate && endDate && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                                Выбранный период: <strong>{new Date(startDate).toLocaleDateString('ru-RU')}</strong> - <strong>{new Date(endDate).toLocaleDateString('ru-RU')}</strong>
                            </span>
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <span className="text-red-500">⚠️</span>
                    <span>{error}</span>
                </div>
            )}
            {loading && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Загрузка отчета...</span>
                </div>
            )}

            {/* --- БЛОК РЕЗУЛЬТАТОВ --- */}
            {reportData && (
                <div className="space-y-8">
                    {/* Общая сводка */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 p-6 rounded-xl shadow-lg text-center text-white transform hover:scale-[1.01] transition-all duration-200">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h2 className="text-xl font-semibold">Общая стоимость фактического расхода за указанный период</h2>
                        </div>
                        <p className="text-4xl font-bold mt-2">
                            {parseFloat(reportData.grand_summary.total_fact_cost).toLocaleString('ru-RU')} ₽
                        </p>
                    </div>
                    {/* Цикл по каждому проекту */}
                    {reportData.report_by_project.map(projectReport => (
                        <div key={projectReport.project_id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <h2 className="text-2xl font-bold dark:text-white">{projectReport.project_name}</h2>
                            </div>
                            
                            {/* KPI по проекту */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Запланированная (стоимость)</div>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{parseFloat(projectReport.summary.total_planned_cost).toLocaleString('ru-RU')} ₽</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Фактические затраты (стоимость)</div>
                                    </div>
                                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{parseFloat(projectReport.summary.total_fact_cost_all_time || 0).toLocaleString('ru-RU')} ₽</div>
                                </div>
                                {(() => {
                                    // 1. Вычисляем отклонение
                                    const deviation = (parseFloat(projectReport.summary.total_fact_cost_all_time) || 0) - (parseFloat(projectReport.summary.total_planned_cost) || 0);
                                    
                                    // 2. Определяем, перерасход ли это
                                    const isOverspent = deviation > 0;

                                    // 3. Задаем переменные для UI
                                    const title = isOverspent ? "Перерасход" : "Остаток";
                                    const value = isOverspent ? deviation : -deviation;
                                    const bgFrom = isOverspent ? 'from-red-50' : 'from-green-50';
                                    const bgTo = isOverspent ? 'to-red-100' : 'to-green-100';
                                    const bgFromDark = isOverspent ? 'dark:from-red-900/30' : 'dark:from-green-900/30';
                                    const bgToDark = isOverspent ? 'dark:to-red-800/30' : 'dark:to-green-800/30';
                                    const borderColor = isOverspent ? 'border-red-200 dark:border-red-700' : 'border-green-200 dark:border-green-700';
                                    const iconColor = isOverspent ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
                                    const titleColor = isOverspent ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300';
                                    const valueColor = isOverspent ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100';

                                    return (
                                        <div className={`bg-gradient-to-br ${bgFrom} ${bgTo} ${bgFromDark} ${bgToDark} p-4 rounded-lg border ${borderColor} shadow-sm`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {isOverspent ? (
                                                    <TrendingUp className={`h-4 w-4 ${iconColor}`} />
                                                ) : (
                                                    <TrendingDown className={`h-4 w-4 ${iconColor}`} />
                                                )}
                                                <div className={`text-sm font-medium ${titleColor}`}>{title}</div>
                                            </div>
                                            <div className={`text-2xl font-bold ${valueColor}`}>
                                                {value.toLocaleString('ru-RU')} ₽
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            {/* --- ТАБЛИЦА ПЛАН/ФАКТ --- */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3 dark:text-white flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    Сводка по реагентам
                                </h3>
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Реагент</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">План (Всего)</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Факт (за Период)</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Факт (Всего)</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Отклонение (Общее)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                            {projectReport.plan_fact_table.map((item, index) => {
                                                const deviation = parseFloat(item.deviation) || 0;
                                                const isOverspent = deviation > 0;
                                                return (
                                                    <tr 
                                                        key={item.chemical_id}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                                                    >
                                                        <td className="px-4 py-3 font-medium dark:text-gray-200">{item.chemical_name} <span className="text-gray-500 dark:text-gray-400">({item.unit})</span></td>
                                                        <td className="px-4 py-3 text-right font-mono dark:text-gray-300">{parseFloat(item.planned_quantity).toLocaleString('ru-RU')}</td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold dark:text-white">{ (parseFloat(item.fact_period_quantity) || 0).toLocaleString('ru-RU')}</td>
                                                        <td className="px-4 py-3 text-right font-mono dark:text-gray-300">{ (parseFloat(item.fact_total_quantity) || 0).toLocaleString('ru-RU')}</td>
                                                        <td className={`px-4 py-3 text-right font-mono font-bold ${isOverspent ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                            {isOverspent ? (
                                                                <span className="flex items-center justify-end gap-1">
                                                                    <TrendingUp className="h-4 w-4" />
                                                                    Перерасход: {deviation.toLocaleString('ru-RU')}
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center justify-end gap-1">
                                                                    <TrendingDown className="h-4 w-4" />
                                                                    Остаток: {(-deviation).toLocaleString('ru-RU')}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {/* Детализация по дням (Аккордеон) */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 dark:text-white flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    Детализация по дням
                                </h3>
                                <div className="space-y-2">
                                    {/* `daily_details` - это объект { 'date1': data1, 'date2': data2 } */}
                                    {Object.entries(projectReport.daily_details).map(([date, dailyData]) => (
                                        <details 
                                            key={date} 
                                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-md transition-shadow duration-200 group"
                                        >
                                            <summary className="cursor-pointer p-4 flex justify-between items-center font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 list-none [&::-webkit-details-marker]:hidden">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <span>{new Date(date).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">{dailyData.items.length} поз.</span>
                                                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform duration-200" />
                                                </div>
                                            </summary>
                                            <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                                                {/* --- ОПИСАНИЯ РАБОТ --- */}
                                                <div className="mb-4 space-y-3">
                                                    {dailyData.drilling_solution_ops && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                Операции с БР:
                                                            </h4>
                                                            <p className="text-gray-800 dark:text-gray-200 text-sm">{dailyData.drilling_solution_ops}</p>
                                                        </div>
                                                    )}
                                                    {dailyData.drilling_rig_ops && (
                                                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                                            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                Операции на буровой:
                                                            </h4>
                                                            <p className="text-gray-800 dark:text-gray-200 text-sm">{dailyData.drilling_rig_ops}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {dailyData.items.length > 0 && (
                                                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <table className="min-w-full text-sm">
                                                            <thead className="bg-gray-100 dark:bg-gray-700">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Реагент</th>
                                                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Расход</th>
                                                                    <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">Стоимость</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                {dailyData.items.map((tx, index) => (
                                                                    <tr 
                                                                        key={index}
                                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                                                                    >
                                                                        <td className="px-3 py-2 dark:text-gray-200">{tx.chemical_name}</td>
                                                                        <td className="px-3 py-2 text-right font-mono dark:text-gray-300">{tx.quantity}</td>
                                                                        <td className="px-3 py-2 text-right font-mono font-semibold dark:text-gray-200">{(parseFloat(tx.cost) || 0).toLocaleString('ru-RU')} ₽</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                                                
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProjectAnalyticsPage;