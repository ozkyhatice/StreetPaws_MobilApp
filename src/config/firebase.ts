import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} from '@env';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  limit
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
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

// Firestore koleksiyonlarını ve field yapılarını tanımla
export const initializeDatabase = async () => {
  try {
    console.log('Veritabanı yapısı kontrol ediliyor...');
    
    // Koleksiyon referansları
    const collectionsToInitialize = [
      'users',
      'tasks',
      'taskVerifications',
      'badges',
      'xpActivities',
      'communities',
      'messages',
      'conversations'
    ];
    
    // Her koleksiyon için
    for (const collectionName of collectionsToInitialize) {
      const collectionRef = collection(db, collectionName);
      
      // Koleksiyonda doküman var mı kontrol et
      const querySnapshot = await getDocs(query(collectionRef, limit(1)));
      
      if (querySnapshot.empty) {
        console.log(`${collectionName} koleksiyonu boş, şablon doküman ekleniyor...`);
        
        // Koleksiyona göre şablon doküman oluştur
        let templateDoc = {};
        
        if (collectionName === 'users') {
          templateDoc = {
            uid: 'template',
            email: 'template@example.com',
            displayName: 'Template User',
            firstName: 'Template',
            lastName: 'User',
            username: 'templateuser',
            photoURL: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerified: false,
            role: 'user',
            preferences: {
              notifications: true,
              emailUpdates: true,
              darkMode: false,
            },
            stats: {
              tasksCompleted: 0,
              volunteeredHours: 0,
              donationsCount: 0,
              totalDonationAmount: 0,
              xpPoints: 0,
              level: 1,
            },
            xp: 0,
            completedTasks: [],
            volunteerHours: 0,
            badges: [],
            activeTask: null,
            savedPets: [],
            favoriteLocations: []
          };
        } else if (collectionName === 'tasks') {
          templateDoc = {
            id: 'template',
            title: 'Template Task',
            description: 'Template task description',
            status: 'OPEN',
            category: 'OTHER',
            location: {
              latitude: 0,
              longitude: 0,
              address: 'Template Address'
            },
            deadline: new Date().toISOString(),
            xpReward: 100,
            assignedTo: null,
            images: [],
            verifications: []
          };
        } else if (collectionName === 'taskVerifications') {
          templateDoc = {
            id: 'template',
            taskId: 'template',
            userId: 'template',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            imageUrl: '',
            note: '',
            location: {
              latitude: 0,
              longitude: 0
            },
            reviewerId: null,
            reviewNote: null
          };
        } else if (collectionName === 'badges') {
          templateDoc = {
            id: 'template',
            name: 'Template Badge',
            description: 'Template badge description',
            icon: 'star',
            criteria: {
              type: 'TASK_COMPLETION',
              count: 1
            }
          };
        } else if (collectionName === 'xpActivities') {
          templateDoc = {
            id: 'template',
            userId: 'template',
            title: 'Template Activity',
            description: 'Template activity description',
            xpAmount: 100,
            type: 'TASK_COMPLETION',
            timestamp: Date.now()
          };
        } else if (collectionName === 'communities') {
          templateDoc = {
            id: 'template',
            name: 'Örnek Topluluk',
            description: 'Örnek topluluk açıklaması',
            category: 'ANIMAL_RESCUE',
            createdAt: new Date(),
            createdBy: 'template',
            members: ['template'],
            membersCount: 1,
            admins: ['template'],
            isPublic: true,
            tags: ['örnek', 'topluluk']
          };
        } else if (collectionName === 'messages') {
          templateDoc = {
            id: 'template',
            senderId: 'template',
            recipientId: 'template',
            content: 'Örnek mesaj içeriği',
            createdAt: new Date(),
            isRead: false,
            type: 'DIRECT'
          };
        } else if (collectionName === 'conversations') {
          templateDoc = {
            id: 'template',
            participants: ['template1', 'template2'],
            lastMessage: {
              content: 'Örnek son mesaj',
              senderId: 'template1',
              createdAt: new Date()
            },
            unreadCount: {
              template1: 0,
              template2: 1
            }
          };
        }
        
        // Şablon dokümanı ekle
        const templateDocRef = doc(collectionRef, 'template');
        await setDoc(templateDocRef, templateDoc);
        console.log(`${collectionName} şablon dokümanı oluşturuldu`);
        
        // Şablonu temizle (isteğe bağlı)
        // await deleteDoc(templateDocRef);
      } else {
        console.log(`${collectionName} koleksiyonu zaten mevcut`);
      }
    }
    
    console.log('Veritabanı yapısı doğrulandı');
    return true;
  } catch (error) {
    console.error('Veritabanı yapısını oluştururken hata:', error);
    return false;
  }
};

export { app, auth, db, storage }; 