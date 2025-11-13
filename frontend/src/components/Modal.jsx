// frontend/src/components/Modal.jsx
import React from 'react';

function Modal({ isOpen, onClose, children }) {

  if (!isOpen) {
    return null;
  }
  // e.stopPropagation() нужно, чтобы клик по самому окну не закрывал его
  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex justify-center items-center backdrop-blur-sm p-4"
      onClick={onClose} // Закрытие по клику на фон
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg relative overflow-y-auto max-h-[85vh] border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Закрыть"
        >
          × {/* Крестик */}
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;