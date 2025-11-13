// frontend/src/pages/UsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import Modal from '../components/Modal';
import  { API_BASE_URL } from '../api';

// --- Форма редактирования пользователя ---
// --- Форма редактирования пользователя ---
const UserForm = ({ user, onSuccess, onClose }) => {
    const isEditMode = !!user;

    const [role, setRole] = useState(user?.role || 'engineer');
    const [username, setUsername] = useState(user?.username || '');
    // Для related_facility нужно загружать список объектов
    const [facilities, setFacilities] = useState([]);
    const [relatedFacilityId, setRelatedFacilityId] = useState(user?.related_facility || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState(''); // Пароль всегда пустой
    const [error, setError] = useState('');

    useEffect(() => {
        if(role === 'engineer') {
            apiClient.get('/facilities/').then(res => setFacilities(res.data));
        }
    }, [role]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const payload = { username, email, role };
        // Добавляем пароль, только если он введен (или если это создание нового пользователя)
        if (password || !isEditMode) {
            payload.password = password;
        }
        // Добавляем объект, если роль - инженер
        if (role === 'engineer') {
            payload.related_facility = relatedFacilityId;
        } else {
            payload.related_facility = null;
        }

        try {
            if (isEditMode) {
                // PATCH-запрос для обновления
                await apiClient.patch(`/users/${user.id}/`, payload);
            } else {
                // POST-запрос для создания
                await apiClient.post('/users/', payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMessage = typeof errorData === 'object' ? JSON.stringify(errorData) : 'Ошибка сохранения.';
            setError(errorMessage);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Вы уверены, что хотите удалить пользователя ${user.username}? Это действие необратимо.`)) {
            try {
                await apiClient.delete(`/users/${user.id}/`);
                onSuccess();
                onClose();
            } catch (error) {
                setError('Не удалось удалить пользователя. Возможно, с ним связаны какие-то данные.');
                console.error("Delete user failed:", error);
            }
        }
    };
    
       return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-50">
                {isEditMode ? `Редактирование: ${user.username}` : 'Новый пользователь'}
            </h3>
            {error && <p className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 p-3 rounded mb-4 text-sm whitespace-pre-wrap">{error}</p>}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Имя пользователя</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        required 
                        disabled={isEditMode} 
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-700/80 dark:text-gray-100 dark:disabled:bg-gray-800/50 dark:disabled:text-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700/80 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Пароль</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required={!isEditMode} 
                        placeholder={isEditMode ? "Оставьте пустым, чтобы не менять" : ""} 
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700/80 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Роль</label>
                    <select 
                        value={role} 
                        onChange={e => setRole(e.target.value)} 
                        className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700/80 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    >
                        <option value="admin">Администратор</option>
                        <option value="logistician">Логист</option>
                        <option value="engineer">Инженер</option>
                    </select>
                </div>
                {role === 'engineer' && (
                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Закрепленный объект</label>
                         <select 
                            value={relatedFacilityId} 
                            onChange={e => setRelatedFacilityId(e.target.value)} 
                            required 
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-700/80 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        >
                            <option value="">Выберите объект...</option>
                            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                         </select>
                    </div>
                )}
                <div>
                    {isEditMode && (
                        <button 
                            type="button" 
                            onClick={handleDelete} 
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline text-sm font-medium transition-colors"
                        >
                            Удалить пользователя
                        </button>
                    )}
                </div>
            </div>
             <div className="mt-6 flex justify-end space-x-3">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md transition-colors font-medium border border-gray-300 dark:border-gray-600"
                >
                    Отмена
                </button>
                <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-2 px-4 rounded-md transition-colors font-medium shadow-md dark:shadow-blue-500/30"
                >
                    {isEditMode ? 'Сохранить' : 'Создать'}
                </button>
            </div>
        </form>
    );
};

// const UserCreateForm = ({ onSuccess, onClose }) => {
//     const [username, setUsername] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [rePassword, setRePassword] = useState('');
//     const [error, setError] = useState('');

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');

//         // Дополнительная проверка на стороне клиента
//         if (password !== rePassword) {
//             setError('Пароли не совпадают.');
//             return;
//         }

//         try {
//             // Отправляем оба поля на бэкенд
//             await apiClient.post(`${API_BASE_URL}/auth/users/`, { 
//                 username, 
//                 email, 
//                 password, 
//                 re_password: rePassword // <-- djoser ожидает поле с таким именем
//             });
//             onSuccess();
//             onClose();
//         } catch (err) {
//             const errorData = err.response?.data;
//             const errorMessage = typeof errorData === 'object' ? JSON.stringify(errorData) : 'Ошибка создания.';
//             setError(errorMessage);
//         }
//     };

//     return (
//         <form onSubmit={handleSubmit}>
//             <h3 className="text-xl font-semibold mb-6">Новый пользователь</h3>
//             {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}
//             <div className="space-y-4">
//                 <div>
//                     <label className="block text-sm font-medium">Имя пользователя</label>
//                     <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
//                 </div>
//                  <div>
//                     <label className="block text-sm font-medium">Email</label>
//                     <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
//                 </div>
//                  <div>
//                     <label className="block text-sm font-medium">Пароль</label>
//                     <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
//                 </div>
//                 <div>
//                     <label className="block text-sm font-medium">Повторите пароль</label>
//                     <input type="password" value={rePassword} onChange={e => setRePassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
//                 </div>
//             </div>
//             <div className="mt-6 flex justify-end space-x-3">
//                 <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300">Отмена</button>
//                 <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Создать</button>
//             </div>
//         </form>
//     );
// };
// --- Сама страница ---
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // null для создания, объект для редактирования
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
        setLoading(true);
        const response = await apiClient.get('/users/');
        setUsers(response.data);
    } finally {
        setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchUsers() }, [fetchUsers]);

  const openModal = (user = null) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSuccess = () => {
    closeModal();
    fetchUsers();
  };

  if (loading) return <p className="text-gray-900 dark:text-gray-100">Загрузка...</p>;


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-50">Управление пользователями</h1>
            <button 
                onClick={() => openModal(null)} 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-2 px-4 rounded-md transition-colors font-medium shadow-sm"
            >
                + Добавить пользователя
            </button>
        </div>
      <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className='bg-gray-50 dark:bg-gray-700/50'>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Пользователь</th>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Роль</th>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Место работы</th>
              <th className="px-5 py-3 border-b border-gray-200 dark:border-gray-600 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{user.username}</td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                      <td className="px-5 py-4 text-sm capitalize">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {user.related_facility_name || <span className="text-gray-400 dark:text-gray-500">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-right">
                        <button 
                          onClick={() => openModal(user)} 
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                          Редактировать
                        </button>
                      </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <UserForm user={currentUser} onSuccess={handleSuccess} onClose={closeModal} />
      </Modal>
    </div>
  );
}
export default UsersPage;