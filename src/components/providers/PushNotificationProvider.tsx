'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import toast from 'react-hot-toast';

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [tokenSent, setTokenSent] = useState(false);

  useEffect(() => {
    // Only request token if user is authenticated
    if (status === 'authenticated' && !tokenSent) {
      const fetchToken = async () => {
        try {
          const token = await requestForToken();
          if (token) {
            // Send token to our backend
            await fetch('/api/user/fcm-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token }),
            });
            setTokenSent(true);
          }
        } catch (error) {
          console.error('Error fetching FCM token:', error);
        }
      };

      fetchToken();
    }
  }, [status, tokenSent]);

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

  return <>{children}</>;
}
