import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, ProgressBar, Surface, Badge, Divider } from 'react-native-paper';
import { colors, typography, spacing, borderRadius, shadows } from '../config/theme';
import { CheckCircle, Award, Flame, Calendar, Star } from 'lucide-react-native';
import { BADGES } from '../types/badge';
import { XPService } from '../services/xpService';

interface TaskProgressCardProps {
  userId: string;
  onBadgePress?: () => void;
}

export function TaskProgressCard({ userId, onBadgePress }: TaskProgressCardProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    completedTasks: 0,
    totalStreakDays: 0,
    currentTasksCount: { 
      FEEDING: 0, 
      CLEANING: 0, 
      HEALTH: 0, 
      SHELTER: 0, 
      OTHER: 0 
    }
  });

  useEffect(() => {
    if (userId) {
      loadProgress();
    }
  }, [userId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const xpService = XPService.getInstance();
      const progressData = await xpService.getTaskProgress(userId);
      
      // Ensure all required fields exist
      const validatedData = {
        completedTasks: progressData?.completedTasks || 0,
        totalStreakDays: progressData?.totalStreakDays || 0,
        currentTasksCount: progressData?.currentTasksCount || { 
          FEEDING: 0, 
          CLEANING: 0, 
          HEALTH: 0, 
          SHELTER: 0, 
          OTHER: 0 
        }
      };
      
      setProgress(validatedData);
    } catch (error) {
      console.error('Error loading progress:', error);
      // Keep default values in case of error
    } finally {
      setLoading(false);
    }
  };

  const calculateBadgeProgress = (badgeId: string) => {
    switch (badgeId) {
      case 'helper_bronze':
        return Math.min(progress.completedTasks / 5, 1);
      case 'feeding_specialist':
        return Math.min(progress.currentTasksCount.FEEDING / 10, 1);
      case 'health_hero':
        return Math.min(progress.currentTasksCount.HEALTH / 10, 1);
      case 'shelter_builder':
        return Math.min(progress.currentTasksCount.SHELTER / 10, 1);
      default:
        return 0;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'FEEDING': return 'Besleme';
      case 'CLEANING': return 'Temizlik';
      case 'HEALTH': return 'Sağlık';
      case 'SHELTER': return 'Barınak';
      default: return 'Diğer';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'FEEDING': return '#4CAF50'; // Green
      case 'CLEANING': return '#2196F3'; // Blue
      case 'HEALTH': return '#F44336';   // Red
      case 'SHELTER': return '#FF9800';  // Orange
      case 'OTHER': return '#9C27B0';    // Purple
      default: return colors.primary;
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Görev İlerlemen</Text>
          <TouchableOpacity onPress={onBadgePress}>
            <Award size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <Divider style={styles.divider} />

        {/* Toplam Görevler */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <CheckCircle size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Tamamlanan Görevler</Text>
          </View>
          
          <View style={styles.progressValue}>
            <Text style={styles.progressValueText}>{progress.completedTasks}</Text>
            <Text style={styles.progressLabel}>görev</Text>
          </View>
          
          <View style={styles.badgeProgressContainer}>
            <Text style={styles.badgeLabel}>
              Yardımsever Rozeti: {progress.completedTasks}/5 görev
            </Text>
            <ProgressBar 
              progress={calculateBadgeProgress('helper_bronze')} 
              color={colors.primary} 
              style={styles.progressBar} 
            />
          </View>
        </View>

        {/* Görev Serisi */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Flame size={18} color="#FF9800" />
            <Text style={styles.sectionTitle}>Görev Serisi</Text>
          </View>
          
          <View style={styles.progressValue}>
            <Text style={styles.progressValueText}>{progress.totalStreakDays}</Text>
            <Text style={styles.progressLabel}>gün</Text>
          </View>
          
          {progress.totalStreakDays > 0 && (
            <View style={styles.streakMilestones}>
              {[3, 5, 7, 14, 30].map(milestone => (
                <View 
                  key={milestone} 
                  style={[
                    styles.milestoneDot, 
                    progress.totalStreakDays >= milestone && styles.completedMilestone
                  ]}
                >
                  {progress.totalStreakDays >= milestone && (
                    <View style={styles.checkMark} />
                  )}
                </View>
              ))}
            </View>
          )}
          
          <Text style={styles.streakInfo}>
            Art arda görev tamamladığınızda seri oluşturarak fazladan XP kazanırsınız!
          </Text>
        </View>

        {/* Kategori Bazında İlerleme */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Star size={18} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Kategori Rozetleri</Text>
          </View>
          
          {Object.entries(progress.currentTasksCount).map(([category, count]) => (
            <View key={category} style={styles.categoryProgress}>
              <Text style={styles.categoryLabel}>{getCategoryLabel(category)}</Text>
              <Text style={styles.categoryCount}>{count}/10</Text>
              <ProgressBar 
                progress={Math.min(count / 10, 1)} 
                color={getCategoryColor(category)} 
                style={styles.progressBar} 
              />
            </View>
          ))}
          
          <Text style={styles.categoryInfo}>
            Her kategoride 10 görev tamamladığınızda özel rozetler kazanırsınız!
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h6,
    color: colors.text,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  progressSection: {
    marginVertical: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  progressValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  progressValueText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  progressLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  badgeProgressContainer: {
    marginTop: spacing.xs,
  },
  badgeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.pill,
  },
  streakMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  milestoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedMilestone: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  checkMark: {
    width: 6,
    height: 6,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  streakInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryLabel: {
    ...typography.body2,
    color: colors.text,
    width: 80,
  },
  categoryCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
    width: 40,
    textAlign: 'right',
  },
  categoryInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
}); 