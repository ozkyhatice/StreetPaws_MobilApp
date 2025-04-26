import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Map, Users, Heart } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

export const Actions = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleMapPress = () => {
    navigation.navigate('Map');
  };

  const handleVolunteersPress = () => {
    navigation.navigate('Volunteers');
  };

  const handleDonationsPress = () => {
    navigation.navigate('Donations');
  };

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={styles.actionCard}
        onPress={handleMapPress}
        activeOpacity={0.6}
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
        activeOpacity={0.6}
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
        activeOpacity={0.6}
      >
        <Heart size={isSmallScreen ? 24 : 32} color={colors.info} />
        <Text variant="titleMedium" style={styles.actionTitle}>Bağış Yap</Text>
        <Text variant="bodySmall" style={styles.actionDescription}>
          Sokak hayvanlarına destek ol
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionTitle: {
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
    color: colors.text,
  },
  actionDescription: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
}); 