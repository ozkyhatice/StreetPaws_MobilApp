import React, { createContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types/auth';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Kullanıcı durumu değişikliklerini dinle
  useEffect(() => {
    // İlk yükleme sırasında AsyncStorage'dan oturum durumunu kontrol et
    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('AsyncStorage error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkStoredUser();

    // Firebase Auth durumunu dinle
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || ''
        };
        
        setUser(userData);
        
        // Kullanıcı bilgisini AsyncStorage'a kaydet
        try {
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('AsyncStorage save error:', error);
        }
      } else {
        setUser(null);
        // Kullanıcı çıkış yaptığında AsyncStorage'dan temizle
        try {
          await AsyncStorage.removeItem('user');
        } catch (error) {
          console.error('AsyncStorage remove error:', error);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with displayName
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      setLoading(true);
      console.log('Signing out user...');
      await firebaseSignOut(auth);
      console.log('Sign out successful');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut: signOutUser,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 