'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string | null;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const startLoading = (message?: string) => {
    setLoadingMessage(message || null);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingMessage(null);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, startLoading, stopLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto transition-opacity duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-gray-700 font-medium text-center">
              {loadingMessage || 'Please wait...'}
            </p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
