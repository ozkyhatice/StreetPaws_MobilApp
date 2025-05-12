import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Text, Chip, Surface, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { Badge, BADGES } from '../types/badge';
import { BadgeItem } from './BadgeItem';
import { colors, typography, spacing, borderRadius, shadows } from '../config/theme';
import { BookOpen, X, Award } from 'lucide-react-native';

interface BadgeCollectionProps {
  badges: Badge[];
  loading?: boolean;
  showAllBadges?: boolean;
  onBadgePress?: (badge: Badge) => void;
}

export const BadgeCollection = ({
  badges = [],
  loading = false,
  showAllBadges = false,
  onBadgePress,
}: BadgeCollectionProps) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  
  const allBadges = showAllBadges ? BADGES : badges;
  
  const filteredBadges = filterLevel 
    ? allBadges.filter(badge => badge.level === filterLevel)
    : allBadges;
  
  const handleBadgePress = (badge: Badge) => {
    setSelectedBadge(badge);
    if (onBadgePress) {
      onBadgePress(badge);
    }
  };
  
  const closeModal = () => {
    setSelectedBadge(null);
  };
  
  const badgeLevels = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BRONZE': return '#CD7F32';
      case 'SILVER': return '#C0C0C0';
      case 'GOLD': return '#FFD700';
      case 'PLATINUM': return '#E5E4E2';
      case 'DIAMOND': return '#B9F2FF';
      default: return colors.primary;
    }
  };
  
  const renderLevelFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <Chip 
          selected={filterLevel === null}
          onPress={() => setFilterLevel(null)}
          style={styles.filterChip}
        >
          Tümü
        </Chip>
        
        {badgeLevels.map(level => (
          <Chip
            key={level}
            selected={filterLevel === level}
            onPress={() => setFilterLevel(level)}
            style={[
              styles.filterChip, 
              { backgroundColor: filterLevel === level ? getLevelColor(level) : colors.surface }
            ]}
            textStyle={{ color: filterLevel === level ? colors.white : colors.text }}
          >
            {level}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {showAllBadges && renderLevelFilter()}
      
      <FlatList
        data={filteredBadges}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.badgeList}
        renderItem={({ item }) => (
          <View style={styles.badgeItem}>
            <BadgeItem 
              badge={item}
              onPress={handleBadgePress}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz rozet kazanılmamış</Text>
          </View>
        }
      />
      
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            
            {selectedBadge && (
              <View style={styles.badgeDetailContainer}>
                <View style={[styles.badgeIconContainer, { backgroundColor: getLevelColor(selectedBadge.level) + '30' }]}>
                  <Award size={48} color={getLevelColor(selectedBadge.level)} />
                  <Text style={styles.badgeDetailIcon}>{selectedBadge.icon}</Text>
                </View>
                
                <Title style={styles.badgeDetailTitle}>{selectedBadge.name}</Title>
                <Paragraph style={styles.badgeDetailDescription}>{selectedBadge.description}</Paragraph>
                
                <Surface style={styles.badgeInfoContainer}>
                  <View style={styles.badgeInfoItem}>
                    <Text style={styles.badgeInfoLabel}>Seviye</Text>
                    <Chip style={{ backgroundColor: getLevelColor(selectedBadge.level) }}>
                      <Text style={{ color: colors.white }}>{selectedBadge.level}</Text>
                    </Chip>
                  </View>
                  
                  <View style={styles.badgeInfoItem}>
                    <Text style={styles.badgeInfoLabel}>Gereken XP</Text>
                    <Text style={styles.badgeInfoValue}>{selectedBadge.requiredXP} XP</Text>
                  </View>
                  
                  {selectedBadge.requiredTasks && (
                    <View style={styles.badgeInfoItem}>
                      <Text style={styles.badgeInfoLabel}>Gereken Görevler</Text>
                      <Text style={styles.badgeInfoValue}>{selectedBadge.requiredTasks}</Text>
                    </View>
                  )}
                  
                  {selectedBadge.unlockedAt && (
                    <View style={styles.badgeInfoItem}>
                      <Text style={styles.badgeInfoLabel}>Kazanma Tarihi</Text>
                      <Text style={styles.badgeInfoValue}>
                        {new Date(selectedBadge.unlockedAt).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                  )}
                </Surface>
                
                {!selectedBadge.unlockedAt && (
                  <View style={styles.tipsContainer}>
                    <View style={styles.tipIcon}>
                      <BookOpen size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.tipText}>
                      Bu rozeti kazanmak için daha fazla görev tamamlayın ve XP toplayın!
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  badgeList: {
    padding: spacing.sm,
  },
  badgeItem: {
    width: '50%',
    padding: spacing.xxs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  filterScrollContent: {
    paddingVertical: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: spacing.lg,
    borderRadius: borderRadius.medium,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  badgeDetailContainer: {
    alignItems: 'center',
  },
  badgeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badgeDetailIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: 24,
  },
  badgeDetailTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  badgeDetailDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  badgeInfoContainer: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.background,
  },
  badgeInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgeInfoLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  badgeInfoValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary + '10',
  },
  tipIcon: {
    marginRight: spacing.sm,
  },
  tipText: {
    ...typography.body2,
    color: colors.primary,
    flex: 1,
  },
}); 