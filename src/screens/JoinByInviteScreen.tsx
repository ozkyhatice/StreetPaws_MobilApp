import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Text, Button, TextInput, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { CommunityService } from '../services/communityService';
import { ArrowRight, Link } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';

type JoinByInviteScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type JoinByInviteScreenRouteProp = {
  params: {
    inviteCode?: string;
  };
};

export default function JoinByInviteScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<JoinByInviteScreenNavigationProp>();
  const route = useRoute<JoinByInviteScreenRouteProp>();
  
  const [inviteCode, setInviteCode] = useState(route.params?.inviteCode || '');
  const [loading, setLoading] = useState(false);
  
  const communityService = CommunityService.getInstance();
  
  // Derin bağlantı ile gelen davet kodlarını işlemek için
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      // Davet bağlantısını çözümle
      let code = '';
      if (event.url.includes('/invite/')) {
        code = event.url.split('/invite/')[1];
        setInviteCode(code);
      }
    };

    // Uygulama açıkken gelen derin bağlantıları dinle
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Uygulama kapalıyken açıldığında gelen bağlantıyı işle
    Linking.getInitialURL().then(url => {
      if (url) {
        const urlObj = { url };
        handleDeepLink(urlObj);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
  
  const handleJoinByCommunityCode = async () => {
    if (!user) {
      Alert.alert('Hata', 'Katılmak için giriş yapmalısınız');
      return;
    }
    
    if (!inviteCode.trim()) {
      Alert.alert('Hata', 'Lütfen bir davet kodu girin');
      return;
    }
    
    try {
      setLoading(true);
      
      // Davet koduyla katıl
      const result = await communityService.joinCommunityByInviteCode(
        inviteCode.trim(),
        user.uid
      );
      
      if (result.success && result.communityId) {
        Alert.alert('Başarılı', result.message, [
          {
            text: 'Tamam',
            onPress: () => {
              // Başarılı olduğunda topluluk detay sayfasına yönlendir
              navigation.navigate('CommunityDetail', { 
                communityId: result.communityId 
              });
            }
          }
        ]);
      } else {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      console.error('Error joining community by invite code:', error);
      Alert.alert('Hata', 'Topluluğa katılırken bir sorun oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>Davet Koduyla Katıl</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Link size={60} color={colors.primary} />
          </View>
          
          <Text style={styles.description}>
            Topluluğa katılmak için size verilen davet kodunu girin.
          </Text>
          
          <TextInput
            label="Davet Kodu"
            value={inviteCode}
            onChangeText={setInviteCode}
            style={styles.input}
            autoCapitalize="characters"
            placeholder="Örn: ABCD1234"
          />
          
          <Button
            mode="contained"
            onPress={handleJoinByCommunityCode}
            loading={loading}
            disabled={loading || !inviteCode.trim()}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon={({ size, color }) => 
              !loading && <ArrowRight size={size} color={color} />
            }
          >
            Katıl
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // IconButton genişliği kadar
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.lg,
    borderRadius: 40,
    marginBottom: spacing.xl,
  },
  description: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
    marginTop: spacing.md,
  },
  buttonContent: {
    height: 50,
    justifyContent: 'center',
  },
}); 