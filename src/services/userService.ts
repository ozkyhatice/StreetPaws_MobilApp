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
    
    const newUser: Partial<User> = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || '',
      displayName: userData.displayName || '',
      firstName: userData.firstName || userData.displayName?.split(' ')[0] || '',
      lastName: userData.lastName || userData.displayName?.split(' ')[1] || '',
      username: userData.username || auth.currentUser.email?.split('@')[0] || '',
      phoneNumber: userData.phoneNumber || '',
      photoURL: auth.currentUser.photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: userData.emailVerified || false,
      role: userData.role || 'user',
      preferences: {
        notifications: true,
        emailUpdates: true,
        darkMode: false,
        ...(userData.preferences || {})
      },
      stats: {
        tasksCompleted: 0,
        volunteeredHours: 0,
        donationsCount: 0,
        totalDonationAmount: 0,
        xpPoints: 0,
        level: 1,
        ...(userData.stats || {})
      },
      xp: userData.xp || 0,
      completedTasks: userData.completedTasks || [],
      volunteerHours: userData.volunteerHours || 0,
      badges: userData.badges || [],
      savedPets: userData.savedPets || [],
      favoriteLocations: userData.favoriteLocations || [],
      bio: userData.bio || '',
      city: userData.city || '',
      dateOfBirth: userData.dateOfBirth || ''
    };

    // Eğer spesifik olarak tanımlanmışsa atama yap, yoksa varsayılan değerleri kullan
    if (userData.location) {
      newUser.location = userData.location;
    }
    
    if (userData.activeTask) {
      newUser.activeTask = userData.activeTask;
    }

    // undefined değerleri içeren özellikler varsa temizle
    const cleanUser = Object.fromEntries(
      Object.entries(newUser).filter(([_, value]) => value !== undefined)
    );

    console.log('Yeni kullanıcı oluşturuluyor:', cleanUser);
    const userRef = doc(db, this.usersCollection, newUser.uid);
    await setDoc(userRef, cleanUser);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    // Önce mevcut kullanıcı bilgilerini alalım
    const userRef = doc(db, this.usersCollection, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentData = userDoc.data() as User;
    
    // Güncellemeler için undefined olmayan değerleri birleştir
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    // Güncellenmiş veriyi hazırla
    const updatedData = {
      ...cleanUpdates,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Kullanıcı güncelleniyor:', userId, updatedData);
    await updateDoc(userRef, updatedData);
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

  async makeAdmin(userId: string): Promise<void> {
    const userRef = doc(db, this.usersCollection, userId);
    await updateDoc(userRef, {
      role: 'admin',
      emailVerified: true,
      updatedAt: new Date().toISOString()
    });
    console.log('Kullanıcı admin rolüne yükseltildi:', userId);
  }

  async makeCurrentUserAdmin(): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user!');
    return this.makeAdmin(auth.currentUser.uid);
  }
} 