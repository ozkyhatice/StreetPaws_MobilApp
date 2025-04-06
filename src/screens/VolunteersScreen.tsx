import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Button, Avatar, Searchbar, Chip } from 'react-native-paper';
import { MapPin, Star, Clock, Award } from 'lucide-react-native';

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
    location: 'İstanbul, Kadıköy'
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
    location: 'İstanbul, Beşiktaş'
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
    location: 'İstanbul, Üsküdar'
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
    location: 'İstanbul, Bakırköy'
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
    location: 'İstanbul, Beylikdüzü'
  }
];

const screenWidth = Dimensions.get('window').width;

export default function VolunteersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  
  const filteredVolunteers = mockVolunteers
    .filter(v => 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(v => selectedSkill ? v.skills.includes(selectedSkill) : true);
  
  const allSkills = [...new Set(mockVolunteers.flatMap(v => v.skills))];

  const renderVolunteerCard = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar.Image source={{ uri: item.avatar }} size={60} />
        <View style={styles.headerInfo}>
          <Text variant="titleMedium">{item.name}</Text>
          <View style={styles.locationContainer}>
            <MapPin size={14} color="#666" />
            <Text variant="bodySmall" style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Seviye {item.level}</Text>
        </View>
      </View>
      
      <Text variant="bodyMedium" style={styles.bio} numberOfLines={2}>{item.bio}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Star size={16} color="#FFC107" />
          <Text variant="bodyMedium">{item.xp} XP</Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={16} color="#4CAF50" />
          <Text variant="bodyMedium">{item.completedTasks} Görev</Text>
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
            textStyle={selectedSkill === skill ? styles.selectedSkillText : {}}
            onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
          >
            {skill}
          </Chip>
        ))}
      </View>
      
      <Button 
        mode="contained" 
        style={styles.connectButton}
        icon="message-outline"
      >
        İletişime Geç
      </Button>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Gönüllüler</Text>
      
      <Searchbar
        placeholder="Gönüllü ara..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {allSkills.map(skill => (
            <Chip
              key={skill}
              selected={selectedSkill === skill}
              onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
              style={styles.filterChip}
              selectedColor="#FFFFFF"
              showSelectedOverlay
              selectedBackgroundColor="#4CAF50"
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    marginBottom: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  searchbar: {
    marginBottom: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersScroll: {
    paddingRight: 32,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E8F5E9',
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    marginLeft: 4,
    color: '#666',
  },
  levelBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bio: {
    marginBottom: 12,
    color: '#555555',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E8F5E9',
  },
  selectedSkillChip: {
    backgroundColor: '#4CAF50',
  },
  selectedSkillText: {
    color: 'white',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
});
