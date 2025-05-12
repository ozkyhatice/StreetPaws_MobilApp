/**
 * Emergency Task Scenario Script
 * 
 * This script simulates the full cycle of an emergency task:
 * 1. Creating an emergency task
 * 2. Assigning it to a user
 * 3. Completing the task
 * 4. Approving the task
 * 5. Updating achievements count
 */

import { EmergencyService, EmergencyRequest } from '../services/emergencyService';
import { TaskService } from '../services/taskService';
import { XPService } from '../services/xpService';
import { Task } from '../types/task';

// Mock user IDs
const VOLUNTEER_USER_ID = 'volunteer123';
const VOLUNTEER_USER_NAME = 'Volunteer User';
const ADMIN_USER_ID = 'admin456';
const ADMIN_USER_NAME = 'Admin User';

/**
 * Main function to run the emergency scenario
 */
export async function runEmergencyScenario() {
  console.log('⭐ STARTING EMERGENCY SCENARIO ⭐');
  
  try {
    // Get service instances
    const emergencyService = EmergencyService.getInstance();
    const taskService = TaskService.getInstance();
    const xpService = XPService.getInstance();
    
    // Step 1: Create Emergency Request
    console.log('📱 Step 1: Creating emergency request...');
    const emergencyId = await createEmergencyRequest(emergencyService);
    console.log(`✅ Emergency created with ID: ${emergencyId}`);
    
    // Step 2: Simulate task creation from emergency
    console.log('🔄 Step 2: Converting emergency to task...');
    const taskId = await createTaskFromEmergency(emergencyId, taskService);
    console.log(`✅ Task created with ID: ${taskId}`);
    
    // Step 3: Assign task to volunteer
    console.log('👤 Step 3: Assigning task to volunteer...');
    await assignTaskToVolunteer(taskId, taskService);
    console.log(`✅ Task assigned to ${VOLUNTEER_USER_NAME}`);
    
    // Step 4: Complete task
    console.log('✍️ Step 4: Completing task...');
    await completeTask(taskId, taskService);
    console.log('✅ Task completed and awaiting approval');
    
    // Step 5: Approve task
    console.log('👍 Step 5: Approving task...');
    await approveTask(taskId, taskService);
    console.log('✅ Task approved');
    
    // Step 6: Update achievement counts
    console.log('🏆 Step 6: Updating achievement counts...');
    await updateAchievementCounts(VOLUNTEER_USER_ID, 'HEALTH', xpService);
    console.log('✅ Achievements updated');
    
    console.log('🎉 EMERGENCY SCENARIO COMPLETED SUCCESSFULLY 🎉');
    return { success: true, taskId };
  } catch (error) {
    console.error('❌ Error in emergency scenario:', error);
    return { success: false, error };
  }
}

/**
 * Create a new emergency request
 */
async function createEmergencyRequest(emergencyService: EmergencyService): Promise<string> {
  const emergency: Omit<EmergencyRequest, 'id'> = {
    title: 'Yaralı Kedi Acil Yardım',
    description: 'Kadıköy meydanda yaralı bir kedi bulundu, acil veteriner yardımı gerekiyor.',
    location: 'Kadıköy Meydan, İstanbul',
    animalType: 'Kedi',
    urgency: 'high',
    contactPhone: '5551234567',
    imageUrl: 'https://picsum.photos/seed/emergency/400/300',
    userId: ADMIN_USER_ID,
    userName: ADMIN_USER_NAME,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  // Create emergency request
  return await emergencyService.createEmergencyRequest(emergency);
}

/**
 * Create a task from an emergency
 */
async function createTaskFromEmergency(emergencyId: string, taskService: TaskService): Promise<string> {
  // In a real app, this would be handled by a cloud function or backend service
  // Here we'll simulate creating a task manually
  
  const task: Omit<Task, 'id'> = {
    title: 'Yaralı Kedi Acil Yardım',
    description: 'Kadıköy meydanda yaralı bir kedi bulundu, acil veteriner yardımı gerekiyor.',
    status: 'OPEN',
    category: 'HEALTH',
    location: {
      address: 'Kadıköy Meydan, İstanbul',
      latitude: 40.9916,
      longitude: 29.0291,
    },
    priority: 'HIGH',
    xpReward: 200,
    isEmergency: true,
    emergencyLevel: 'URGENT',
    images: ['https://picsum.photos/seed/emergency/400/300'],
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    createdBy: {
      id: ADMIN_USER_ID,
      name: ADMIN_USER_NAME,
    },
  };
  
  // Add task to service's internal list
  taskService.tasks.push({
    ...task,
    id: `emergency_task_${emergencyId}`,
  } as Task);
  
  return `emergency_task_${emergencyId}`;
}

/**
 * Assign task to volunteer
 */
async function assignTaskToVolunteer(taskId: string, taskService: TaskService): Promise<void> {
  await taskService.assignTask(taskId, VOLUNTEER_USER_ID);
}

/**
 * Complete task
 */
async function completeTask(taskId: string, taskService: TaskService): Promise<void> {
  await taskService.completeTask(taskId, VOLUNTEER_USER_ID, VOLUNTEER_USER_NAME);
}

/**
 * Approve task
 */
async function approveTask(taskId: string, taskService: TaskService): Promise<void> {
  await taskService.approveTask(taskId, ADMIN_USER_ID, ADMIN_USER_NAME);
}

/**
 * Update achievement counts
 */
async function updateAchievementCounts(userId: string, category: string, xpService: XPService): Promise<void> {
  // Get current progress
  const progress = await xpService.getTaskProgress(userId);
  
  // Manually increment the category count
  const currentTasksCount = progress.currentTasksCount || {
    FEEDING: 0,
    CLEANING: 0,
    HEALTH: 0,
    SHELTER: 0,
    OTHER: 0
  };
  
  currentTasksCount[category] = (currentTasksCount[category] || 0) + 1;
  
  // Update in database
  // In a real app, this would be done automatically by the task approval process
  // but we'll simulate it here
  await updateCategoryCountInDatabase(userId, currentTasksCount);
}

/**
 * Update category count in database (simulated)
 */
async function updateCategoryCountInDatabase(userId: string, categoryCounts: Record<string, number>): Promise<void> {
  // This would normally use Firebase/Firestore to update the user document
  // For this simulation, we'll just log the update
  console.log(`📊 Updated category counts for user ${userId}:`, categoryCounts);
}

// If this file is run directly
if (require.main === module) {
  runEmergencyScenario()
    .then(result => {
      if (result.success) {
        console.log('Script executed successfully!');
      } else {
        console.error('Script failed:', result.error);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
    });
} 