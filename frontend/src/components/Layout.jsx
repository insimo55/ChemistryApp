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
      `block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 ${
        isActive ? "bg-blue-700 text-white" : "text-gray-200"
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
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 text-white flex items-center justify-between px-4 z-40">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Chem<span className="text-blue-400">Acc</span></h1>
        <ThemeToggle />
      </header>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-800 text-white flex flex-col z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="px-8 py-4 border-b border-gray-700 flex items-center gap-4">
          <a href="/">
            <img className="w-8 h-8" src="/sample-research.png" alt="header icon" />
          </a>
          <div>
            <h1 className="text-2xl font-bold">
              Chem<span className="text-blue-400">Acc</span>
            </h1>
            <p className="text-sm text-gray-400">Система учета реагентов</p>
          </div>
          {/* Кнопка закрытия (только мобилка) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-grow p-4 overflow-y-auto">
          <SidebarLink to="/">Главная (Объекты)</SidebarLink>
          <SidebarLink to="/transactions">История операций</SidebarLink>
          <SidebarLink to="/new-operation">Провести операцию</SidebarLink>

          {(user?.role === "admin" || user?.role === "logistician") && (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-400 uppercase">Отчеты</div>
              <SidebarLink to="/reports/consumption">Сводный расход</SidebarLink>
              <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-400 uppercase">
                Справочники
              </div>
              <SidebarLink to="/requisitions">Заявки</SidebarLink>
              <SidebarLink to="/chemicals">Реагенты</SidebarLink>
              <SidebarLink to="/facilities-admin">Объекты (Админ)</SidebarLink>
              <SidebarLink to="/well-closures">Закрытие скважин</SidebarLink>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-400 uppercase">
                Администрирование
              </div>
              <SidebarLink to="/users">Пользователи</SidebarLink>
            </>
          )}
        </nav>
        <ThemeToggle />
        <div className="p-4 border-t border-gray-700">
          <p className="font-semibold">{user?.username}</p>
          <p className="text-sm text-gray-400 capitalize">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Overlay (мобильный фон) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-10 bg-gray-100 dark:bg-neutral-950 md:ml-64 mt-14 md:mt-0 transition-colors duration-300">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
