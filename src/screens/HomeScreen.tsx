import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Users, Heart, AlertTriangle, Map } from 'lucide-react-native';
import { RootStackParamList } from '../types/navigation';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows } from '../config/theme';
import { LinearGradient } from 'expo-linear-gradient';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Get the window width for responsive design
const { width } = Dimensions.get('window');
const isTablet = width > 768;
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primaryLight + '60', colors.primary + '30']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text variant="headlineMedium" style={styles.title}>StreetPaws</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Sokak hayvanlarına yardım etmek için bir araya geldik
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleMapPress}
            activeOpacity={0.7}
          >
            <Map size={isSmallScreen ? 24 : 32} color={colors.secondary} />
            <Text variant="titleMedium" style={styles.actionTitle}>Haritada Gör</Text>
            <Text variant="bodySmall" style={styles.actionDescription}>
              Yakınındaki görevleri haritada keşfet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleVolunteersPress}
            activeOpacity={0.7}
          >
            <Users size={isSmallScreen ? 24 : 32} color={colors.primary} />
            <Text variant="titleMedium" style={styles.actionTitle}>Gönüllüler</Text>
            <Text variant="bodySmall" style={styles.actionDescription}>
              Diğer gönüllülerle iletişime geç
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleDonationsPress}
            activeOpacity={0.7}
          >
            <Heart size={isSmallScreen ? 24 : 32} color={colors.info} />
            <Text variant="titleMedium" style={styles.actionTitle}>Bağış Yap</Text>
            <Text variant="bodySmall" style={styles.actionDescription}>
              Sokak hayvanlarına destek ol
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Güncel Bilgiler</Text>
          
          <Card style={styles.infoCard} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Kış Yaklaşıyor</Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                Soğuk havalar için sokak hayvanlarına barınak yapma görevleri eklendi. Katılmak için görevler sayfasını kontrol edin.
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.infoCard} mode="elevated">
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
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: item.image }} 
                style={styles.emergencyImage} 
                resizeMode="cover"
              />
              <View style={styles.emergencyInfo}>
                <Text variant="titleMedium" style={styles.emergencyTitle}>{item.title}</Text>
                <View style={styles.locationContainer}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text variant="bodySmall" style={styles.locationText}>{item.location}</Text>
                </View>
                <View
                  style={[
                    styles.urgencyBadge,
                    {
                      backgroundColor:
                        item.urgency === 'Yüksek' ? colors.secondaryLight : colors.info + '20',
                    },
                  ]}
                >
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.urgencyText,
                      {
                        color: item.urgency === 'Yüksek' ? colors.secondary : colors.info,
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

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            © 2023 StreetPaws - Tüm hakları saklıdır
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  headerGradient: {
    borderBottomLeftRadius: borderRadius.large,
    borderBottomRightRadius: borderRadius.large,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    marginVertical: spacing.md,
  },
  actionCard: {
    width: isTablet ? '30%' : isSmallScreen ? '100%' : '31%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
    marginBottom: isSmallScreen ? spacing.md : spacing.sm,
    elevation: 3,
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.2)' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 3 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4.65 : undefined,
  },
  actionTitle: {
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: colors.text,
  },
  actionDescription: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    fontSize: isSmallScreen ? 12 : 14,
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
  },
  infoSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
    color: colors.text,
  },
  infoCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.15)' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 3.84 : undefined,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  cardText: {
    color: colors.textSecondary,
  },
  statsSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
  },
  statsRow: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: isSmallScreen ? undefined : 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.small,
    marginHorizontal: isSmallScreen ? 0 : spacing.xxs,
    marginBottom: isSmallScreen ? spacing.sm : 0,
    width: isSmallScreen ? '100%' : undefined,
    elevation: 2,
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.15)' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 3.0 : undefined,
  },
  statNumber: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: isSmallScreen ? 14 : 16,
  },
  emergencyCard: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.medium,
    elevation: 3,
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.15)' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 3 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4.65 : undefined,
  },
  emergencyImage: {
    width: isSmallScreen ? '100%' : 100,
    height: isSmallScreen ? 150 : 100,
    borderTopLeftRadius: isSmallScreen ? borderRadius.medium : borderRadius.medium,
    borderTopRightRadius: isSmallScreen ? borderRadius.medium : 0,
    borderBottomLeftRadius: isSmallScreen ? 0 : borderRadius.medium,
  },
  emergencyInfo: {
    flex: 1,
    padding: spacing.md,
  },
  emergencyTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationText: {
    marginLeft: spacing.xs,
    color: colors.textSecondary,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  urgencyText: {
    fontWeight: '600',
  },
  addEmergencyButton: {
    marginTop: spacing.md,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.medium,
    elevation: 2,
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.15)' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 3.84 : undefined,
  },
  addEmergencyButtonContent: {
    paddingVertical: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xl,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textTertiary,
  },
});

export default HomeScreen;

