import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Switch, Card, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState({
    newTaskNotifications: true,
    taskReminderNotifications: true,
    locationBasedNotifications: true,
    emergencyNotifications: true,
    donationNotifications: true,
    eventNotifications: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const toggleSetting = async (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.title, { color: colors.text }]}>Bildirim Tercihleri</Text>
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Görev Bildirimleri</Text>
              <View style={styles.settingItem}>
                <Text style={{ color: colors.text }}>Yeni Görev Bildirimleri</Text>
                <Switch
                  value={settings.newTaskNotifications}
                  onValueChange={() => toggleSetting('newTaskNotifications')}
                />
              </View>
              <View style={styles.settingItem}>
                <Text style={{ color: colors.text }}>Görev Hatırlatıcıları</Text>
                <Switch
                  value={settings.taskReminderNotifications}
                  onValueChange={() => toggleSetting('taskReminderNotifications')}
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Konum Bazlı Bildirimler</Text>
              <View style={styles.settingItem}>
                <Text style={{ color: colors.text }}>Yakındaki Görevler</Text>
                <Switch
                  value={settings.locationBasedNotifications}
                  onValueChange={() => toggleSetting('locationBasedNotifications')}
                />
              </View>
              <View style={styles.settingItem}>
                <Text style={{ color: colors.text }}>Acil Durum Bildirimleri</Text>
                <Switch
                  value={settings.emergencyNotifications}
                  onValueChange={() => toggleSetting('emergencyNotifications')}
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Topluluk Bildirimleri</Text>
              <View style={styles.settingItem}>
                <Text style={{ color: colors.text }}>Bağış Bildirimleri</Text>
                <Switch
                  value={settings.donationNotifications}
                  onValueChange={() => toggleSetting('donationNotifications')}
                />
              </View>
              <View style={styles.settingItem}>
                <Text style={{ color: colors.text }}>Etkinlik Bildirimleri</Text>
                <Switch
                  value={settings.eventNotifications}
                  onValueChange={() => toggleSetting('eventNotifications')}
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
}); 