import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Text, Avatar, Card } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { UserService } from '../services/userService';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { User } from '../types/user';
import { Mail, Phone, MapPin, Info, Home, Globe, Award } from 'lucide-react-native';

interface UserProfileScreenRouteParams {
  userId: string;
}

type UserProfileScreenRouteProp = RouteProp<any, 'UserProfile'>;

const UserProfileScreen: React.FC = () => {
  const route = useRoute<UserProfileScreenRouteProp>();
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await UserService.getInstance().getUserById(userId);
        setUser(userData);
      } catch (e) {
        setError('Kullanıcı bulunamadı.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Kullanıcı tipi etiketi
  const getUserTypeLabel = (type?: string) => {
    if (type === 'business') return 'İşletme';
    if (type === 'healthcare') return 'Sağlık Kurumu';
    if (type === 'veteriner') return 'Veteriner';
    return 'Bireysel';
  };

  const stats = user?.stats || {};

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text>Yükleniyor...</Text></View>
    );
  }
  if (error || !user) {
    return (
      <View style={styles.centered}><Text style={styles.errorText}>{error || 'Kullanıcı bulunamadı.'}</Text></View>
    );
  }

  return (
    <ScrollView style={{flex:1, backgroundColor: colors.background}} contentContainerStyle={{paddingBottom: 40}}>
      <View style={styles.headerBg}>
        <View style={styles.avatarWrapper}>
          {user.photoURL ? (
            <Avatar.Image source={{ uri: user.photoURL }} size={110} style={styles.avatarBig} />
          ) : (
            <Avatar.Icon icon="account" size={110} style={styles.avatarBig} />
          )}
        </View>
      </View>
      <Card style={styles.cardModern}>
        <View style={{ height: 24 }} />
        <View style={styles.nameTypeRow}>
          <Text style={styles.displayNameModern}>{user.displayName || user.username || 'Kullanıcı'}</Text>
          {user.userType && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{getUserTypeLabel(user.userType)}</Text>
            </View>
          )}
        </View>
        <View style={styles.infoRowModern}>
          {user.email && <View style={styles.infoItem}><Mail size={18} color={colors.primary} /><Text style={styles.infoValueModern}>{user.email}</Text></View>}
          {user.phoneNumber && <View style={styles.infoItem}><Phone size={18} color={colors.primary} /><Text style={styles.infoValueModern}>{user.phoneNumber}</Text></View>}
          {user.city && <View style={styles.infoItem}><MapPin size={18} color={colors.primary} /><Text style={styles.infoValueModern}>{user.city}</Text></View>}
        </View>
        {user.bio && <View style={styles.infoItem}><Info size={18} color={colors.primary} /><Text style={styles.infoValueModern}>{user.bio}</Text></View>}
        {(user.businessName || user.businessType || user.address || user.website || user.description) && (
          <View style={styles.businessSection}>
            {user.businessName && <View style={styles.infoItem}><Home size={18} color={colors.warning} /><Text style={styles.infoValueModern}>{user.businessName}</Text></View>}
            {user.businessType && <View style={styles.infoItem}><Award size={18} color={colors.warning} /><Text style={styles.infoValueModern}>{user.businessType}</Text></View>}
            {user.address && <View style={styles.infoItem}><MapPin size={18} color={colors.warning} /><Text style={styles.infoValueModern}>{user.address}</Text></View>}
            {user.website && <View style={styles.infoItem}><Globe size={18} color={colors.warning} /><Text style={styles.infoValueModern}>{user.website}</Text></View>}
            {user.description && <View style={styles.infoItem}><Info size={18} color={colors.warning} /><Text style={styles.infoValueModern}>{user.description}</Text></View>}
          </View>
        )}
        <View style={{ height: 18 }} />
        <View style={styles.statsModernRow}>
          <View style={[styles.statModernBox, {backgroundColor: '#F3F6FF'}]}><Text style={styles.statModernValue}>{(stats as any)?.tasksCompleted ?? 0}</Text><Text style={styles.statModernLabel}>Görev</Text></View>
          <View style={[styles.statModernBox, {backgroundColor: '#FFF7E6'}]}><Text style={styles.statModernValue}>{(stats as any)?.volunteeredHours ?? 0}</Text><Text style={styles.statModernLabel}>Gönüllü Saat</Text></View>
          <View style={[styles.statModernBox, {backgroundColor: '#E6FFF2'}]}><Text style={styles.statModernValue}>{(stats as any)?.donationsCount ?? 0}</Text><Text style={styles.statModernLabel}>Bağış</Text></View>
        </View>
        <View style={styles.statsModernRow}>
          <View style={[styles.statModernBox, {backgroundColor: '#E6F7FF'}]}><Text style={styles.statModernValue}>{(stats as any)?.xpPoints ?? 0}</Text><Text style={styles.statModernLabel}>XP</Text></View>
          <View style={[styles.statModernBox, {backgroundColor: '#F9E6FF'}]}><Text style={styles.statModernValue}>{(stats as any)?.level ?? 1}</Text><Text style={styles.statModernLabel}>Seviye</Text></View>
          {user.rating !== undefined && <View style={[styles.statModernBox, {backgroundColor: '#FFF0F0'}]}><Text style={styles.statModernValue}>{user.rating?.toFixed(1)}</Text><Text style={styles.statModernLabel}>Puan</Text></View>}
        </View>
        {user.badges && user.badges.length > 0 && (
          <View style={styles.badgesModernSection}>
            <Text style={styles.badgesTitle}>Rozetler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesModernRow}>
              {user.badges.map((badge, idx) => (
                <View key={idx} style={styles.badgeModernBox}>
                  <Image source={(badge as any).iconUrl ? { uri: (badge as any).iconUrl } : (badge as any).icon ? { uri: (badge as any).icon } : require('../assets/paw.png')} style={styles.badgeModernIcon} />
                  <Text style={styles.badgeModernLabel}>{badge.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  card: {
    borderRadius: borderRadius.large,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerText: {
    marginLeft: spacing.lg,
  },
  displayName: {
    fontSize: typography.h3.fontSize,
    fontWeight: 'bold',
    color: colors.text,
  },
  userType: {
    fontSize: typography.body2.fontSize,
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoSection: {
    marginTop: spacing.md,
  },
  label: {
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  value: {
    color: colors.text,
    marginBottom: spacing.xs,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statsTitle: {
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    fontSize: typography.body1.fontSize,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  badgesSection: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
  },
  badgesTitle: {
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    fontSize: typography.body1.fontSize,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badgeBox: {
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.sm,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4,
    backgroundColor: colors.surfaceVariant,
  },
  badgeLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 60,
  },
  headerBg: {
    height: 120,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -55,
  },
  avatarWrapper: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
    marginTop: 8,
  },
  avatarBig: {
    borderWidth: 4,
    borderColor: colors.background,
    backgroundColor: colors.surface,
    elevation: 4,
  },
  cardModern: {
    borderRadius: borderRadius.large,
    marginTop: 60,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    paddingTop: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: colors.surface,
  },
  nameTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  displayNameModern: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  typeBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
  },
  typeBadgeText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  infoRowModern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 12,
    marginBottom: 6,
  },
  infoValueModern: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  businessSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.medium,
  },
  statsModernRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  statModernBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: spacing.md,
    marginHorizontal: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statModernValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.text,
  },
  statModernLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgesModernSection: {
    marginTop: spacing.md,
  },
  badgesModernRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  badgeModernBox: {
    alignItems: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 8,
    minWidth: 60,
  },
  badgeModernIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4,
    backgroundColor: colors.surface,
  },
  badgeModernLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 60,
  },
});

export default UserProfileScreen; 