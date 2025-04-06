import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Users, Heart, AlertTriangle, Map } from 'lucide-react-native';
import { RootStackParamList } from '../types/navigation';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Text, Button, Card } from 'react-native-paper';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Get the window width for responsive design
const { width } = Dimensions.get('window');
const cardWidth = width > 500 ? (width - 48) / 2 : width - 32;
const isSmallScreen = width < 375;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Add your refresh logic here
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const emergencyCases = [
    {
      id: 1,
      title: 'Yaralı Kedi',
      location: 'Kadıköy, İstanbul',
      image: 'https://placekitten.com/200/200',
      urgency: 'Yüksek',
    },
    {
      id: 2,
      title: 'Aç Köpekler',
      location: 'Beşiktaş, İstanbul',
      image: 'https://placedog.net/200/200',
      urgency: 'Orta',
    },
  ];

  const handleEmergencyPress = () => {
    navigation.navigate('AddEmergency');
  };

  const handleMapPress = () => {
    navigation.navigate('Map');
  };

  const handleVolunteersPress = () => {
    navigation.navigate('Volunteers');
  };

  const handleDonationsPress = () => {
    navigation.navigate('Donations');
  };

  const handleTaskDetailPress = (id: number) => {
    navigation.navigate('TaskDetail', { taskId: id.toString() });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="headlineMedium" style={styles.title}>StreetPaws</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Sokak hayvanlarına yardım etmek için bir araya geldik
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleMapPress}
        >
          <Map size={isSmallScreen ? 24 : 32} color="#FF6B6B" />
          <Text variant="titleMedium" style={styles.actionTitle}>Haritada Gör</Text>
          <Text variant="bodySmall" style={styles.actionDescription}>
            Yakınındaki görevleri haritada keşfet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleVolunteersPress}
        >
          <Users size={isSmallScreen ? 24 : 32} color="#4CAF50" />
          <Text variant="titleMedium" style={styles.actionTitle}>Gönüllüler</Text>
          <Text variant="bodySmall" style={styles.actionDescription}>
            Diğer gönüllülerle iletişime geç
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleDonationsPress}
        >
          <Heart size={isSmallScreen ? 24 : 32} color="#2196F3" />
          <Text variant="titleMedium" style={styles.actionTitle}>Bağış Yap</Text>
          <Text variant="bodySmall" style={styles.actionDescription}>
            Sokak hayvanlarına destek ol
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Güncel Bilgiler</Text>
        
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Kış Yaklaşıyor</Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              Soğuk havalar için sokak hayvanlarına barınak yapma görevleri eklendi. Katılmak için görevler sayfasını kontrol edin.
            </Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Besleme Noktaları</Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              Şehrin farklı bölgelerinde besleme noktaları oluşturuldu. En yakın beslenme noktasını haritada görebilirsiniz.
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsSection}>
        <Text variant="titleLarge" style={styles.sectionTitle}>İstatistikler</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text variant="headlineMedium" style={styles.statNumber}>156</Text>
            <Text variant="bodyMedium" style={styles.statLabel}>Aktif Görev</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text variant="headlineMedium" style={styles.statNumber}>843</Text>
            <Text variant="bodyMedium" style={styles.statLabel}>Gönüllü</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text variant="headlineMedium" style={styles.statNumber}>1.2k</Text>
            <Text variant="bodyMedium" style={styles.statLabel}>Tamamlanan Görev</Text>
          </View>
        </View>
      </View>

      {/* Emergency Cases */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Acil Durumlar</Text>
        {emergencyCases.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.emergencyCard}
            onPress={() => handleTaskDetailPress(item.id)}
          >
            <Image source={{ uri: item.image }} style={styles.emergencyImage} />
            <View style={styles.emergencyInfo}>
              <Text variant="titleMedium" style={styles.emergencyTitle}>{item.title}</Text>
              <View style={styles.locationContainer}>
                <MapPin size={16} color="#666" />
                <Text variant="bodySmall" style={styles.locationText}>{item.location}</Text>
              </View>
              <View
                style={[
                  styles.urgencyBadge,
                  {
                    backgroundColor:
                      item.urgency === 'Yüksek' ? '#FFE0E0' : '#E3F2FD',
                  },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={[
                    styles.urgencyText,
                    {
                      color: item.urgency === 'Yüksek' ? '#FF6B6B' : '#2196F3',
                    },
                  ]}
                >
                  {item.urgency}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        <Button 
          mode="contained" 
          icon="plus"
          style={styles.addEmergencyButton}
          contentStyle={styles.addEmergencyButtonContent}
          onPress={handleEmergencyPress}
        >
          Acil Durum Bildir
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF8E1',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#757575',
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionCard: {
    width: width > 600 ? (width / 3 - 24) : (width / 3 - 20),
    minHeight: 100,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: width > 375 ? 16 : 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  actionTitle: {
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    fontSize: width > 375 ? 16 : 14,
    fontWeight: '500',
  },
  actionDescription: {
    textAlign: 'center',
    color: '#757575',
    fontSize: width > 375 ? 12 : 10,
  },
  section: {
    padding: 16,
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 8,
    color: '#333333',
  },
  cardText: {
    color: '#555555',
  },
  statsSection: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    width: width > 600 ? width / 3 - 24 : width / 3 - 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: width > 600 ? 0 : 8,
    minWidth: 90,
  },
  statNumber: {
    marginBottom: 4,
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: width > 375 ? 24 : 20,
  },
  statLabel: {
    color: '#555555',
    textAlign: 'center',
    fontSize: width > 375 ? 14 : 12,
  },
  emergencyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
    overflow: 'hidden',
  },
  emergencyImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  emergencyInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  emergencyTitle: {
    fontWeight: '500',
    marginBottom: 8,
    color: '#333333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 4,
    color: '#666666',
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontWeight: '500',
  },
  addEmergencyButton: {
    marginTop: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    marginHorizontal: width > 600 ? 100 : 16,
  },
  addEmergencyButtonContent: {
    paddingVertical: 8,
  }
});

export default HomeScreen;

