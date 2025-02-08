import React from 'react';
import { View, Text, Button } from 'react-native';

const TaskDetailScreen = ({ route, navigation }) => {
  const { task } = route.params;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{task.title}</Text>
      <Text style={{ marginTop: 10 }}>Detaylı görev açıklaması burada olacak...</Text>
      <Button title="Bu Görevi Üstlen" onPress={() => alert('Görev üstlenildi!')} />
    </View>
  );
};

export default TaskDetailScreen;
