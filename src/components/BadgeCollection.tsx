import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Badge } from '../types/badge';
import BadgeItem from './BadgeItem';

interface BadgeCollectionProps {
  badges: Badge[];
  newBadges?: Badge[];
}

const BadgeCollection: React.FC<BadgeCollectionProps> = ({ badges, newBadges = [] }) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const handleBadgePress = (badge: Badge) => {
    setSelectedBadge(badge);
  };

  const closeModal = () => {
    setSelectedBadge(null);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Rozetlerim ({badges.length})
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {badges.map((badge) => (
          <BadgeItem
            key={badge.id}
            badge={badge}
            isNew={newBadges.some(b => b.id === badge.id)}
            onPress={() => handleBadgePress(badge)}
          />
        ))}
      </ScrollView>

      <Modal
        visible={!!selectedBadge}
        onDismiss={closeModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedBadge && (
              <>
                <BadgeItem badge={selectedBadge} />
                <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                <Text style={styles.modalDescription}>{selectedBadge.description}</Text>
                {selectedBadge.unlockedAt && (
                  <Text style={styles.modalDate}>
                    Kazanıldı: {selectedBadge.unlockedAt.toLocaleDateString('tr-TR')}
                  </Text>
                )}
                <Button
                  mode="contained"
                  onPress={closeModal}
                  style={styles.closeButton}
                >
                  Kapat
                </Button>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    marginLeft: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    color: '#666666',
  },
  modalDate: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  closeButton: {
    marginTop: 24,
  },
});

export default BadgeCollection; 