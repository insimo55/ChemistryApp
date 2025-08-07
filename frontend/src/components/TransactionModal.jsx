// frontend/src/components/TransactionModal.jsx
import React from 'react';
// Пока это будет просто обертка. Саму форму мы сделаем отдельно.

function TransactionModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    // "Overlay" - затемненный фон
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      {/* Сам контейнер модального окна */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
        >
          × {/* Это крестик */}
        </button>
        {children}
      </div>
    </div>
  );
}

export default TransactionModal;