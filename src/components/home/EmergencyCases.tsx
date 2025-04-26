import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { MapPin } from 'lucide-react-native';
import { colors } from '../../config/theme';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const emergencyCases = [
  {
    id: 2,
    title: 'Aç Köpekler',
    location: 'Beşiktaş, İstanbul',
    image: 'https://placedog.net/200/200',
    urgency: 'Orta'
  },
  {
    id: 1,
    title: 'Yaralı Kedi',
    location: 'Kadıköy, İstanbul',
    image: 'https://placekitten.com/200/200',
    urgency: 'Yüksek'
  }
];

export const EmergencyCases = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleTaskDetailPress = (id: number) => {
    const reversedId = id === 1 ? 2 : 1;
    navigation.navigate('TaskDetail', { taskId: reversedId.toString() });
  };

  return (
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
              <Text variant="bodyMedium" style={styles.locationText}>{item.location}</Text>
            </View>
            <View style={[
              styles.urgencyBadge,
              { backgroundColor: item.urgency === 'Yüksek' ? colors.error + '20' : colors.warning + '20' }
            ]}>
              <Text style={[
                styles.urgencyText,
                { color: item.urgency === 'Yüksek' ? colors.error : colors.warning }
              ]}>{item.urgency}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 15,
  },
  sectionTitle: {
    marginBottom: 15,
    color: colors.text,
    fontWeight: '600',
  },
  emergencyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emergencyImage: {
    width: 100,
    height: 100,
  },
  emergencyInfo: {
    flex: 1,
    padding: 15,
  },
  emergencyTitle: {
    color: colors.text,
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    marginLeft: 5,
    color: colors.textSecondary,
    fontSize: 14,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 20,
    marginRight: spacing.xs,
  },
}); 