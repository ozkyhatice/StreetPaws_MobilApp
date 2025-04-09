import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, RadioButton, Button, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

export default function ThemeSettingsScreen() {
  const { theme, fontSize, setTheme, setFontSize, saveSettings } = useAppTheme();
  const { colors } = useTheme();
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);

  const themes = [
    { value: 'light', label: 'Açık Tema' },
    { value: 'dark', label: 'Koyu Tema' },
    { value: 'system', label: 'Sistem Teması' },
  ];

  const fontSizes = [
    { value: 'small', label: 'Küçük' },
    { value: 'medium', label: 'Orta' },
    { value: 'large', label: 'Büyük' },
  ];

  const handleSaveSettings = async () => {
    await saveSettings();
    setSnackbarVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.title, { color: colors.text }]}>Tema Ayarları</Text>
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tema Seçimi</Text>
              <RadioButton.Group onValueChange={value => setTheme(value as 'light' | 'dark' | 'system')} value={theme}>
                {themes.map((item) => (
                  <View key={item.value} style={styles.radioItem}>
                    <RadioButton value={item.value} />
                    <Text style={{ color: colors.text }}>{item.label}</Text>
                  </View>
                ))}
              </RadioButton.Group>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Yazı Boyutu</Text>
              <RadioButton.Group onValueChange={value => setFontSize(value as 'small' | 'medium' | 'large')} value={fontSize}>
                {fontSizes.map((item) => (
                  <View key={item.value} style={styles.radioItem}>
                    <RadioButton value={item.value} />
                    <Text style={{ color: colors.text }}>{item.label}</Text>
                  </View>
                ))}
              </RadioButton.Group>
            </View>

            <Button
              mode="contained"
              onPress={handleSaveSettings}
              style={styles.button}
            >
              Ayarları Kaydet
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ backgroundColor: colors.primary }}
      >
        Ayarlar kaydedildi
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
}); 