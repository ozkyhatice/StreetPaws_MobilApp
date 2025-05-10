import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Button, Dialog, Portal, TextInput, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { TaskCompletionService } from '../services/taskCompletionService';
import { TaskVerification, TaskVerificationStatus } from '../types/taskVerification';
import { Task } from '../types/task';
import { CheckCircle, XCircle, User, Image as ImageIcon, MapPin, FileText } from 'lucide-react-native';

interface VerificationItem {
  verification: TaskVerification;
  task: Task;
}

export default function VerificationsScreen() {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<VerificationItem | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const navigation = useNavigation();
  const taskCompletionService = TaskCompletionService.getInstance();

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const pendingVerifications = await taskCompletionService.getPendingVerifications();
      setVerifications(pendingVerifications);
    } catch (error) {
      console.error('Error loading verifications:', error);
      Alert.alert('Hata', 'Doğrulamalar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationPress = (item: VerificationItem) => {
    setSelectedVerification(item);
    setDialogVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedVerification || !user) return;

    try {
      setSubmitting(true);
      await taskCompletionService.approveTaskCompletion(
        selectedVerification.verification.id,
        user.uid,
        reviewNote
      );
      
      setDialogVisible(false);
      setSelectedVerification(null);
      setReviewNote('');
      
      Alert.alert('Başarılı', 'Görev tamamlama onaylandı ve kullanıcı XP kazandı');
      loadVerifications();
    } catch (error) {
      console.error('Error approving task:', error);
      Alert.alert('Hata', 'Görev onaylanırken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const showRejectDialog = () => {
    setDialogVisible(false);
    setRejectDialogVisible(true);
  };

  const handleReject = async () => {
    if (!selectedVerification || !user) return;
    
    if (!rejectReason.trim()) {
      Alert.alert('Hata', 'Lütfen red sebebi belirtin');
      return;
    }

    try {
      setSubmitting(true);
      await taskCompletionService.rejectTaskCompletion(
        selectedVerification.verification.id,
        user.uid,
        rejectReason
      );
      
      setRejectDialogVisible(false);
      setSelectedVerification(null);
      setRejectReason('');
      
      Alert.alert('Bilgi', 'Görev tamamlama reddedildi');
      loadVerifications();
    } catch (error) {
      console.error('Error rejecting task:', error);
      Alert.alert('Hata', 'Görev reddedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const renderVerificationItem = ({ item }: { item: VerificationItem }) => {
    const { verification, task } = item;
    
    return (
      <Card style={styles.card} onPress={() => handleVerificationPress(item)}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.taskTitle}>{task.title}</Text>
            <Chip 
              icon="clock-outline" 
              mode="outlined" 
              style={styles.statusChip}
            >
              Onay Bekliyor
            </Chip>
          </View>
          
          <View style={styles.userInfo}>
            <User size={16} color="#666" />
            <Text variant="bodyMedium" style={styles.userText}>
              Kullanıcı: {verification.userId}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <ImageIcon size={16} color="#666" />
              <Text variant="bodyMedium">
                {verification.imageUrl ? 'Fotoğraf mevcut' : 'Fotoğraf yok'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <MapPin size={16} color="#666" />
              <Text variant="bodyMedium">
                {verification.location ? 'Konum doğrulandı' : 'Konum yok'}
              </Text>
            </View>
          </View>
          
          {verification.note && (
            <View style={styles.noteContainer}>
              <FileText size={16} color="#666" />
              <Text variant="bodyMedium" numberOfLines={2} style={styles.noteText}>
                {verification.note}
              </Text>
            </View>
          )}
          
          <View style={styles.dateContainer}>
            <Text variant="bodySmall" style={styles.dateText}>
              Tarih: {new Date(verification.createdAt).toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleMedium" style={styles.emptyText}>
        Onay bekleyen görev tamamlama yok
      </Text>
      <Button 
        mode="outlined" 
        onPress={loadVerifications}
        style={styles.refreshButton}
      >
        Yenile
      </Button>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={verifications}
        renderItem={renderVerificationItem}
        keyExtractor={(item) => item.verification.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
      />
      
      {/* Onaylama Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Görev Tamamlama Detayı</Dialog.Title>
          <Dialog.Content>
            {selectedVerification && (
              <>
                <Text variant="titleMedium" style={styles.dialogTitle}>
                  {selectedVerification.task.title}
                </Text>
                
                {selectedVerification.verification.imageUrl && (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: selectedVerification.verification.imageUrl }} 
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                {selectedVerification.verification.note && (
                  <View style={styles.dialogSection}>
                    <Text variant="bodyMedium" style={styles.sectionTitle}>Not:</Text>
                    <Text variant="bodyMedium">{selectedVerification.verification.note}</Text>
                  </View>
                )}
                
                {selectedVerification.verification.location && (
                  <View style={styles.dialogSection}>
                    <Text variant="bodyMedium" style={styles.sectionTitle}>Konum:</Text>
                    <Text variant="bodyMedium">
                      Lat: {selectedVerification.verification.location.latitude.toFixed(6)}, 
                      Lng: {selectedVerification.verification.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}
                
                <TextInput
                  mode="outlined"
                  label="İnceleme Notu (isteğe bağlı)"
                  value={reviewNote}
                  onChangeText={setReviewNote}
                  multiline
                  numberOfLines={3}
                  style={styles.reviewInput}
                />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDialogVisible(false)} 
              disabled={submitting}
            >
              İptal
            </Button>
            <Button 
              onPress={showRejectDialog} 
              textColor="#F44336" 
              disabled={submitting}
            >
              Reddet
            </Button>
            <Button 
              onPress={handleApprove} 
              loading={submitting}
              disabled={submitting}
            >
              Onayla
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Reddetme Dialog */}
      <Portal>
        <Dialog visible={rejectDialogVisible} onDismiss={() => setRejectDialogVisible(false)}>
          <Dialog.Title>Görevi Reddet</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Lütfen reddetme sebebini belirtin. Bu bilgi kullanıcıya iletilecektir.
            </Text>
            <TextInput
              mode="outlined"
              label="Red Sebebi"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              style={styles.reviewInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setRejectDialogVisible(false)} 
              disabled={submitting}
            >
              İptal
            </Button>
            <Button 
              onPress={handleReject} 
              textColor="#F44336"
              loading={submitting}
              disabled={submitting}
            >
              Reddet
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userText: {
    marginLeft: 8,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  noteContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  noteText: {
    marginLeft: 8,
    flex: 1,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  refreshButton: {
    width: 120,
  },
  dialogTitle: {
    marginBottom: 16,
  },
  imageContainer: {
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dialogSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reviewInput: {
    marginTop: 16,
  },
}); 