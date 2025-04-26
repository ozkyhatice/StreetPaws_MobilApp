import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { colors } from '../../config/theme';

export const InfoSection = () => {
  return (
    <View style={styles.infoSection}>
      <Text variant="titleLarge" style={styles.sectionTitle}>Güncel Bilgiler</Text>
      
      <Card style={styles.infoCard} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Kış Yaklaşıyor</Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            Soğuk havalar için sokak hayvanlarına barınak yapma görevleri eklendi. Katılmak için görevler sayfasını kontrol edin.
          </Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.infoCard} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Besleme Noktaları</Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            Şehrin farklı bölgelerinde besleme noktaları oluşturuldu. En yakın beslenme noktasını haritada görebilirsiniz.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    padding: 15,
  },
  sectionTitle: {
    marginBottom: 15,
    color: colors.text,
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  cardTitle: {
    color: colors.primary,
    marginBottom: 5,
  },
  cardText: {
    color: colors.textSecondary,
  },
}); 