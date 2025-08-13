// frontend/src/components/Modal.jsx
import React from 'react';

function Modal({ isOpen, onClose, children }) {

  if (!isOpen) {
    return null;
  }
  // e.stopPropagation() нужно, чтобы клик по самому окну не закрывал его
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose} // Закрытие по клику на фон
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative overflow-y-auto max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
        >
          × {/* Крестик */}
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;