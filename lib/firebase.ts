import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const requestForToken = async () => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase messaging not supported by this browser');
      return null;
    }

    const messaging = getMessaging(app);
    
    // Manually register the service worker so we can pass the config in the URL
    let registration: ServiceWorkerRegistration | undefined;
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const configStr = encodeURIComponent(JSON.stringify(firebaseConfig));
      registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${configStr}`);
    }

    const currentToken = await getToken(messaging, { 
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  isSupported().then(supported => {
    if (supported) {
      const messaging = getMessaging(app);
      onMessage(messaging, callback);
    }
  });
};

export default app;
