// frontend/src/components/Layout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const SidebarLink = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700 ${
        isActive ? 'bg-blue-700 text-white' : 'text-gray-200'
      }`
    }
  >
    {children}
  </NavLink>
);

function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="px-8 py-4 border-b border-gray-700">
          <img className='max-w-2' src="/sample-research.png" alt="header icon"/>
          <h1 className="text-2xl font-bold">Chem<span className="text-blue-400">Acc</span> </h1>
          <p className="text-sm text-gray-400">Система учета реагентов</p>
        </div>
        <nav className="flex-grow p-4">
          <SidebarLink to="/">Главная (Объекты)</SidebarLink>
          <SidebarLink to="/transactions">История операций</SidebarLink>
          <SidebarLink to="/new-operation">Провести операцию</SidebarLink>
           {/* Ролевые ссылки */}
          {(user?.role === 'admin' || user?.role === 'logistician') && (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-400 uppercase">
                Справочники
              </div>
              <SidebarLink to="/chemicals">Реагенты</SidebarLink>
              <SidebarLink to="/facilities-admin">Объекты (Админ)</SidebarLink> {/* Новый маршрут для администрирования объектов */}
            </>
          )}

          {user?.role === 'admin' && (
             <>
              <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-400 uppercase">
                Администрирование
              </div>
              <SidebarLink to="/users">Пользователи</SidebarLink>
            </>
          )}
        </nav>
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

      {/* Main Content */}
      <main className="flex-1 p-10 bg-gray-100">
        <Outlet /> {/* Здесь будут отображаться дочерние роуты */}
      </main>
    </div>
  );
}

export default Layout;