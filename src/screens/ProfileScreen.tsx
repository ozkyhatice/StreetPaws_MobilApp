import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Animated } from 'react-native';
import { Text, Avatar, Card, Divider, List, Button, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker } from 'react-native-maps';
import { XPProgress } from '../components/XPProgress';
import { colors } from '../theme/colors';
import { bounceIn, fadeIn, pulse } from '../utils/animations';

type RootStackParamList = {
  ChangePassword: undefined;
  NotificationSettings: undefined;
  ThemeSettings: undefined;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Animasyonlu Avatar bileşeni
const AnimatedAvatar = ({ pulseAnim }: { pulseAnim: Animated.Value }) => {
  const scale = pulseAnim;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Avatar.Image 
        size={80} 
        source={{ uri: 'https://via.placeholder.com/100' }} 
        style={styles.avatar}
      />
    </Animated.View>
  );
};

// Animasyonlu StatItem bileşeni
const AnimatedStatItem = ({ pulseAnim, value, label }: { pulseAnim: Animated.Value, value: string | number, label: string }) => {
  const scale = pulseAnim;
  
  return (
    <Animated.View style={[styles.statItem, { transform: [{ scale }] }]}>
      <Text variant="headlineSmall">{value}</Text>
      <Text variant="bodySmall">{label}</Text>
    </Animated.View>
  );
};

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState(0);

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Sayfa yüklendiğinde animasyonları başlat
    Animated.parallel([
      fadeIn(fadeAnim),
      bounceIn(scaleAnim),
      pulse(pulseAnim, 2000)
    ]).start();
  }, []);

  const badges = [
    {
      id: 1,
      name: 'İlk Görev',
      description: 'İlk görevini tamamladın!',
      icon: 'star',
      color: '#FFD700',
      earned: true
    },
    {
      id: 2,
      name: 'Haftalık Gönüllü',
      description: 'Bir hafta boyunca aktif gönüllülük yaptın',
      icon: 'calendar-check',
      color: '#4CAF50',
      earned: true
    },
    {
      id: 3,
      name: 'Bağış Toplayıcı',
      description: '1000 TL değerinde bağış topladın',
      icon: 'hand-heart',
      color: '#FF5722',
      earned: true
    },
    {
      id: 4,
      name: 'Süper Gönüllü',
      description: '50 görev tamamladın',
      icon: 'trophy',
      color: '#9C27B0',
      earned: false
    }
  ];

  const leaderboardData = {
    rank: 15,
    totalUsers: 1000,
    points: 850
  };

  const socialData = {
    following: 24,
    followers: 18,
    recentFollowers: [
      { id: 1, name: 'Ahmet Yılmaz', avatar: 'https://via.placeholder.com/40' },
      { id: 2, name: 'Ayşe Demir', avatar: 'https://via.placeholder.com/40' },
      { id: 3, name: 'Mehmet Kaya', avatar: 'https://via.placeholder.com/40' }
    ]
  };

  const contributionData = {
    activeRegions: [
      { id: 1, name: 'Kadıköy', count: 8 },
      { id: 2, name: 'Beşiktaş', count: 5 },
      { id: 3, name: 'Şişli', count: 3 }
    ],
    foodPoints: [
      { id: 1, name: 'Köfteci Yusuf', type: 'Restoran', count: 12 },
      { id: 2, name: 'Simit Sarayı', type: 'Kafe', count: 8 },
      { id: 3, name: 'Burger King', type: 'Fast Food', count: 5 }
    ],
    mapRegion: {
      latitude: 41.0082,
      longitude: 28.9784,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    markers: [
      { id: 1, coordinate: { latitude: 41.0082, longitude: 28.9784 }, title: 'Kadıköy' },
      { id: 2, coordinate: { latitude: 41.0422, longitude: 29.0062 }, title: 'Beşiktaş' },
      { id: 3, coordinate: { latitude: 41.0602, longitude: 28.9877 }, title: 'Şişli' }
    ]
  };

  const userData = {
    currentXP: 850,
    levelXP: 1000,
    level: 5,
    rank: 'gold' as 'bronze' | 'silver' | 'gold' | 'platinum',
  };

  const renderProfileInfo = () => (
    <View style={styles.profileContainer}>
      <Animated.View style={[styles.header, { transform: [{ scale: scaleAnim }] }]}>
        <AnimatedAvatar pulseAnim={pulseAnim} />
        <View style={styles.userInfo}>
          <Text variant="headlineSmall" style={styles.name}>Hatice Özkaya</Text>
          <Text variant="bodyMedium" style={styles.username}>@haticeozkaya</Text>
          <Text variant="bodySmall" style={styles.email}>hatice@example.com</Text>
        </View>
      </Animated.View>

      <XPProgress
        currentXP={userData.currentXP}
        levelXP={userData.levelXP}
        level={userData.level}
        rank={userData.rank}
      />

      <Animated.View style={[styles.statsCard, { transform: [{ scale: scaleAnim }] }]}>
        <Card.Content>
          <View style={styles.statsRow}>
            <AnimatedStatItem pulseAnim={pulseAnim} value={12} label="Görev" />
            <AnimatedStatItem pulseAnim={pulseAnim} value={userData.currentXP} label="XP" />
            <AnimatedStatItem pulseAnim={pulseAnim} value={3} label="Rozet" />
          </View>
        </Card.Content>
      </Animated.View>

      <Card style={styles.socialCard}>
        <Card.Content>
          <View style={styles.socialStats}>
            <View style={styles.socialStat}>
              <Text variant="headlineSmall">{socialData.following}</Text>
              <Text variant="bodySmall">Takip Edilen</Text>
            </View>
            <View style={styles.socialStat}>
              <Text variant="headlineSmall">{socialData.followers}</Text>
              <Text variant="bodySmall">Takipçi</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Hesap Ayarları</Text>
          <List.Section>
            <List.Item
              title="Şifre Değiştir"
              left={props => <List.Icon {...props} icon="lock" />}
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <List.Item
              title="Bildirim Tercihleri"
              left={props => <List.Icon {...props} icon="bell" />}
              onPress={() => navigation.navigate('NotificationSettings')}
            />
            <List.Item
              title="Tema Ayarları"
              left={props => <List.Icon {...props} icon="theme-light-dark" />}
              onPress={() => navigation.navigate('ThemeSettings')}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={() => {}}
          style={styles.logoutButton}
          textColor="#FF0000"
        >
          Çıkış Yap
        </Button>
      </View>
    </View>
  );

  const renderBadges = () => (
    <ScrollView>
      <Card style={styles.badgesCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Rozetlerim</Text>
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <View key={badge.id} style={styles.badgeItem}>
                <IconButton
                  icon={badge.icon}
                  size={40}
                  iconColor={badge.earned ? badge.color : '#CCCCCC'}
                  style={[
                    styles.badgeIcon,
                    { backgroundColor: badge.earned ? `${badge.color}20` : '#F5F5F5' }
                  ]}
                />
                <Text variant="bodySmall" style={styles.badgeName}>{badge.name}</Text>
                <Text variant="bodySmall" style={styles.badgeDescription}>{badge.description}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderActivities = () => (
    <ScrollView>
      <Card style={styles.contributionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Katkıda Bulunduğum Yerler</Text>
          
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={contributionData.mapRegion}
            >
              {contributionData.markers.map((marker) => (
                <Marker
                  key={marker.id}
                  coordinate={marker.coordinate}
                  title={marker.title}
                />
              ))}
            </MapView>
          </View>

          <View style={styles.regionsList}>
            <Text variant="bodyMedium" style={styles.listTitle}>Aktif Bölgeler</Text>
            {contributionData.activeRegions.map((region) => (
              <View key={region.id} style={styles.regionItem}>
                <Text variant="bodyMedium">{region.name}</Text>
                <Chip>{region.count} görev</Chip>
              </View>
            ))}
          </View>

          <View style={styles.foodPointsList}>
            <Text variant="bodyMedium" style={styles.listTitle}>Yiyecek Noktaları</Text>
            {contributionData.foodPoints.map((point) => (
              <View key={point.id} style={styles.foodPointItem}>
                <View>
                  <Text variant="bodyMedium">{point.name}</Text>
                  <Text variant="bodySmall" style={styles.foodPointType}>{point.type}</Text>
                </View>
                <Chip>{point.count} katkı</Chip>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.leaderboardCard}>
        <Card.Content>
          <View style={styles.leaderboardHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Sıralama</Text>
            <Button
              mode="text"
              onPress={() => {}}
              icon="trophy"
            >
              Genel Sıralamayı Gör
            </Button>
          </View>
          <View style={styles.leaderboardStats}>
            <View style={styles.leaderboardStat}>
              <Text variant="headlineSmall">{leaderboardData.rank}</Text>
              <Text variant="bodySmall">Sıralama</Text>
            </View>
            <View style={styles.leaderboardStat}>
              <Text variant="headlineSmall">{leaderboardData.points}</Text>
              <Text variant="bodySmall">Puan</Text>
            </View>
            <View style={styles.leaderboardStat}>
              <Text variant="headlineSmall">{leaderboardData.totalUsers}</Text>
              <Text variant="bodySmall">Toplam Gönüllü</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(leaderboardData.rank / leaderboardData.totalUsers) * 100}%` }
                ]} 
              />
            </View>
            <Text variant="bodySmall" style={styles.progressText}>
              İlk {Math.round((leaderboardData.rank / leaderboardData.totalUsers) * 100)}% içindesin
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 0 && styles.activeTab]} 
          onPress={() => setActiveTab(0)}
        >
          <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>Bilgilerim</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 1 && styles.activeTab]} 
          onPress={() => setActiveTab(1)}
        >
          <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>Rozetlerim</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 2 && styles.activeTab]} 
          onPress={() => setActiveTab(2)}
        >
          <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>Etkinliklerim</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 0 && renderProfileInfo()}
        {activeTab === 1 && renderBadges()}
        {activeTab === 2 && renderActivities()}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    height: 48,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  profileContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.card,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: colors.utility.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  username: {
    color: colors.text.secondary,
  },
  email: {
    color: colors.text.tertiary,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  socialCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  socialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  socialStat: {
    alignItems: 'center',
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  logoutContainer: {
    margin: 16,
    marginTop: 0,
  },
  logoutButton: {
    borderColor: '#FF0000',
  },
  badgesCard: {
    margin: 16,
    elevation: 2,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  badgeItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
  },
  badgeIcon: {
    marginBottom: 8,
  },
  badgeName: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  badgeDescription: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  contributionCard: {
    margin: 16,
    elevation: 2,
  },
  mapContainer: {
    height: 200,
    marginVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  regionsList: {
    marginTop: 16,
  },
  foodPointsList: {
    marginTop: 16,
  },
  listTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  foodPointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  foodPointType: {
    color: '#666',
  },
  leaderboardCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaderboardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  leaderboardStat: {
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
  },
});