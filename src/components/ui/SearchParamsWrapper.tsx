'use client';

import { Suspense, ReactNode } from 'react';

interface SearchParamsWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SearchParamsWrapper({ children, fallback }: SearchParamsWrapperProps) {
  return (
    <Suspense fallback={fallback ?? <div className="p-4 text-center">Loading...</div>}>
      {children}
    </Suspense>
  );
}
