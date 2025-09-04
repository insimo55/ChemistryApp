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
            <h3 className="text-xl font-semibold mb-6 dark:text-gray-100">
                {isEditMode ? `Редактирование: ${user.username}` : 'Новый пользователь'}
            </h3>
            {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium dark:text-gray-100">Имя пользователя</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required disabled={isEditMode} className="mt-1 block w-full p-2 border rounded disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-100"/>
                </div>
                <div>
                    <label className="block text-sm font-medium dark:text-gray-100">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-100"/>
                </div>
                <div>
                    <label className="block text-sm font-medium dark:text-gray-100">Пароль</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!isEditMode} placeholder={isEditMode ? "Оставьте пустым, чтобы не менять" : ""} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-100"/>
                </div>
                <div>
                    <label className="block text-sm font-medium dark:text-gray-100">Роль</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-100">
                        <option value="admin">Администратор</option>
                        <option value="logistician">Логист</option>
                        <option value="engineer">Инженер</option>
                    </select>
                </div>
                {role === 'engineer' && (
                    <div>
                         <label className="block text-sm font-medium dark:text-gray-100">Закрепленный объект</label>
                         <select value={relatedFacilityId} onChange={e => setRelatedFacilityId(e.target.value)} required className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-100">
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
                            className="text-red-600 hover:text-red-700 hover:underline text-sm"
                        >
                            Удалить пользователя
                        </button>
                    )}
                </div>
            </div>
             <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-gray-200 py-2 px-4 rounded">Отмена</button>
                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded">
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

  if (loading) return <p>Загрузка...</p>;


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold dark:text-gray-100">Управление пользователями</h1>
            <button 
                onClick={() => openModal(null)} 
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
                + Добавить пользователя
            </button>
        </div>
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className='dark:bg-neutral-700 dark:text-gray-100'>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Пользователь</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Email</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Роль</th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase">Место работы</th>
              <th className="px-5 py-3 border-b-2"></th>
            </tr>
          </thead>
          <tbody>
              {users.map(user => (
                  <tr key={user.id} className='dark:bg-gray-700 dark:text-gray-100'>
                      <td className="px-5 py-5 border-b text-sm">{user.username}</td>
                      <td className="px-5 py-5 border-b text-sm">{user.email}</td>
                      <td className="px-5 py-5 border-b text-sm capitalize">{user.role}</td>
                      <td className="px-5 py-5 border-b"> {/* <-- НОВАЯ ЯЧЕЙКА */}
                                {/* Нам нужно получить имя объекта, но в UserSerializer у нас только ID. 
                                    Исправим это на бэкенде. А пока будет так: */}
                                {user.related_facility_name || '—'}
                            </td>
                      <td className="px-5 py-5 border-b text-sm text-right">
                        <button onClick={() => openModal(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-emerald-400 dark:hover:text-emerald-600">Редактировать</button>
                      </td>
                  </tr>
              ))}
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