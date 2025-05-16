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
import { initializeDatabase } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService } from '../services/userService';
import { XPService } from '../services/xpService';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userService = UserService.getInstance();

  // Uygulama başlatıldığında veritabanı yapısını kontrol et ve oluştur
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log('Veritabanı yapısı kontrol ediliyor...');
        await initializeDatabase();
      } catch (error) {
        console.error('Veritabanı yapısını kontrol ederken hata:', error);
      }
    };
    
    setupDatabase();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await userService.getUserById(firebaseUser.uid);
          if (userData) {
            // Admin kullanıcıları için e-posta doğrulamasını atlayabiliriz
            const isVerified = userData.role === 'admin' ? true : firebaseUser.emailVerified;
            
            setUser({
              ...userData,
              emailVerified: isVerified
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
      console.log('Kullanıcı kaydı başlatıldı:', email);
      
      // Firebase Authentication ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Kullanıcı Authentication kaydı oluşturuldu:', userCredential.user.uid);
      
      // Kullanıcı profilini güncelle
      await updateProfile(userCredential.user, { displayName });
      console.log('Kullanıcı profili güncellendi');
      
      // E-posta doğrulama gönder
      try {
        console.log('Doğrulama e-postası gönderiliyor...');
        await sendEmailVerification(userCredential.user);
        console.log('Doğrulama e-postası gönderildi');
      } catch (emailError: any) {
        console.error('Doğrulama e-postası gönderirken hata:', emailError);
        // Burada hata alınsa bile kullanıcı kaydına devam ediyoruz
      }
      
      // Firestore'da kullanıcı dokümanı oluştur
      await userService.createUser({
        displayName,
        email,
        uid: userCredential.user.uid,
        emailVerified: false,
        // Diğer alanları burada belirtmeyin, userService içinde varsayılan değerler atanacak
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
      console.log('Kullanıcı girişi başlatıldı:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Kullanıcı girişi başarılı:', userCredential.user.uid);
      
      // Kullanıcı verilerini Firestore'dan al
      const userData = await userService.getUserById(userCredential.user.uid);
      if (userData) {
        setUser({
          ...userData,
          emailVerified: userCredential.user.emailVerified
        });
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Check and update daily streak
        try {
          const xpService = XPService.getInstance();
          const streakResult = await xpService.checkAndUpdateDailyStreak(userCredential.user.uid);
          
          if (streakResult.streakUpdated) {
            console.log(`Daily streak updated: ${streakResult.currentStreak} days, XP awarded: ${streakResult.xpAwarded}`);
            
            // Update the user object with the new streak value
            if (userData.streak !== streakResult.currentStreak) {
              await userService.updateUser(userCredential.user.uid, {
                streak: streakResult.currentStreak
              });
            }
          }
        } catch (streakError) {
          console.error('Error updating daily streak:', streakError);
          // Don't block the login process if streak update fails
        }
      }

      // E-posta doğrulanmamışsa yeni doğrulama e-postası gönder
      if (!userCredential.user.emailVerified) {
        try {
          console.log('E-posta doğrulanmamış, yeni doğrulama e-postası gönderiliyor...');
          await sendEmailVerification(userCredential.user);
          console.log('Doğrulama e-postası gönderildi');
        } catch (emailError: any) {
          console.error('Doğrulama e-postası gönderirken hata:', emailError);
          console.error('Hata detayı:', emailError.code, emailError.message);
          // Bu hata kullanıcının giriş yapmasını engellememeli
        }
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
      if (!auth.currentUser) {
        console.error('Doğrulama e-postası gönderilemedi: Kullanıcı oturum açmamış');
        throw new Error('No user is signed in');
      }
      
      console.log('Yeniden doğrulama e-postası gönderiliyor:', auth.currentUser.email);
      await sendEmailVerification(auth.currentUser);
      console.log('Doğrulama e-postası başarıyla gönderildi');
      return true;
    } catch (error: any) {
      console.error('Doğrulama e-postası gönderme hatası:', error);
      // Hatanın daha detaylı bir kısmını gösterelim
      const errorMessage = error.message || 'Bilinmeyen hata';
      const errorCode = error.code || 'unknown';
      console.error(`Hata kodu: ${errorCode}, Mesaj: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  };

  const checkEmailVerification = async () => {
    try {
      if (!auth.currentUser) {
        console.error('E-posta doğrulama kontrolü: Kullanıcı oturum açmamış');
        throw new Error('No user is signed in');
      }
      
      console.log('E-posta doğrulama durumu kontrol ediliyor...');
      await auth.currentUser.reload();
      const isVerified = auth.currentUser.emailVerified;
      console.log('E-posta doğrulama durumu:', isVerified ? 'Doğrulanmış' : 'Doğrulanmamış');
      
      if (isVerified && user) {
        console.log('E-posta doğrulandı, kullanıcı verileri güncelleniyor');
        // Firestore'daki kullanıcı verisini güncelle
        await userService.updateUser(auth.currentUser.uid, {
          emailVerified: true
        });
        
        // Local state'i güncelle
        setUser({
          ...user,
          emailVerified: true
        });
        
        console.log('Kullanıcı verileri güncellendi');
      } else if (!isVerified) {
        console.log('E-posta hala doğrulanmamış');
      }
      
      return isVerified;
    } catch (error: any) {
      console.error('E-posta doğrulama kontrolü hatası:', error);
      const errorMessage = error.message || 'Bilinmeyen bir hata oluştu';
      const errorCode = error.code || 'unknown';
      console.error(`Hata kodu: ${errorCode}, Mesaj: ${errorMessage}`);
      throw new Error(errorMessage);
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