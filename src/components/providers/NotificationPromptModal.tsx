'use client';

import { useState, useEffect } from 'react';
import { BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationPromptModalProps {
  onEnable: () => void;
  onDismiss: () => void;
}

export function NotificationPromptModal({ onEnable, onDismiss }: NotificationPromptModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 md:w-[400px] animate-in slide-in-from-bottom-8 fade-in duration-500">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-2xl rounded-2xl p-6 relative overflow-hidden ring-1 ring-black/5">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <button 
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1 bg-gray-50/50 rounded-full"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-5">
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3.5 rounded-2xl shrink-0 text-blue-600 shadow-sm border border-blue-100/50">
            <BellRing size={26} className="animate-pulse origin-top" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg tracking-tight mb-1">Never miss an update</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Get real-time alerts when your order ships, when a rider is assigned, and when your delivery arrives!
            </p>
            <div className="flex items-center gap-3">
              <Button 
                onClick={onEnable}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 shadow-sm shadow-blue-200"
              >
                Enable
              </Button>
              <button 
                onClick={onDismiss}
                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-3 py-2 rounded-md hover:bg-gray-100/50"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
