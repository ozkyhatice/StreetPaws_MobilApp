import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

const tasks = [
  { id: '1', title: 'Parktaki kedilere mama ver' },
  { id: '2', title: 'Yaralı köpeğe yardım et' },
];

const TasksScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Aktif Görevler</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { task: item })}>
            <Text style={{ padding: 10, borderBottomWidth: 1 }}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default TasksScreen;
