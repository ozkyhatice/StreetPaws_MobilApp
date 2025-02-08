import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const AddEmergencyScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');

  const handleSave = () => {
    // Yeni acil yardım talebi kaydedilecek ve ana sayfaya yönlendirilir
    alert('Acil yardım talebiniz gönderildi!');
    navigation.goBack();  // Ana sayfaya dönüş
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Acil yardım mesajını girin"
        value={message}
        onChangeText={setMessage}
      />
      <TextInput
        style={styles.input}
        placeholder="Konum bilgisi girin"
        value={location}
        onChangeText={setLocation}
      />
      <Button title="Acil Yardım Gönder" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
});

export default AddEmergencyScreen;
