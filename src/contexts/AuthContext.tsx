import React, { createContext, useState, useEffect } from 'react';
import { AuthContextType } from '../types/auth';
import { User } from '../types/user';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService } from '../services/userService';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userService = UserService.getInstance();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await userService.getUserById(firebaseUser.uid);
          if (userData) {
            setUser({
              ...userData,
              emailVerified: firebaseUser.emailVerified
            });
            await AsyncStorage.setItem('user', JSON.stringify(userData));
          }
        } else {
          setUser(null);
          await AsyncStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      // Firebase Authentication ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Kullanıcı profilini güncelle
      await updateProfile(userCredential.user, { displayName });
      
      // E-posta doğrulama gönder
      await sendEmailVerification(userCredential.user);
      
      // Firestore'da kullanıcı dokümanı oluştur
      await userService.createUser({
        displayName,
        email,
        uid: userCredential.user.uid,
        emailVerified: false
      });

      // Kullanıcı verilerini al ve state'i güncelle
      const userData = await userService.getUserById(userCredential.user.uid);
      if (userData) {
        setUser({
          ...userData,
          emailVerified: false
        });
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }

      return userCredential.user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Kullanıcı verilerini Firestore'dan al
      const userData = await userService.getUserById(userCredential.user.uid);
      if (userData) {
        setUser({
          ...userData,
          emailVerified: userCredential.user.emailVerified
        });
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }

      // E-posta doğrulanmamışsa yeni doğrulama e-postası gönder
      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
      }

      return userCredential.user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (!auth.currentUser) throw new Error('No user is signed in');
      await sendEmailVerification(auth.currentUser);
      return true;
    } catch (error: any) {
      console.error('Resend verification email error:', error);
      throw new Error(error.message);
    }
  };

  const checkEmailVerification = async () => {
    try {
      if (!auth.currentUser) throw new Error('No user is signed in');
      await auth.currentUser.reload();
      const isVerified = auth.currentUser.emailVerified;
      
      if (isVerified && user) {
        // Firestore'daki kullanıcı verisini güncelle
        await userService.updateUser(auth.currentUser.uid, {
          emailVerified: true
        });
        
        // Local state'i güncelle
        setUser({
          ...user,
          emailVerified: true
        });
      }
      
      return isVerified;
    } catch (error: any) {
      console.error('Check email verification error:', error);
      throw new Error(error.message);
    }
  };

  const signOutUser = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setUser(null);
      await AsyncStorage.removeItem('user');
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
      resetPassword,
      resendVerificationEmail,
      checkEmailVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 