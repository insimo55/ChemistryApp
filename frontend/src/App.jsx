// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';

// --- Компоненты ---
import Layout from './components/Layout';

// --- Страницы ---
import LoginPage from './pages/Login';
import DashboardPage from './pages/DashboardPage'; // Теперь это страница со списком объектов
import FacilityDetailPage from './pages/FacilityDetailPage'; // Новая страница для детализации
import TransactionsPage from './pages/TransactionsPage'; // Полноценная страница истории
import ChemicalsPage from './pages/ChemicalsPage';
import FacilitiesAdminPage from './components/FacilitiesAdminTab'; // Предполагаем, что вы создали этот файл
import UsersPage from './pages/UsersPage';

import NewOperationPage from './components/ManualEntryTab';
import OperationsCenterPage from './pages/OperationsCenterPage';

import RequisitionsPage from './pages/RequisitionsPage';
import RequisitionFormPage from './pages/RequisitionFormPage'; 
import WellClosuresPage from './pages/WellClosuresPage'; 
import WellClosureFormPage from './pages/WellClosureFormPage';
import ConsumptionReportPage from './pages/ConsumptionReportPage';

import ReportUploadsPage from './pages/ReportUploadsPage';
import ProjectAnalyticsPage from './pages/ProjectAnalyticsPage'; 

import AdminSettingsPage from './pages/AdminSettingsPage';

// Заглушка для страницы управления пользователями (пока не создали)

// --- Компоненты-обертки для защиты роутов ---

/**
 * Проверяет, аутентифицирован ли пользователь.
 * Если нет, перенаправляет на страницу логина.
 */
function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

/**
 * Проверяет, является ли пользователь администратором.
 * Если нет, перенаправляет на главную страницу.
 */
function AdminRoute({ children }) {
    const user = useAuthStore((state) => state.user);
    // Проверяем, что пользователь аутентифицирован и его роль - 'admin'
    if (useAuthStore.getState().isAuthenticated && user?.role === 'admin') {
        return children;
    }
    // В противном случае, перенаправляем на главную
    return <Navigate to="/" />;
}


// --- Главный компонент приложения ---

function App() {
  return (
    <Router>
      <Routes>
        {/* Публичный роут: страница входа */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Группа защищенных роутов, которые используют общий Layout */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
           
          <Route path="operations" element={<OperationsCenterPage />} />
          <Route path="operation/edit/:uuid" element={<NewOperationPage />} />
          
          {/* Дочерние роуты, которые будут отображаться внутри <Outlet /> в Layout */}

          {/* Главная страница (по умолчанию) - теперь это список объектов */}
          <Route index element={<DashboardPage />} />
          
          {/* Страница с детальной информацией по конкретному объекту */}
          <Route path="facilities/:id" element={<FacilityDetailPage />} />
          
          {/* Страница с историей всех транзакций */}
          <Route path="transactions" element={<TransactionsPage />} />
          {/* Страница с регистром заявок */}
          <Route path="requisitions" element={<RequisitionsPage />} />
          <Route path="requisitions/new" element={<RequisitionFormPage />} /> {/* <-- ДЛЯ СОЗДАНИЯ */}
          <Route path="requisitions/:id" element={<RequisitionFormPage />} /> {/* <-- ДЛЯ РЕДАКТИРОВАНИЯ */}
          {/* Роуты для админов и логистов. Можно обернуть их в общий защитный роут, если нужно. */}
          <Route path="reports/consumption" element={<PrivateRoute><ConsumptionReportPage /></PrivateRoute>} />
          <Route path="chemicals" element={<ChemicalsPage />} />
          <Route path="admin-settings" element={<AdminSettingsPage  />} />
          <Route 
            path="well-closures" 
            element={<AdminRoute><WellClosuresPage /></AdminRoute>} 
          />
          <Route path="well-closures/new" element={<AdminRoute><WellClosureFormPage /></AdminRoute>} /> {/* <-- ДЛЯ СОЗДАНИЯ */}
          <Route path="well-closures/:id" element={<AdminRoute><WellClosureFormPage /></AdminRoute>} /> {/* <-- ДЛЯ РЕДАКТИРОВАНИЯ */}
          <Route 
            path="report-uploads" 
            element={<AdminRoute><ReportUploadsPage /></AdminRoute>} 
          />
          <Route path="project-analytics" element={<ProjectAnalyticsPage />} />
          <Route path="users" 
              element={
                  <AdminRoute>
                      <UsersPage />
                  </AdminRoute>
              } 
            />
          </Route>
        
        {/* Роут для обработки всех ненайденных страниц */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold">404 - Страница не найдена</h1>
            <p className="mt-4">Извините, мы не смогли найти то, что вы искали.</p>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;