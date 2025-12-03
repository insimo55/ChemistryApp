// frontend/src/pages/WellClosuresPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api";

// Хелпер для стилизации статусов
const statusStyles = {
  open: {
    text: "Не закрыта",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text_color: "text-yellow-800 dark:text-yellow-300",
  },
  partially_closed: {
    text: "Закрыта частично",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text_color: "text-blue-800 dark:text-blue-300",
  },
  closed: { 
    text: "Закрыта", 
    bg: "bg-green-100 dark:bg-green-900/30", 
    text_color: "text-green-800 dark:text-green-300" 
  },
};

function WellClosuresPage() {
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- СОСТОЯНИЯ ДЛЯ ФИЛЬТРОВ ---
  const [filters, setFilters] = useState({
    status: "",
    bush_number: "",
    well_number: "",
    start_date: "",
    end_date: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // --- ОБНОВЛЯЕМ ЛОГИКУ ЗАГРУЗКИ ---
  const fetchClosures = useCallback(() => {
    setLoading(true);
    // Используем `debouncedFilters` для запроса
    const params = new URLSearchParams(debouncedFilters);

    apiClient
      .get(`/well-closures/?${params.toString()}`)
      .then((res) => setClosures(res.data.results || res.data))
      .catch((err) => console.error("Failed to fetch well closures", err))
      .finally(() => setLoading(false));
  }, [debouncedFilters]); // Зависимость от `debouncedFilters`

  // --- НОВЫЙ useEffect ДЛЯ РЕАЛИЗАЦИИ DEBOUNCE ---
  useEffect(() => {
    // Устанавливаем таймер на 500 мс
    const timer = setTimeout(() => {
      setDebouncedFilters(filters); // Обновляем "отложенные" фильтры
    }, 500); // Задержка в полсекунды

    // Функция очистки: сбрасывает таймер, если пользователь продолжает печатать
    return () => {
      clearTimeout(timer);
    };
  }, [filters]); // Этот эффект "слушает" мгновенные изменения `filters`

  useEffect(() => {
    fetchClosures();
  }, [fetchClosures]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      bush_number: "",
      well_number: "",
      start_date: "",
      end_date: "",
    });
  };

  if (loading) return <p className="text-center p-10 text-gray-900 dark:text-gray-100">Загрузка реестра...</p>;

  return (
    <div>
      {/* Заголовок + кнопка */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-50">Реестр закрытых скважин</h1>
        <Link
          to="/well-closures/new"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
        >
          + Добавить запись
        </Link>
      </div>

      {/* Фильтры */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Номер куста</label>
          <input
            name="bush_number"
            value={filters.bush_number}
            onChange={handleFilterChange}
            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
            placeholder="Введите номер"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Номер скважины</label>
          <input
            name="well_number"
            value={filters.well_number}
            onChange={handleFilterChange}
            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
            placeholder="Введите номер"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Статус</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
          >
            <option value="">Все</option>
            <option value="open">Не закрыта</option>
            <option value="partially_closed">Закрыта частично</option>
            <option value="closed">Закрыта</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">С даты</label>
          <input
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={handleFilterChange}
            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">По дату</label>
          <input
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={handleFilterChange}
            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>
        <button
          onClick={resetFilters}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors border border-gray-300 dark:border-gray-600"
        >
          Сбросить
        </button>
      </div>

      {/* Таблица */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Куст / Скважина</th>
                <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Период работ</th>
                <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Статус</th>
                <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Комментарий</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {closures.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-10 text-gray-500 dark:text-gray-400">
                    Записи не найдены
                  </td>
                </tr>
              ) : (
                closures.map((closure) => {
                  const statusInfo = statusStyles[closure.status] || {};
                  return (
                    <tr
                      key={closure.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors bg-white dark:bg-gray-800"
                      onClick={() => navigate(`/well-closures/${closure.id}`)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Куст: {closure.bush_number}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Скважина: {closure.well_number}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(closure.start_date).toLocaleDateString("ru-RU")} –{" "}
                        {new Date(closure.end_date).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text_color}`}
                        >
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 truncate max-w-sm">
                        {closure.comment || <span className="text-gray-400 dark:text-gray-500 italic">Нет комментария</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WellClosuresPage;
