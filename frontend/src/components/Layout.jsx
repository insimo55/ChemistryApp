// frontend/src/components/Layout.jsx
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import ThemeToggle from "./ThemeToggle";
import { Menu, X } from "lucide-react";

const SidebarLink = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block py-2.5 px-4 rounded transition-all duration-200 ${
        isActive
          ? "bg-blue-600 dark:bg-blue-700 text-white font-medium shadow-sm"
          : "text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700/50"
      }`
    }
  >
    {children}
  </NavLink>
);

function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Мобильный header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white flex items-center justify-between px-4 z-40 shadow-sm">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Chem<span className="text-blue-500 dark:text-blue-400">Acc</span></h1>
        <ThemeToggle />
      </header>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex flex-col z-50
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          shadow-lg dark:shadow-gray-900/50
        `}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <a href="/" className="flex-shrink-0">
            <img className="w-8 h-8" src="/sample-research.png" alt="header icon" />
          </a>
          <div className="flex-grow min-w-0">
            <h1 className="text-xl font-bold truncate">
              Chem<span className="text-blue-500 dark:text-blue-400">Acc</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Система учета реагентов</p>
          </div>
          {/* Кнопка закрытия (только мобилка) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-grow p-4 overflow-y-auto">
          <SidebarLink to="/">Главная (Объекты)</SidebarLink>
          <SidebarLink to="/transactions">История операций</SidebarLink>
          {/* <SidebarLink to="/new-operation">Провести операцию</SidebarLink> */}
          {/* <SidebarLink to="/daily-reports">Суточные рапорты</SidebarLink> */}
          <SidebarLink to="/operations">Операции</SidebarLink>
          {(user?.role === "admin" || user?.role === "logistician") && (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Аналитика и отчеты</div>
              <SidebarLink to="/project-analytics">Аналитика по проектам</SidebarLink>
              <SidebarLink to="/reports/consumption">Сводный расход</SidebarLink>
              <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Справочники
              </div>
              <SidebarLink to="/requisitions">Заявки</SidebarLink>
              <SidebarLink to="/chemicals">Реагенты</SidebarLink>
              <SidebarLink to="/admin-settings">Объекты (Админ)</SidebarLink>
              <SidebarLink to="/well-closures">Закрытие скважин</SidebarLink>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Администрирование
              </div>
              <SidebarLink to="/users">Пользователи</SidebarLink>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{user?.role}</p>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Overlay (мобильный фон) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 bg-gray-50 dark:bg-gray-900 md:ml-64 mt-14 md:mt-0 transition-colors duration-300 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
