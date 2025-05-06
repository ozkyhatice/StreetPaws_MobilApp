import React, { useState, useLayoutEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

type ChangePasswordScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Şifre Değiştir',
      headerLeft: () => (
        <Ionicons
          name="chevron-back"
          size={24}
          color="#000"
          style={{ marginLeft: 10 }}
          onPress={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation]);

  const handleChangePassword = () => {
    if (currentPassword === newPassword) {
      setError('Mevcut şifre yeni şifre ile aynı olamaz');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }
    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }
    // Burada şifre değiştirme API çağrısı yapılacak
    console.log('Şifre değiştiriliyor...');
    Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi');
    navigation.navigate('MainApp', {
      screen: 'Profile'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            
            <TextInput
              label="Mevcut Şifre"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.input}
            />

            <TextInput
              label="Yeni Şifre"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
            />

            <TextInput
              label="Yeni Şifre (Tekrar)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              mode="contained"
              onPress={handleChangePassword}
              style={styles.button}
            >
              Şifreyi Değiştir
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
}); 