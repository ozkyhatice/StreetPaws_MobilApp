import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Button, Text, TextInput, Divider, Surface, Card, Title } from 'react-native-paper';
import { Task } from '../types/task';
import { colors, typography, spacing, borderRadius, shadows } from '../config/theme';
import { Check, X, Clock, User, Calendar, FileText } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// Güvenli tarih formatlama yardımcı fonksiyonu
const formatTimeAgo = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'Belirtilmemiş';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'Geçersiz Tarih';
    
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: tr,
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Geçersiz Tarih';
  }
};

interface TaskApprovalFormProps {
  task: Task;
  onApprove: (task: Task, note?: string) => void;
  onReject: (task: Task, reason: string) => void;
  loading?: boolean;
}

export function TaskApprovalForm({
  task,
  onApprove,
  onReject,
  loading = false,
}: TaskApprovalFormProps) {
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  
  const handleApprove = () => {
    onApprove(task, note);
  };
  
  const handleReject = () => {
    if (rejectionReason.trim() === '') {
      alert('Lütfen bir ret nedeni belirtin');
      return;
    }
    onReject(task, rejectionReason);
  };
  
  const timeAgo = task.completedBy?.completedAt ? formatTimeAgo(task.completedBy.completedAt) : 'Belirtilmemiş';
    
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.completionCard}>
        <Card.Content>
          <View style={styles.completionHeader}>
            <Clock size={20} color={colors.warning} />
            <Text style={styles.awaitingApprovalText}>Onay Bekliyor</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.completionInfo}>
            <View style={styles.infoRow}>
              <User size={18} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Tamamlayan:</Text>
              <Text style={styles.infoValue}>{task.completedBy?.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Calendar size={18} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoLabel}>Tamamlanma Zamanı:</Text>
              <Text style={styles.infoValue}>{timeAgo}</Text>
            </View>
          </View>
          
          {task.verifications?.some(v => v.type === 'PHOTO') && task.images && task.images.length > 0 && (
            <View style={styles.imagesContainer}>
              <Text style={styles.imagesTitle}>Doğrulama Fotoğrafları</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {task.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.verificationImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}
          
          {task.verifications?.some(v => v.type === 'LOCATION') && task.location && (
            <View style={styles.locationContainer}>
              <Text style={styles.locationTitle}>Doğrulanan Konum</Text>
              <Text style={styles.locationText}>{
                typeof task.location === 'string' 
                  ? task.location 
                  : task.location.address
              }</Text>
            </View>
          )}
        </Card.Content>
      </Card>
      
      {!isRejecting ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Onay Notu (İsteğe Bağlı)</Text>
            <TextInput
              mode="outlined"
              placeholder="Görevi onaylarken bir not ekleyin"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon={({ size, color }) => <Check size={size} color={color} />}
              onPress={handleApprove}
              loading={loading}
              disabled={loading}
              style={styles.approveButton}
            >
              Görevi Onayla
            </Button>
            
            <Button
              mode="outlined"
              icon={({ size, color }) => <X size={size} color={color} />}
              onPress={() => setIsRejecting(true)}
              disabled={loading}
              style={styles.rejectButton}
              textColor={colors.error}
            >
              Reddet
            </Button>
          </View>
        </>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ret Nedeni</Text>
            <TextInput
              mode="outlined"
              placeholder="Görevi reddetme nedeninizi belirtin"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
              error={rejectionReason.trim() === ''}
            />
            {rejectionReason.trim() === '' && (
              <Text style={styles.errorText}>Ret nedeni belirtilmelidir</Text>
            )}
          </View>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon={({ size, color }) => <X size={size} color={color} />}
              onPress={handleReject}
              loading={loading}
              disabled={loading || rejectionReason.trim() === ''}
              style={[styles.rejectButton, { backgroundColor: colors.error }]}
              textColor={colors.white}
            >
              Reddet
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => setIsRejecting(false)}
              disabled={loading}
              style={styles.backButton}
            >
              Geri Dön
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  completionCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  awaitingApprovalText: {
    ...typography.subtitle1,
    color: colors.warning,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  completionInfo: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoIcon: {
    marginRight: spacing.sm,
  },
  infoLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginRight: spacing.sm,
    width: 120,
  },
  infoValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  imagesContainer: {
    marginBottom: spacing.md,
  },
  imagesTitle: {
    ...typography.subtitle2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  verificationImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.medium,
    marginRight: spacing.sm,
  },
  locationContainer: {
    marginBottom: spacing.md,
  },
  locationTitle: {
    ...typography.subtitle2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  locationText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  approveButton: {
    flex: 1,
    marginRight: spacing.sm,
    backgroundColor: colors.success,
  },
  rejectButton: {
    flex: 1,
    marginLeft: spacing.sm,
    borderColor: colors.error,
  },
  backButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xxs,
  },
}); 