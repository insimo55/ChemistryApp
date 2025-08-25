// Этот объект будет нашим "единым источником правды" для статусов
export const statusStyles = {
    draft: { text: 'Черновик', bg: 'bg-gray-200', text_color: 'text-gray-800' },
    submitted: { text: 'Подана', bg: 'bg-blue-200', text_color: 'text-blue-800' },
    reviewing: { text: 'На рассмотрении', bg: 'bg-yellow-200', text_color: 'text-yellow-800' },
    approved: { text: 'Утверждена', bg: 'bg-green-200', text_color: 'text-green-800' },
    in_progress: { text: 'В исполнении', bg: 'bg-indigo-200', text_color: 'text-indigo-800' },
    partially_completed: { text: 'Частично выполнена', bg: 'bg-purple-200', text_color: 'text-purple-800' },
    completed: { text: 'Выполнена', bg: 'bg-green-500', text_color: 'text-white' },
    cancelled: { text: 'Отменена', bg: 'bg-red-200', text_color: 'text-red-800' },
    overdue: { text: 'Просрочена', bg: 'bg-red-500', text_color: 'text-white' },
    default: { text: 'Неизвестно', bg: 'bg-gray-200', text_color: 'text-gray-800' },
};