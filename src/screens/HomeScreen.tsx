import React, { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '../components/home/Header';
import { Actions } from '../components/home/Actions';
import { InfoSection, InfoSectionRefHandle } from '../components/home/InfoSection';
import { StatsSection, StatsSectionRefHandle } from '../components/home/StatsSection';
import { StatsService } from '../services/statsService';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = React.useState(false);
  
  // References to component methods
  const infoSectionRef = useRef<InfoSectionRefHandle>(null);
  const statsSectionRef = useRef<StatsSectionRefHandle>(null);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Force recalculation of global stats
      const statsService = StatsService.getInstance();
      await statsService.recalculateAndUpdateGlobalStats();
      
      // Update component data
      if (statsSectionRef.current) {
        await statsSectionRef.current.fetchStats();
      }
      
      if (infoSectionRef.current) {
        await infoSectionRef.current.fetchInfoCards();
      }
    } catch (error) {
      console.error('Error refreshing home screen data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

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
        <Header />
        <Actions />
        <InfoSection ref={infoSectionRef} />
        <StatsSection ref={statsSectionRef} />
        
        <View style={styles.emergencyContainer}>
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => navigation.navigate('AddEmergency')}
              activeOpacity={0.8}
            >
              <View style={styles.emergencyContent}>
                <Ionicons name="alert-circle" size={24} color="#fff" />
                <Text style={styles.emergencyText}>Acil Durum Bildir</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emergencyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  buttonWrapper: {
    width: width * 0.9,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emergencyButton: {
    width: '100%',
    backgroundColor: '#FF3B30',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emergencyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default HomeScreen;

