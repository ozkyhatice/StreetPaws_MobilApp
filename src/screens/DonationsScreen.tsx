import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Text, Card, Button, ProgressBar, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Heart, Award, Target } from 'lucide-react-native';

const campaignData = [
  {
    id: '1',
    title: 'Kış Barınak Projesi',
    description: 'Sokak hayvanları için sıcak barınaklar inşa ediyoruz. Bağışlarınızla 20 yeni barınak yapacağız.',
    image: 'https://picsum.photos/id/237/800/400',
    category: 'Barınak',
    targetAmount: 50000,
    raisedAmount: 32400,
    contributors: 142,
    daysLeft: 12,
    featured: true
  },
  {
    id: '2',
    title: 'Acil Tedavi Fonu',
    description: 'Yaralı ve hasta sokak hayvanlarının tedavisi için acil fon oluşturuyoruz.',
    image: 'https://picsum.photos/id/219/800/400',
    category: 'Sağlık',
    targetAmount: 30000,
    raisedAmount: 24800,
    contributors: 98,
    daysLeft: 7,
    featured: false
  },
  {
    id: '3',
    title: 'Besleme İstasyonları',
    description: 'Şehrin farklı noktalarına otomatik mama ve su istasyonları kuruyoruz.',
    image: 'https://picsum.photos/id/169/800/400',
    category: 'Besleme',
    targetAmount: 40000,
    raisedAmount: 15600,
    contributors: 86,
    daysLeft: 20,
    featured: false
  },
  {
    id: '4',
    title: 'Kısırlaştırma Kampanyası',
    description: 'Sokak hayvanlarının kontrollü popülasyonu için kısırlaştırma kampanyası.',
    image: 'https://picsum.photos/id/146/800/400',
    category: 'Sağlık',
    targetAmount: 60000,
    raisedAmount: 42000,
    contributors: 178,
    daysLeft: 15,
    featured: true
  }
];

export default function DonationsScreen() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navigation = useNavigation();
  
  const filteredCampaigns = activeCategory
    ? campaignData.filter(campaign => campaign.category === activeCategory)
    : campaignData;
  
  const categories = [...new Set(campaignData.map(item => item.category))];
  
  const handleDonate = (campaignId: string) => {
    navigation.navigate('Donate', { campaignId });
  };
  
  const renderFeaturedCampaign = () => {
    const featured = campaignData.find(c => c.featured);
    if (!featured) return null;
    
    return (
      <Card style={styles.featuredCard}>
        <View>
          <Image source={{ uri: featured.image }} style={styles.featuredImage} />
          <Badge style={styles.featuredBadge}>Öne Çıkan</Badge>
        </View>
        <View style={styles.featuredContent}>
          <Text variant="titleLarge" style={styles.featuredTitle}>
            {featured.title}
          </Text>
          <Text variant="bodyMedium" style={styles.featuredDescription} numberOfLines={3}>
            {featured.description}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Target size={16} color="#4CAF50" />
              <Text variant="bodyMedium">{featured.targetAmount} ₺</Text>
            </View>
            <View style={styles.statItem}>
              <Heart size={16} color="#FF6B6B" />
              <Text variant="bodyMedium">{featured.contributors} Bağışçı</Text>
            </View>
            <View style={styles.statItem}>
              <Award size={16} color="#FFC107" />
              <Text variant="bodyMedium">{featured.daysLeft} Gün</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={featured.raisedAmount / featured.targetAmount} 
              color="#4CAF50" 
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressText}>
              {featured.raisedAmount} ₺ toplandı ({Math.round(featured.raisedAmount / featured.targetAmount * 100)}%)
            </Text>
          </View>
          <Button 
            mode="contained" 
            style={styles.donateButton}
            onPress={() => handleDonate(featured.id)}
          >
            Bağış Yap
          </Button>
        </View>
      </Card>
    );
  };
  
  const renderCampaignCard = (campaign) => {
    // Responsive card size
    const isSmallScreen = Dimensions.get('window').width < 375;
    
    return (
      <Card key={campaign.id} style={styles.campaignCard}>
        <Image source={{ uri: campaign.image }} style={styles.campaignImage} />
        <Card.Content>
          <Text variant="titleMedium" numberOfLines={1}>{campaign.title}</Text>
          <Text variant="bodyMedium" numberOfLines={2} style={styles.campaignDescription}>
            {campaign.description}
          </Text>
          <View style={styles.statsRowSmall}>
            <Text variant="bodySmall" style={styles.categoryTag}>{campaign.category}</Text>
            <Text variant="bodySmall">{campaign.daysLeft} Gün Kaldı</Text>
          </View>
          <ProgressBar 
            progress={campaign.raisedAmount / campaign.targetAmount} 
            color="#4CAF50" 
            style={styles.progressBarSmall}
          />
          <View style={styles.amountRow}>
            <Text variant="bodySmall">{campaign.raisedAmount} ₺</Text>
            <Text variant="bodySmall">{campaign.targetAmount} ₺</Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="outlined"
            style={styles.cardButton}
            onPress={() => handleDonate(campaign.id)}
          >
            Bağış Yap
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text variant="headlineMedium" style={styles.title}>Bağış Kampanyaları</Text>
      
      {renderFeaturedCampaign()}
      
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              activeCategory === null && styles.activeCategoryChip
            ]}
            onPress={() => setActiveCategory(null)}
          >
            <Text style={activeCategory === null ? styles.activeCategoryText : styles.categoryText}>
              Tümü
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                activeCategory === category && styles.activeCategoryChip
              ]}
              onPress={() => setActiveCategory(
                activeCategory === category ? null : category
              )}
            >
              <Text style={activeCategory === category ? styles.activeCategoryText : styles.categoryText}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.campaignsGrid}>
        {filteredCampaigns.map(campaign => renderCampaignCard(campaign))}
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = width > 500 ? (width - 48) / 2 : Math.min(width - 32, 300);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  featuredCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: 180,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    marginBottom: 8,
    color: '#333333',
  },
  featuredDescription: {
    marginBottom: 12,
    color: '#555555',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    textAlign: 'right',
    color: '#555555',
  },
  donateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 24,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingRight: 32,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    marginRight: 8,
  },
  activeCategoryChip: {
    backgroundColor: '#4CAF50',
  },
  categoryText: {
    color: '#4CAF50',
  },
  activeCategoryText: {
    color: 'white',
    fontWeight: '500',
  },
  campaignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  campaignCard: {
    width: cardWidth,
    marginBottom: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  campaignImage: {
    width: '100%',
    height: 120,
  },
  campaignDescription: {
    marginVertical: 8,
    color: '#555555',
  },
  statsRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  categoryTag: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  progressBarSmall: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardButton: {
    borderColor: '#4CAF50',
    width: '100%',
    borderRadius: 20,
  },
});
