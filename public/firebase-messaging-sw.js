// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
// Note: We're using query parameters to pass the config to avoid hardcoding here
const firebaseConfig = new URL(location).searchParams.get('config');

if (firebaseConfig) {
  try {
    firebase.initializeApp(JSON.parse(decodeURIComponent(firebaseConfig)));
    
    // Retrieve firebase messaging
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage(function(payload) {
      console.log('Received background message ', payload);
      
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/logo.png' // Update this to your actual app logo
      };
      
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (e) {
    console.error('Error initializing Firebase in service worker', e);
  }
}
