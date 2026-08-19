import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let messagingInstance: any = null;

// Initialize Firebase Admin if it hasn't been initialized already
if (getApps().length === 0) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Fix private key formatting issues (common when pasting into .env)
      // Removes surrounding quotes and properly formats literal \n into real newlines
      privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully');
      messagingInstance = getMessaging();
    } else {
      console.warn('Firebase Admin skipped: Missing credentials in environment variables.');
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else {
  // If already initialized (e.g., hot reload), just grab the instance
  messagingInstance = getMessaging();
}

export const adminMessaging = messagingInstance;
