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

  const handleRequestPermission = async () => {
    setShowPrompt(false);
    try {
      // 1. Check if Notification API exists in this environment
      if (typeof window === 'undefined' || !('Notification' in window)) {
        toast.error('Push notifications are not supported by this browser/device.', {
          icon: 'ℹ️',
          duration: 5000,
        });
        localStorage.setItem('notification_prompt_dismissed', 'true');
        return;
      }

      // 2. Check if the context is secure (HTTPS or localhost)
      if (window.isSecureContext === false) {
        toast.error('Notifications require HTTPS or a secure connection.', {
          icon: '🔒',
          duration: 5000,
        });
        return;
      }

      // 3. If already permanently denied by user in browser settings
      if (Notification.permission === 'denied') {
        toast.error(
          'Notifications are currently blocked in your browser settings. To enable, tap the site settings / lock icon in your URL bar and change Notifications to Allow.',
          {
            duration: 8000,
            icon: '🔕',
          }
        );
        localStorage.setItem('notification_prompt_dismissed', 'true');
        return;
      }

      // 4. Request native browser permission (supporting both Promise and legacy callback APIs)
      let permission: NotificationPermission = 'default';
      try {
        const res = Notification.requestPermission();
        if (res && typeof (res as any).then === 'function') {
          permission = await res;
        } else {
          // Callback-based API
          permission = await new Promise<NotificationPermission>((resolve) => {
            Notification.requestPermission((p) => resolve(p));
          });
        }
      } catch (reqError) {
        console.warn('Promise requestPermission failed, trying callback syntax:', reqError);
        permission = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission((p) => resolve(p));
        });
      }

      if (permission === 'denied') {
        toast.error('Notifications were not allowed. You can enable them later in browser settings.', {
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
      console.error('Error requesting notification permission:', error);
      toast.error('Could not request notification permission.');
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
