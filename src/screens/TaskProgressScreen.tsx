import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  RefreshControl
} from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../config/theme';
import { TaskProgressCard } from '../components/TaskProgressCard';
import { useAuth } from '../hooks/useAuth';

export default function TaskProgressScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const progressCardRef = useRef<any>(null);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('TaskProgressScreen focused - refreshing data');
      handleRefresh();
      return () => {};
    }, [user?.uid])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    // Give some visual feedback
    setTimeout(() => {
      // The actual refresh will be handled by the TaskProgressCard component
      if (progressCardRef.current && progressCardRef.current.refresh) {
        progressCardRef.current.refresh();
      }
      setRefreshing(false);
    }, 500);
  };

  const navigateToAchievements = () => {
    navigation.navigate('Achievements');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon={() => <ArrowLeft size={24} color={colors.text} />}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>Görev İlerlemen</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.notLoggedInText}>
            Görev istatistiklerini görmek için lütfen giriş yapın.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle="dark-content"
      />
      
      <View style={styles.header}>
        <IconButton
          icon={() => <ArrowLeft size={24} color={colors.text} />}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Görev İlerlemen</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <TaskProgressCard 
          ref={progressCardRef}
          userId={user.uid} 
          onBadgePress={navigateToAchievements}
        />
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Nasıl Rozet Kazanılır?</Text>
          <Text style={styles.infoText}>
            • Görevleri tamamlayarak çeşitli rozetler kazanabilirsiniz{'\n'}
            • Aynı kategoride görevleri tamamlayarak uzmanlaşabilirsiniz{'\n'}
            • Her gün en az bir görev tamamlayarak seri oluşturup özel rozetler kazanabilirsiniz{'\n'}
            • Farklı öncelikteki görevleri tamamlayarak rozetler kazanabilirsiniz{'\n'}
            • Tüm rozetlerinizi ve ilerlemenizi görmek için rozet ikonuna tıklayın
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  notLoggedInText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
}); 