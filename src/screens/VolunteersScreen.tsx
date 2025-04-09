import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Text, Card, Button, Avatar, Searchbar, Chip, Divider } from 'react-native-paper';
import { MapPin, Star, Clock, Award, Loader, MessageCircle, Filter } from 'lucide-react-native';
import { colors, spacing, shadows, borderRadius, typography } from '../config/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Mock volunteer data
const mockVolunteers = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    avatar: 'https://picsum.photos/id/1/200',
    bio: 'Hayvan sever ve 3 yıllık StreetPaws gönüllüsü',
    level: 5,
    xp: 2500,
    completedTasks: 42,
    skills: ['Besleme', 'Veteriner', 'Barınak'],
    location: 'İstanbul, Kadıköy',
    badge: 'Barınak Kahramanı'
  },
  {
    id: '2',
    name: 'Ayşe Kaya',
    avatar: 'https://picsum.photos/id/2/200',
    bio: 'Veteriner hekim ve sokak hayvanları koruyucusu',
    level: 8,
    xp: 4200,
    completedTasks: 75,
    skills: ['Sağlık', 'İlkyardım', 'Eğitim'],
    location: 'İstanbul, Beşiktaş',
    badge: 'Veteriner Uzmanı'
  },
  {
    id: '3',
    name: 'Mehmet Demir',
    avatar: 'https://picsum.photos/id/3/200',
    bio: 'Barınak görevlisi ve sokak hayvanları için çalışan aktivist',
    level: 6,
    xp: 3100,
    completedTasks: 51,
    skills: ['Barınak', 'Besleme', 'Tasarım'],
    location: 'İstanbul, Üsküdar',
    badge: 'Hayvan Dostu'
  },
  {
    id: '4',
    name: 'Zeynep Çelik',
    avatar: 'https://picsum.photos/id/4/200',
    bio: 'Çevreci ve hayvan hakları savunucusu',
    level: 4,
    xp: 1800,
    completedTasks: 28,
    skills: ['Organizasyon', 'Sosyal Medya', 'Eğitim'],
    location: 'İstanbul, Bakırköy',
    badge: 'Sosyal Medya Uzmanı'
  },
  {
    id: '5',
    name: 'Can Aydın',
    avatar: 'https://picsum.photos/id/5/200',
    bio: 'Hayvansever mühendis ve hafta sonları gönüllü',
    level: 3,
    xp: 1200,
    completedTasks: 18,
    skills: ['Bakım', 'Tasarım', 'İnşaat'],
    location: 'İstanbul, Beylikdüzü',
    badge: 'Yeni Gönüllü'
  }
];

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

export default function VolunteersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const filteredVolunteers = mockVolunteers
    .filter(v => 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(v => selectedSkill ? v.skills.includes(selectedSkill) : true);
  
  const allSkills = [...new Set(mockVolunteers.flatMap(v => v.skills))];
  
  const handleSearch = (query) => {
    setIsLoading(true);
    setSearchQuery(query);
    // Simüle edilmiş arama gecikmesi
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const getBadgeColor = (level) => {
    if (level >= 7) return colors.secondary;
    if (level >= 5) return colors.primary;
    if (level >= 3) return colors.info;
    return colors.warning;
  };

  const renderVolunteerCard = ({ item }) => (
    <Card 
      style={styles.card}
      mode="elevated"
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Avatar.Image 
            source={{ uri: item.avatar }} 
            size={70} 
            style={styles.avatar}
          />
          <View style={[styles.levelBadge, { backgroundColor: getBadgeColor(item.level) }]}>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.volunteerName}>{item.name}</Text>
          
          <View style={styles.badgeContainer}>
            <Award size={14} color={getBadgeColor(item.level)} />
            <Text style={[styles.badgeText, { color: getBadgeColor(item.level) }]}>
              {item.badge}
            </Text>
          </View>
          
          <View style={styles.locationContainer}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Star size={16} color={colors.warning} />
          <Text style={styles.statText}>{item.xp} XP</Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={16} color={colors.primary} />
          <Text style={styles.statText}>{item.completedTasks} Görev</Text>
        </View>
      </View>
      
      <View style={styles.skillContainer}>
        {item.skills.map(skill => (
          <Chip 
            key={skill} 
            style={[
              styles.skillChip,
              selectedSkill === skill && styles.selectedSkillChip
            ]}
            textStyle={[
              styles.skillChipText,
              selectedSkill === skill && styles.selectedSkillText
            ]}
            onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
          >
            {skill}
          </Chip>
        ))}
      </View>
      
      <Button 
        mode="contained" 
        style={styles.connectButton}
        icon={({size, color}) => <MessageCircle size={18} color={color} />}
        buttonColor={colors.primary}
      >
        İletişime Geç
      </Button>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../assets/paw.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Gönüllü Bulunamadı</Text>
      <Text style={styles.emptyText}>
        Arama kriterlerinize uygun gönüllü bulunamadı. Lütfen farklı bir arama deneyin.
      </Text>
      <Button 
        mode="outlined" 
        style={styles.resetButton}
        onPress={() => {
          setSearchQuery('');
          setSelectedSkill(null);
        }}
      >
        Filtreleri Temizle
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Gönüllüler</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Gönüllü veya beceri ara..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={colors.primary}
          loading={isLoading}
        />
      </View>
      
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersScroll}
        >
          <Chip
            mode="outlined"
            style={[styles.filterChip, !selectedSkill && styles.activeFilterChip]}
            onPress={() => setSelectedSkill(null)}
            textStyle={!selectedSkill ? styles.activeFilterText : styles.filterChipText}
          >
            Tümü
          </Chip>
          {allSkills.map(skill => (
            <Chip
              key={skill}
              mode="outlined"
              style={[
                styles.filterChip, 
                selectedSkill === skill && styles.activeFilterChip
              ]}
              onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
              textStyle={
                selectedSkill === skill 
                  ? styles.activeFilterText 
                  : styles.filterChipText
              }
            >
              {skill}
            </Chip>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredVolunteers}
        renderItem={renderVolunteerCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        initialNumToRender={3}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        // Tab bar için ekstra padding ekliyoruz
        contentInset={{ bottom: 80 }}
        contentInsetAdjustmentBehavior="automatic"
        ListFooterComponent={<View style={{ height: 90 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  searchbar: {
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    elevation: 2,
    height: 48,
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.1)' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 3 : undefined,
  },
  filtersContainer: {
    marginBottom: spacing.md,
    paddingLeft: spacing.screenPadding,
  },
  filtersScroll: {
    paddingRight: spacing.screenPadding + spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  filterChipText: {
    color: colors.textSecondary,
  },
  activeFilterChip: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  activeFilterText: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.1)' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 3 : undefined,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primaryLight + '30',
  },
  headerInfo: {
    flex: 1,
  },
  volunteerName: {
    ...typography.subtitle1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xxs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...typography.caption,
    marginLeft: spacing.xxs,
    color: colors.textSecondary,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.sm,
    backgroundColor: colors.divider,
  },
  bio: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  statText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
    marginLeft: spacing.xxs,
  },
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  skillChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.primaryLight + '15',
  },
  skillChipText: {
    ...typography.caption,
    color: colors.primary,
  },
  selectedSkillChip: {
    backgroundColor: colors.primary + '30',
  },
  selectedSkillText: {
    color: colors.primary,
    fontWeight: '600',
  },
  connectButton: {
    borderRadius: borderRadius.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyImage: {
    width: 100,
    height: 100,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body2,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  resetButton: {
    width: 200,
    borderColor: colors.primary,
  },
});
