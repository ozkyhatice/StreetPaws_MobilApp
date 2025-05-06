import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA2vbSS9xfJwQYXgwhjPuyDkUsFMO4x0qs",
    authDomain: "streetpaws-59fd2.firebaseapp.com",
    databaseURL: "https://streetpaws-59fd2-default-rtdb.firebaseio.com",
    projectId: "streetpaws-59fd2",
    storageBucket: "streetpaws-59fd2.firebasestorage.app",
    messagingSenderId: "323026935381",
    appId: "1:323026935381:web:ca6a427510bfbeb12d3edc",
    measurementId: "G-CGGKWY6TYW"
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