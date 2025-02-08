import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Animated } from 'react-native';
import { Button, ProgressBar, Avatar, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [xp, setXp] = useState(65); // XP seviyesi yüzde olarak
  const [level, setLevel] = useState(3);
  const [fadeAnim] = useState(new Animated.Value(0));

  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  }).start();

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
      <View style={styles.header}>
        <Avatar.Image size={100} source={{ uri: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freepik.com%2Fpremium-vector%2Fcute-cat-icon-vector-illustration_57448476.htm&psig=AOvVaw21MTgUcMRu3lg7BIe-ID5q&ust=1739101726936000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCNjL7fiAtIsDFQAAAAAdAAAAABAE' }} />
        <Text style={styles.username}>@nyxLynrs</Text>
        <Text style={styles.level}>Seviye {level}</Text>
      </View>
      <View style={styles.xpContainer}>
        <Text style={styles.xpText}>XP: {xp}%</Text>
        <ProgressBar progress={xp / 100} color='#4caf50' style={styles.progressBar} />
      </View>
      <Animated.View style={{ ...styles.cardContainer, opacity: fadeAnim }}>
        <Card style={styles.card}>
          <Card.Title title='Kazanılan Rozetler' left={() => <FontAwesome5 name='medal' size={24} color='#ff9800' />} />
          <Card.Content>
            <Text>🌟 Hayvan Dostu</Text>
            <Text>🐶 Kurtarıcı</Text>
            <Text>🐾 Destekçi</Text>
          </Card.Content>
        </Card>
        <Card style={styles.card}>
          <Card.Title title='Geçmiş Yardımlar' left={() => <FontAwesome5 name='paw' size={24} color='#4caf50' />} />
          <Card.Content>
            <Text>📍 10 farklı lokasyonda yardım etti</Text>
            <Text>🥫 50 kg mama bağışladı</Text>
            <Text>🐕 5 hayvan sahiplendirdi</Text>
          </Card.Content>
        </Card>
      </Animated.View>
      <Button mode='contained' style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
        Profili Düzenle
      </Button>
    </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  level: {
    fontSize: 18,
    color: '#388e3c',
  },
  xpContainer: {
    marginBottom: 20,
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#4caf50',
  },
});

export default ProfileScreen;