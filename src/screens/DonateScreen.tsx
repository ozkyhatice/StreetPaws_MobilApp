import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Text, TextInput, Button, Checkbox, Divider } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Heart } from 'lucide-react-native';

// Mock campaign data
const campaignData = [
  {
    id: '1',
    title: 'Kış Barınak Projesi',
    description: 'Sokak hayvanları için sıcak barınaklar inşa ediyoruz. Bağışlarınızla 20 yeni barınak yapacağız.',
    image: 'https://picsum.photos/id/237/800/400',
    category: 'Barınak',
  },
  {
    id: '2',
    title: 'Acil Tedavi Fonu',
    description: 'Yaralı ve hasta sokak hayvanlarının tedavisi için acil fon oluşturuyoruz.',
    image: 'https://picsum.photos/id/219/800/400',
    category: 'Sağlık',
  },
  {
    id: '3',
    title: 'Besleme İstasyonları',
    description: 'Şehrin farklı noktalarına otomatik mama ve su istasyonları kuruyoruz.',
    image: 'https://picsum.photos/id/169/800/400',
    category: 'Besleme',
  },
  {
    id: '4',
    title: 'Kısırlaştırma Kampanyası',
    description: 'Sokak hayvanlarının kontrollü popülasyonu için kısırlaştırma kampanyası.',
    image: 'https://picsum.photos/id/146/800/400',
    category: 'Sağlık',
  }
];

const donationAmounts = [100, 200, 500, 1000];

interface DonateScreenProps {
  campaignId: string;
}

export default function DonateScreen({ campaignId }: DonateScreenProps) {
  const [donationAmount, setDonationAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [campaign, setCampaign] = useState(null);
  
  const navigation = useNavigation();
  
  useEffect(() => {
    const foundCampaign = campaignData.find(c => c.id === campaignId);
    if (foundCampaign) {
      setCampaign(foundCampaign);
    }
  }, [campaignId]);
  
  const handleAmountSelect = (amount: number) => {
    setDonationAmount(amount.toString());
    setCustomAmount('');
  };
  
  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setDonationAmount('custom');
  };
  
  const handlePaymentSubmit = () => {
    const finalAmount = donationAmount === 'custom' ? customAmount : donationAmount;
    
    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir bağış miktarı girin');
      return;
    }
    
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      Alert.alert('Hata', 'Lütfen tüm kart bilgilerini doldurun');
      return;
    }
    
    setIsLoading(true);
    
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Teşekkürler!',
        `${finalAmount} ₺ tutarındaki bağışınız için teşekkür ederiz. Desteğiniz sokak hayvanlarına umut olacak.`,
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    }, 1500);
  };
  
  if (!campaign) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: campaign.image }} style={styles.campaignImage} />
        
        <View style={styles.content}>
          <View style={styles.campaignInfo}>
            <Text variant="titleLarge" style={styles.campaignTitle}>{campaign.title}</Text>
            <View style={styles.categoryTag}>
              <Text variant="bodySmall" style={styles.categoryText}>{campaign.category}</Text>
            </View>
          </View>
          
          <Text variant="bodyMedium" style={styles.description}>
            {campaign.description}
          </Text>
          
          <Divider style={styles.divider} />
          
          <Text variant="titleMedium" style={styles.sectionTitle}>Bağış Miktarı</Text>
          
          <View style={styles.amountsContainer}>
            {donationAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountButton,
                  donationAmount === amount.toString() && styles.selectedAmountButton
                ]}
                onPress={() => handleAmountSelect(amount)}
              >
                <Text style={
                  donationAmount === amount.toString() 
                    ? styles.selectedAmountText 
                    : styles.amountText
                }>
                  {amount} ₺
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TextInput
            label="Diğer Miktar"
            value={customAmount}
            onChangeText={handleCustomAmountChange}
            keyboardType="numeric"
            style={styles.customAmountInput}
            right={<TextInput.Affix text="₺" />}
            activeOutlineColor="#4CAF50"
          />
          
          <View style={styles.anonymousContainer}>
            <Checkbox
              status={isAnonymous ? 'checked' : 'unchecked'}
              onPress={() => setIsAnonymous(!isAnonymous)}
              color="#4CAF50"
            />
            <Text variant="bodyMedium" onPress={() => setIsAnonymous(!isAnonymous)}>
              İsmimi gizli tut
            </Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text variant="titleMedium" style={styles.sectionTitle}>Ödeme Bilgileri</Text>
          
          <TextInput
            label="Kart Numarası"
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="numeric"
            style={styles.inputField}
            maxLength={16}
            activeOutlineColor="#4CAF50"
          />
          
          <TextInput
            label="Kart Üzerindeki İsim"
            value={cardName}
            onChangeText={setCardName}
            style={styles.inputField}
            activeOutlineColor="#4CAF50"
          />
          
          <View style={styles.cardDetails}>
            <TextInput
              label="Son Kullanma Tarihi (AA/YY)"
              value={cardExpiry}
              onChangeText={setCardExpiry}
              style={[styles.inputField, { flex: 1, marginRight: 8 }]}
              maxLength={5}
              activeOutlineColor="#4CAF50"
            />
            <TextInput
              label="CVV"
              value={cardCvv}
              onChangeText={setCardCvv}
              keyboardType="numeric"
              secureTextEntry
              style={[styles.inputField, { flex: 1, marginLeft: 8 }]}
              maxLength={3}
              activeOutlineColor="#4CAF50"
            />
          </View>
          
          <Button
            mode="contained"
            onPress={handlePaymentSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.donateButton}
            icon={({ size, color }) => (
              <Heart size={size} color={color} />
            )}
          >
            {isLoading ? 'İşleniyor...' : 'Bağışı Tamamla'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { width } = Dimensions.get('window');
const inputWidth = width > 500 ? Math.min(600, width - 40) : width - 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  campaignImage: {
    width: '100%',
    height: 200,
  },
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  campaignInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: inputWidth,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  campaignTitle: {
    flex: 1,
    marginRight: 8,
    color: '#333333',
    fontWeight: 'bold',
  },
  categoryTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 4,
  },
  categoryText: {
    color: '#4CAF50',
  },
  description: {
    marginTop: 12,
    marginBottom: 16,
    color: '#555555',
    textAlign: 'left',
    width: inputWidth,
  },
  divider: {
    width: inputWidth,
    marginVertical: 16,
    backgroundColor: '#E0E0E0',
    height: 1,
  },
  sectionTitle: {
    width: inputWidth,
    marginBottom: 16,
    color: '#4CAF50',
    fontWeight: '500',
    textAlign: 'left',
  },
  amountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: inputWidth,
    marginBottom: 16,
  },
  amountButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: width > 500 ? (inputWidth - 24) / 4 : (inputWidth - 16) / 2,
    marginBottom: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedAmountButton: {
    backgroundColor: '#4CAF50',
  },
  amountText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  selectedAmountText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  customAmountInput: {
    width: inputWidth,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    width: inputWidth,
  },
  inputField: {
    width: inputWidth,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  cardDetails: {
    flexDirection: 'row',
    width: inputWidth,
  },
  donateButton: {
    width: inputWidth,
    marginTop: 16,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 24,
  },
}); 