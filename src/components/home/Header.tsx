import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../config/theme';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { useSelector } from 'react-redux';

type HeaderNavigationProp = StackNavigationProp<RootStackParamList>;

export const Header = () => {
  const navigation = useNavigation<HeaderNavigationProp>();
  // Get unread notifications count from Redux store
  const unreadCount = useSelector((state: any) => state.notifications?.unreadCount || 0);

  const navigateToNotifications = () => {
    navigation.navigate('Notifications');
  };

  return (
    <LinearGradient
      colors={[colors.primaryLight + '60', colors.primary + '30']}
      style={styles.headerGradient}
    >
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/pawprint.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text variant="headlineMedium" style={styles.title}>StreetPaws</Text>
          </View>

          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={navigateToNotifications}
          >
            <Bell size={24} color={colors.primary} />
            {unreadCount > 0 && (
              <Badge
                style={styles.badge}
                size={18}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    paddingHorizontal: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  notificationButton: {
    padding: spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: colors.error,
  },
}); 