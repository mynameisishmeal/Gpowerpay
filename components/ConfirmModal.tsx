'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
      icon: 'text-red-600'
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: 'text-yellow-600'
    },
    info: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: 'text-blue-600'
    }
  };

  const colorScheme = colors[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`${colorScheme.bg} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
            <AlertTriangle className={`h-6 w-6 ${colorScheme.icon}`} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 ${colorScheme.button} text-white rounded-lg font-semibold transition-all`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmModalProps, 'isOpen' | 'onClose' | 'onConfirm'>>({
    title: '',
    message: ''
  });
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: Partial<Omit<ConfirmModalProps, 'isOpen' | 'onClose' | 'onConfirm' | 'title' | 'message'>>
  ) => {
    setConfig({ title, message, ...options });
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (onConfirmCallback) {
      onConfirmCallback();
    }
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const ConfirmModalComponent = () => (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...config}
    />
  );

  return { showConfirm, ConfirmModalComponent };
}
