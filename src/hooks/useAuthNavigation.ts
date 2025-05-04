import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from './useAuth';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Kullanıcı durumuna göre navigasyon akışını kontrol eden hook
 * @param requireAuth - Eğer true ise, kullanıcı oturum açmamışsa Login ekranına yönlendirir
 * @param redirectTo - Eğer requireAuth false ise ve kullanıcı oturum açmışsa, bu ekrana yönlendirir
 */
export const useAuthNavigation = (
  requireAuth: boolean = false,
  redirectTo: keyof RootStackParamList = 'MainApp'
) => {
  const { user, loading } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    // Yükleme durumunda bekle
    if (loading) return;

    if (requireAuth && !user) {
      // Oturum gerektiren bir sayfa için kullanıcı oturum açmamışsa Login'e yönlendir
      console.log('Oturum açılmamış, Login ekranına yönlendiriliyor');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else if (!requireAuth && user && redirectTo) {
      // Login gibi oturum gerektirmeyen bir sayfada kullanıcı zaten oturum açmışsa
      // ana uygulamaya yönlendir
      console.log(`Kullanıcı zaten oturum açmış, ${redirectTo} ekranına yönlendiriliyor`);
      navigation.reset({
        index: 0,
        routes: [{ name: redirectTo }],
      });
    }
  }, [user, loading, navigation, requireAuth, redirectTo]);

  return { user, loading };
}; 