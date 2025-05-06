import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Try to load environment variables, use fallbacks if not available
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA2vbSS9xfJwQYXgwhjPuyDkUsFMO4x0qs",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "streetpaws-59fd2.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://streetpaws-59fd2-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "streetpaws-59fd2",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "streetpaws-59fd2.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "323026935381",
  appId: process.env.FIREBASE_APP_ID || "1:323026935381:web:ca6a427510bfbeb12d3edc",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-CGGKWY6TYW"
};

// Delete any existing Firebase apps
getApps().forEach(app => {
    deleteApp(app);
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 