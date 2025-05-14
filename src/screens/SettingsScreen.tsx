import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Text, Button, List, Divider, Switch } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../config/theme';
import { useAuth } from '../hooks/useAuth';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [debugTapCount, setDebugTapCount] = useState(0);
  
  const handleVersionTap = () => {
    const newCount = debugTapCount + 1;
    setDebugTapCount(newCount);
    
    if (newCount >= 7) {
      // Show DevTools access
      setDebugTapCount(0);
      navigation.navigate('DevTools');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Ayarlar</Text>
        </View>
        
        <List.Section>
          <List.Subheader>Hesap</List.Subheader>
          <List.Item
            title="Profil Bilgileri"
            description="Kişisel bilgilerinizi düzenleyin"
            left={props => <List.Icon {...props} icon="account" />}
            onPress={() => navigation.navigate('Profile')}
          />
          <List.Item
            title="Şifre Değiştir"
            description="Hesap şifrenizi güncelleyin"
            left={props => <List.Icon {...props} icon="lock" />}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <Divider />
          
          <List.Subheader>Uygulama</List.Subheader>
          <List.Item
            title="Bildirim Ayarları"
            description="Bildirimleri özelleştirin"
            left={props => <List.Icon {...props} icon="bell" />}
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <List.Item
            title="Tema Ayarları"
            description="Karanlık/aydınlık tema tercihinizi seçin"
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            onPress={() => navigation.navigate('ThemeSettings')}
          />
          <Divider />
          
          <List.Subheader>Hakkında</List.Subheader>
          <List.Item
            title="Uygulama Versiyonu"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
            onPress={handleVersionTap}
          />
          
          {/* DevTools link if admin (normally hidden) */}
          {user?.role === 'admin' && (
            <>
              <Divider />
              <List.Subheader>Geliştirici Araçları</List.Subheader>
              <List.Item
                title="Geliştirici Araçları"
                description="Veritabanı araçları ve hata ayıklama"
                left={props => <List.Icon {...props} icon="tools" />}
                onPress={() => navigation.navigate('DevTools')}
              />
            </>
          )}
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default SettingsScreen;
