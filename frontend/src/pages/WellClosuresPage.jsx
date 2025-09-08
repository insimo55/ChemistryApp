// frontend/src/pages/WellClosuresPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api";

// Хелпер для стилизации статусов
const statusStyles = {
  open: {
    text: "Не закрыта",
    bg: "bg-yellow-100",
    text_color: "text-yellow-800",
  },
  partially_closed: {
    text: "Закрыта частично",
    bg: "bg-blue-100",
    text_color: "text-blue-800",
  },
  closed: { text: "Закрыта", bg: "bg-green-100", text_color: "text-green-800" },
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

  if (loading) return <p>Загрузка реестра...</p>;

  return (
    <div>
      {/* Заголовок + кнопка */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Реестр закрытых скважин</h1>
        <Link
          to="/well-closures/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors dark:hover:bg-blue-800"
        >
          + Добавить запись
        </Link>
      </div>

      {/* Фильтры */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end dark:bg-gray-800">
        <div>
          <label className="block text-sm">Номер куста</label>
          <input
            name="bush_number"
            value={filters.bush_number}
            onChange={handleFilterChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 "
          />
        </div>
        <div>
          <label className="block text-sm">Номер скважины</label>
          <input
            name="well_number"
            value={filters.well_number}
            onChange={handleFilterChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm">Статус</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700"
          >
            <option value="">Все</option>
            <option value="open">Не закрыта</option>
            <option value="partially_closed">Закрыта частично</option>
            <option value="closed">Закрыта</option>
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
        <button
          onClick={resetFilters}
          className="bg-gray-200 hover:bg-gray-300 p-2 rounded-md dark:bg-gray-700 dark:hover:bg-gray-400 transition-colors"
        >
          Сбросить
        </button>
      </div>

      {/* Таблица */}
      <div className="bg-white dark:bg-black shadow-md rounded-lg overflow-hidden transition-colors">
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-300 dark:bg-gray-700">
            <tr>
              <th className="px-5 py-3 text-left">Куст / Скважина</th>
              <th className="px-5 py-3 text-left">Период работ</th>
              <th className="px-5 py-3 text-center">Статус</th>
              <th className="px-5 py-3 text-left">Комментарий</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {closures.map((closure) => {
              const statusInfo = statusStyles[closure.status] || {};
              return (
                <tr
                  key={closure.id}
                  className="hover:bg-gray-50 cursor-pointer dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                  onClick={() => navigate(`/well-closures/${closure.id}`)}
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold">{closure.bush_number}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      {closure.well_number}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {new Date(closure.start_date).toLocaleDateString("ru-RU")} –{" "}
                    {new Date(closure.end_date).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text_color}`}
                    >
                      {statusInfo.text}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm truncate max-w-sm">
                    {closure.comment}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WellClosuresPage;
