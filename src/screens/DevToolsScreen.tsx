import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task } from '../types/task';
import { colors, spacing } from '../config/theme';

export default function DevToolsScreen() {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emergencyTasks, setEmergencyTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Read all tasks from Firestore
  const readAllTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("DevTools: Reading all tasks from Firestore");
      const q = query(
        collection(db, 'tasks'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`DevTools: Found ${querySnapshot.size} tasks in Firestore`);
      
      const tasksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          deadline: data.deadline?.toDate ? data.deadline.toDate().toISOString() : data.deadline
        } as Task;
      });
      
      setTasks(tasksData);
    } catch (err: any) {
      console.error("DevTools: Error reading tasks:", err);
      setError(`Error reading tasks: ${err.message}`);
      Alert.alert("Error", `Failed to read tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Read emergency tasks from Firestore
  const readEmergencyTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("DevTools: Reading emergency tasks from Firestore");
      const q = query(
        collection(db, 'tasks'),
        where('isEmergency', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`DevTools: Found ${querySnapshot.size} emergency tasks in Firestore`);
      
      const emergencyTasksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          deadline: data.deadline?.toDate ? data.deadline.toDate().toISOString() : data.deadline
        } as Task;
      });
      
      setEmergencyTasks(emergencyTasksData);
    } catch (err: any) {
      console.error("DevTools: Error reading emergency tasks:", err);
      setError(`Error reading emergency tasks: ${err.message}`);
      Alert.alert("Error", `Failed to read emergency tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Create a test emergency task
  const createTestEmergencyTask = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("DevTools: Creating test emergency task");
      
      // Import needed modules
      const { addDoc, Timestamp } = require('firebase/firestore');
      
      // Create a test emergency task
      const newTask = {
        title: `Test Emergency Task ${new Date().toISOString()}`,
        description: 'This is a test emergency task created from DevTools',
        status: 'OPEN',
        category: 'HEALTH',
        location: {
          address: 'Test Location',
          latitude: 41.0082,
          longitude: 28.9784
        },
        priority: 'HIGH',
        xpReward: 300,
        isEmergency: true,
        emergencyLevel: 'CRITICAL',
        images: [],
        createdAt: Timestamp.fromDate(new Date()),
        deadline: Timestamp.fromDate(new Date(Date.now() + 7200000)),
        createdBy: {
          id: 'devtools',
          name: 'DevTools'
        }
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      console.log(`DevTools: Created test emergency task with ID: ${docRef.id}`);
      
      Alert.alert("Success", `Created test emergency task with ID: ${docRef.id}`);
      
      // Refresh the task lists
      await readAllTasks();
      await readEmergencyTasks();
    } catch (err: any) {
      console.error("DevTools: Error creating test task:", err);
      setError(`Error creating test task: ${err.message}`);
      Alert.alert("Error", `Failed to create test task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Render task card
  const renderTaskCard = (task: Task) => {
    return (
      <Card key={task.id} style={styles.card}>
        <Card.Content>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDescription}>{task.description}</Text>
          
          <Divider style={styles.divider} />
          
          <View style={styles.taskDetails}>
            <Text>ID: {task.id}</Text>
            <Text>Status: {task.status}</Text>
            <Text>Emergency: {task.isEmergency ? 'YES' : 'NO'}</Text>
            {task.emergencyLevel && (
              <Text>Emergency Level: {task.emergencyLevel}</Text>
            )}
            <Text>Created: {new Date(task.createdAt).toLocaleString()}</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>DevTools - Firestore Debug</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained"
            onPress={readAllTasks}
            disabled={loading}
          >
            Read All Tasks
          </Button>
          
          <Button 
            mode="contained"
            onPress={readEmergencyTasks}
            disabled={loading}
            style={styles.button}
          >
            Read Emergency Tasks
          </Button>
          
          <Button 
            mode="contained"
            onPress={createTestEmergencyTask}
            disabled={loading}
            style={styles.button}
          >
            Create Test Emergency Task
          </Button>
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text>Loading...</Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Tasks ({emergencyTasks.length})</Text>
          {emergencyTasks.length === 0 ? (
            <Text style={styles.emptyText}>No emergency tasks found</Text>
          ) : (
            emergencyTasks.map(task => renderTaskCard(task))
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Tasks ({tasks.length})</Text>
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks found</Text>
          ) : (
            tasks.map(task => renderTaskCard(task))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainer: {
    padding: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.sm,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  taskDetails: {
    marginTop: spacing.xs,
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  errorContainer: {
    padding: spacing.md,
    backgroundColor: '#ffeeee',
    marginHorizontal: spacing.md,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
  },
  emptyText: {
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
}); 