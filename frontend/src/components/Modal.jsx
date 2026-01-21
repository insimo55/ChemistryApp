// frontend/src/components/Modal.jsx
import React from 'react';

// Добавили проп maxWidth со значением по умолчанию 'max-w-lg'
function Modal({ isOpen, onClose, children, maxWidth = 'max-w-lg',maxHeigth, overflow }) {

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex justify-center items-center backdrop-blur-sm p-4 overflow-y-auto" // overflow-y-auto здесь важно для мобильных
      onClick={onClose}
    >
      {/* Используем переданный maxWidth. Убрали overflow-y-auto отсюда, чтобы скроллилась вся страница модалки, если контент длинный */}
      <div 
        className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full ${maxWidth} ${overflow} ${maxHeigth} relative transition-all border border-gray-200 dark:border-gray-700`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
          aria-label="Закрыть"
        >
            {/* Чуть более аккуратный крестик SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;