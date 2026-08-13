'use client';

import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#fff',
          color: '#1e293b',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              <button
                onClick={() => toast.dismiss(t.id)}
                className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
