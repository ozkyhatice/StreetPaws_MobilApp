import { db, auth } from '../config/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { User } from '../types/user';

export class UserService {
  private static instance: UserService;
  private readonly usersCollection = 'users';

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async createUser(userData: Partial<User>): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user!');
    
    const newUser: User = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || '',
      displayName: userData.displayName || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      badges: [],
      savedPets: [],
      favoriteLocations: [],
      ...userData
    };

    const userRef = doc(db, this.usersCollection, newUser.uid);
    await setDoc(userRef, newUser);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, this.usersCollection, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    const userRef = doc(db, this.usersCollection, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return null;
    return userDoc.data() as User;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!auth.currentUser) return null;
    return this.getUserById(auth.currentUser.uid);
  }

  async updateUserStats(userId: string, stats: Partial<User['stats']>): Promise<void> {
    const userRef = doc(db, this.usersCollection, userId);
    await updateDoc(userRef, {
      'stats': stats,
      updatedAt: new Date().toISOString()
    });
  }

  async updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): Promise<void> {
    const userRef = doc(db, this.usersCollection, userId);
    await updateDoc(userRef, {
      'preferences': preferences,
      updatedAt: new Date().toISOString()
    });
  }

  async addBadge(userId: string, badgeId: string): Promise<void> {
    const userRef = doc(db, this.usersCollection, userId);
    await updateDoc(userRef, {
      badges: arrayUnion(badgeId),
      updatedAt: new Date().toISOString()
    });
  }

  async savePet(userId: string, petId: string): Promise<void> {
    const userRef = doc(db, this.usersCollection, userId);
    await updateDoc(userRef, {
      savedPets: arrayUnion(petId),
      updatedAt: new Date().toISOString()
    });
  }

  async addFavoriteLocation(userId: string, locationId: string): Promise<void> {
    const userRef = doc(db, this.usersCollection, userId);
    await updateDoc(userRef, {
      favoriteLocations: arrayUnion(locationId),
      updatedAt: new Date().toISOString()
    });
  }
} 