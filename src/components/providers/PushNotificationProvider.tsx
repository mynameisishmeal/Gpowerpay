'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { NotificationPromptModal } from './NotificationPromptModal';

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [tokenSent, setTokenSent] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only process if user is authenticated
    if (status === 'authenticated') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPermission = Notification.permission;
        const dismissed = localStorage.getItem('notification_prompt_dismissed');

        // If granted but token not sent, fetch and send token silently
        if (currentPermission === 'granted' && !tokenSent) {
          fetchTokenSilently();
        } 
        // If default and hasn't been dismissed, show soft prompt after a short delay
        else if (currentPermission === 'default' && dismissed !== 'true') {
          const timer = setTimeout(() => setShowPrompt(true), 2500); // 2.5s delay
          return () => clearTimeout(timer);
        }
      }
    }
  }, [status, tokenSent]);

  const fetchTokenSilently = async () => {
    try {
      const token = await requestForToken();
      if (token) {
        await fetch('/api/user/fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        setTokenSent(true);
      }
    } catch (error) {
      console.error('Error handling FCM token:', error);
    }
  };

  const handleRequestPermission = async () => {
    setShowPrompt(false);
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'denied') {
        toast.error('Notifications blocked! You can enable them later in your browser settings.', {
          duration: 6000,
          icon: '🔕',
        });
        localStorage.setItem('notification_prompt_dismissed', 'true');
        return;
      }

      if (permission === 'granted') {
        toast.success('Notifications enabled! 🎉');
        await fetchTokenSilently();
      }
    } catch (error) {
      console.error('Error requesting permission', error);
    }
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_dismissed', 'true');
  };

  useEffect(() => {
    // Set up listener for foreground messages
    onMessageListener((payload: any) => {
      if (payload?.notification) {
        // 1. Show the little toast inside the website UI
        toast.success(`${payload.notification.title}: ${payload.notification.body}`, {
          duration: 5000,
          icon: '🔔',
        });

        // 2. FORCE a native Windows/Mac OS Desktop Notification even if the app is open
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification(payload.notification.title, {
                body: payload.notification.body,
                icon: '/icon.png',
              });
            });
          }
        }
      }
    });
  }, []);

  return (
    <>
      {children}
      {showPrompt && (
        <NotificationPromptModal 
          onEnable={handleRequestPermission} 
          onDismiss={handleDismissPrompt} 
        />
      )}
    </>
  );
}
