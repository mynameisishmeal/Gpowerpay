'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    message: '',
    type: 'info',
    confirmText: 'OK',
    showCancel: false,
  });
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions({
      type: 'info',
      confirmText: 'OK',
      showCancel: false,
      ...options,
    });
    setOpen(true);
  }, []);

  const showConfirm = useCallback((options: AlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlertOptions({
        type: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        showCancel: true,
        ...options,
      });
      setResolver(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleConfirm = async () => {
    if (alertOptions.onConfirm) {
      await alertOptions.onConfirm();
    }
    if (resolver) {
      resolver(true);
      setResolver(null);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    if (alertOptions.onCancel) {
      alertOptions.onCancel();
    }
    if (resolver) {
      resolver(false);
      setResolver(null);
    }
    setOpen(false);
  };

  const getIcon = () => {
    switch (alertOptions.type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getTitle = () => {
    if (alertOptions.title) return alertOptions.title;
    
    switch (alertOptions.type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Information';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {getIcon()}
              <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-gray-700">
              {alertOptions.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertOptions.showCancel && (
              <AlertDialogCancel onClick={handleCancel}>
                {alertOptions.cancelText || 'Cancel'}
              </AlertDialogCancel>
            )}
            <AlertDialogAction onClick={handleConfirm}>
              {alertOptions.confirmText || 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}
