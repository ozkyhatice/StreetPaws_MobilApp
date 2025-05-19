import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Dialog, Portal, TextInput, IconButton } from 'react-native-paper';
import { colors } from '../../config/theme';
import { StatsService, InfoCard } from '../../services/statsService';
import { useAuth } from '../../hooks/useAuth';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

export type InfoSectionRefHandle = {
  fetchInfoCards: () => Promise<void>;
};

export const InfoSection = forwardRef<InfoSectionRefHandle, {}>((props, ref) => {
  const { user } = useAuth();
  const [infoCards, setInfoCards] = useState<InfoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<InfoCard | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('1');

  const isAdmin = user?.role === 'admin';

  // Expose fetchInfoCards method to parent component
  useImperativeHandle(ref, () => ({
    fetchInfoCards: async () => {
      await fetchInfoCards();
    },
  }));

  useEffect(() => {
    fetchInfoCards();
  }, []);

  const fetchInfoCards = async () => {
    try {
      setLoading(true);
      const statsService = StatsService.getInstance();
      const cards = await statsService.getInfoCards();
      setInfoCards(cards);
    } catch (error) {
      console.error('Error fetching info cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const showDialog = (card?: InfoCard) => {
    if (card) {
      // Edit mode
      setEditingCard(card);
      setTitle(card.title);
      setContent(card.content);
      setPriority(card.priority !== undefined ? card.priority.toString() : '1');
    } else {
      // Add mode
      setEditingCard(null);
      setTitle('');
      setContent('');
      setPriority('1');
    }
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Hata', 'Lütfen başlık ve içerik alanlarını doldurun.');
      return;
    }

    try {
      const statsService = StatsService.getInstance();
      
      if (editingCard) {
        // Update existing card
        await statsService.updateInfoCard(editingCard.id, {
          title: title.trim(),
          content: content.trim(),
          priority: parseInt(priority, 10) || 1
        });
      } else {
        // Add new card
        if (!user?.uid) {
          Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı.');
          return;
        }
        await statsService.addInfoCard(
          user.uid, 
          title.trim(), 
          content.trim(),
          parseInt(priority, 10) || 1
        );
      }
      
      hideDialog();
      fetchInfoCards();
    } catch (error) {
      console.error('Error saving info card:', error);
      Alert.alert('Hata', 'Bilgi kartı kaydedilirken bir hata oluştu.');
    }
  };

  const handleDelete = async (cardId: string) => {
    Alert.alert(
      'Onay',
      'Bu bilgi kartını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              const statsService = StatsService.getInstance();
              await statsService.deleteInfoCard(cardId);
              fetchInfoCards();
            } catch (error) {
              console.error('Error deleting info card:', error);
              Alert.alert('Hata', 'Bilgi kartı silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.infoSection}>
      <View style={styles.headerRow}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Güncel Bilgiler</Text>
        
        {isAdmin && (
          <TouchableOpacity onPress={() => showDialog()} style={styles.addButton}>
            <AntDesign name="pluscircle" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : infoCards.length === 0 ? (
        <View style={styles.cardWrapper}>
          <Card style={styles.infoCard} mode="elevated">
            <Card.Content>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Güncel bilgi bulunmamaktadır.
                {isAdmin && ' Eklemek için sağ üstteki + butonuna tıklayın.'}
              </Text>
            </Card.Content>
          </Card>
        </View>
      ) : (
        infoCards.map((card) => (
          <View key={card.id} style={styles.cardWrapper}>
            <Card style={styles.infoCard} mode="elevated">
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text variant="titleMedium" style={styles.cardTitle}>{card.title}</Text>
                  
                  {isAdmin && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity 
                        onPress={() => showDialog(card)} 
                        style={styles.editButton}
                      >
                        <MaterialIcons name="edit" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => handleDelete(card.id)} 
                        style={styles.deleteButton}
                      >
                        <MaterialIcons name="delete" size={18} color="#ff3b30" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                <Text variant="bodyMedium" style={styles.cardText}>
                  {card.content}
                </Text>
              </Card.Content>
            </Card>
          </View>
        ))
      )}
      
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>{editingCard ? 'Bilgi Güncelle' : 'Yeni Bilgi Ekle'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Başlık"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="İçerik"
              value={content}
              onChangeText={setContent}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            <TextInput
              label="Öncelik (1-10)"
              value={priority}
              onChangeText={setPriority}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>İptal</Button>
            <Button onPress={handleSave} mode="contained">Kaydet</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
});

const styles = StyleSheet.create({
  infoSection: {
    padding: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  addButton: {
    padding: 5,
  },
  infoCard: {
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  cardText: {
    color: colors.textSecondary,
  },
  loadingContainer: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
  },
  editButton: {
    marginRight: 10,
  },
  deleteButton: {
    marginLeft: 5,
  },
  input: {
    marginBottom: 10,
  },
  cardWrapper: {
    borderRadius: 12,
    marginBottom: 15,
  },
}); 