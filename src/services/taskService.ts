import { Task, TaskStatus, TaskCategory, ApprovalStatus } from '../types/task';
import { TaskVerification, TaskVerificationStatus } from '../types/taskVerification';
import { collection, query, where, orderBy, getDocs, addDoc, doc, getDoc, updateDoc, Timestamp, increment, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EmergencyRequest } from '../services/emergencyService';
import { XPService } from './xpService';

// Yardımcı fonksiyonlar
function removeUndefinedFields<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}

// Tarih işlemleri için yardımcı fonksiyonlar
const DateUtils = {
  toISOString: (timestampObj: any): string => {
    try {
      return timestampObj.toDate().toISOString();
    } catch (error) {
      console.warn('Invalid date conversion:', error);
      return new Date().toISOString();
    }
  },

  processFirestoreTimestamps: (data: any): any => {
    const result = { ...data };
    if (data.createdAt?.toDate) {
      result.createdAt = DateUtils.toISOString(data.createdAt);
    }
    if (data.deadline?.toDate) {
      result.deadline = DateUtils.toISOString(data.deadline);
    }
    return result;
  }
};

// Firestore işlemleri için yardımcı sınıf
class FirestoreHelper {
  static async getDocument(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    return {
      id: docSnap.id,
      ...DateUtils.processFirestoreTimestamps(docSnap.data())
    };
  }

  static async updateDocument(collectionName: string, docId: string, data: any) {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, removeUndefinedFields(data));
  }
}

// Tip tanımlamaları
type TaskStatusUpdate = {
  status: TaskStatus;
  updatedAt: string;
  assignedTo?: string;
  completedBy?: {
    id: string;
    name: string;
    completedAt: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    approvedAt: string;
    note?: string;
  };
  approvalStatus?: string;
};

export class TaskService {
  private static instance: TaskService;
  private readonly tasksCollection = 'tasks';
  private readonly xpService = XPService.getInstance();
  
  private constructor() {}

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  // Görev durumlarını yönetmek için yardımcı fonksiyonlar
  private getTaskStatusUpdate(status: TaskStatus, userId?: string, userName?: string): TaskStatusUpdate {
    const baseUpdate: TaskStatusUpdate = {
      status,
      updatedAt: new Date().toISOString()
    };

    switch (status) {
      case 'IN_PROGRESS':
        return {
          ...baseUpdate,
          assignedTo: userId
        };
      case 'AWAITING_APPROVAL':
        return {
          ...baseUpdate,
          completedBy: {
            id: userId!,
            name: userName!,
            completedAt: new Date().toISOString()
          },
          approvalStatus: 'PENDING'
        };
      case 'COMPLETED':
        return {
          ...baseUpdate,
          approvedBy: {
            id: userId!,
            name: userName!,
            approvedAt: new Date().toISOString()
          }
        };
      default:
        return baseUpdate;
    }
  }

  // Ana işlevler
  async getTasks(filters?: Partial<Task>): Promise<Task[]> {
    try {
      const baseQuery = query(
        collection(db, this.tasksCollection)
      );

      const querySnapshot = await getDocs(baseQuery);
      let tasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...DateUtils.processFirestoreTimestamps(doc.data())
      })) as Task[];

      if (filters) {
        tasks = tasks.filter(task => 
          Object.entries(filters).every(([key, value]) => 
            task[key as keyof Task] === value
          )
        );
      }

      return tasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async getTask(id: string): Promise<Task | null> {
    try {
      return await FirestoreHelper.getDocument(this.tasksCollection, id) as Task;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  async approveTask(taskId: string, approverId: string, approverName: string, note: string = ''): Promise<void> {
    try {
      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', approverId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      if (userData.role !== 'admin') {
        throw new Error('Only admin users can approve tasks');
      }

      // Get the task first
      const taskDoc = await getDoc(doc(db, this.tasksCollection, taskId));
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const taskData = taskDoc.data();
      if (!taskData.completedBy?.id) {
        throw new Error('Task completion information is missing');
      }

      const completedByUserId = taskData.completedBy.id;

      // Update task status - make sure no fields have undefined values
      await updateDoc(doc(db, this.tasksCollection, taskId), {
        status: 'COMPLETED',
        approvedBy: {
          id: approverId,
          name: approverName,
          approvedAt: new Date().toISOString(),
          note: note || '' // Ensure note is never undefined
        }
      });

      // Update user's completed task count
      const completedByUserRef = doc(db, 'users', completedByUserId);
      const completedByUserDoc = await getDoc(completedByUserRef);
      
      if (completedByUserDoc.exists()) {
        const completedByUserData = completedByUserDoc.data();
        await updateDoc(completedByUserRef, {
          completedTaskCount: (completedByUserData.completedTaskCount || 0) + 1,
          stats: {
            ...completedByUserData.stats,
            totalTasksCompleted: (completedByUserData.stats?.totalTasksCompleted || 0) + 1
          }
        });
      }

      // Update global stats
      const globalStatsRef = doc(db, 'stats', 'global');
      const globalStatsDoc = await getDoc(globalStatsRef);
      
      if (globalStatsDoc.exists()) {
        await updateDoc(globalStatsRef, {
          totalTasksCompleted: increment(1)
        });
      } else {
        await setDoc(globalStatsRef, {
          totalTasksCompleted: 1
        });
      }

    } catch (error) {
      console.error('Error approving task:', error);
      throw error;
    }
  }

  private async updateUserAchievements(task: Task): Promise<void> {
    if (!task.completedBy?.id) return;

    try {
      const userId = task.completedBy.id;
      
      // Kullanıcı istatistiklerini güncelle
      await FirestoreHelper.updateDocument('users', userId, {
        [`achievements.${task.category.toLowerCase()}`]: increment(1),
        'stats.tasksCompleted': increment(1)
      });

      // Kategori bazlı ilerlemeyi güncelle
      await this.xpService.updateTaskProgressForCategory(userId, task.category);

      // XP ödülünü ver
      await this.xpService.addTaskCompletionXP(
        userId,
        task.id,
        task.title,
        task.isEmergency,
        task.isEmergency ? task.emergencyLevel : undefined
      );
    } catch (error) {
      console.error('Error updating achievements:', error);
      throw error;
    }
  }

  // Acil durum görevleri için yardımcı fonksiyonlar
  private getEmergencyTaskData(emergency: EmergencyRequest): Omit<Task, 'id'> {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 7200000);

    return {
      title: emergency.title,
      description: emergency.description,
      status: 'OPEN',
      category: this.getCategoryFromEmergency(emergency),
      location: {
        address: emergency.location,
        latitude: 41.0082,
        longitude: 28.9784
      },
      priority: this.getPriorityFromEmergency(emergency.urgency),
      xpReward: this.getXpRewardFromUrgency(emergency.urgency),
      isEmergency: true,
      emergencyLevel: this.getEmergencyLevel(emergency.urgency),
      emergencyRequestId: emergency.id,
      images: emergency.imageUrl ? [emergency.imageUrl] : [],
      createdAt: now.toISOString(),
      deadline: twoHoursLater.toISOString(),
      createdBy: {
        id: emergency.userId,
        name: emergency.userName
      }
    };
  }

  private getCategoryFromEmergency(emergency: EmergencyRequest): TaskCategory {
    // Convert description and animal type to lowercase for easier matching
    const description = (emergency.description || '').toLowerCase();
    const animalType = (emergency.animalType || '').toLowerCase();
    
    // Check for feeding-related keywords
    if (description.includes('aç') || 
        description.includes('besle') || 
        description.includes('yemek') || 
        description.includes('mama') || 
        description.includes('su')) {
      return 'FEEDING';
    }
    
    // Check for shelter-related keywords
    if (description.includes('barınak') || 
        description.includes('yuva') || 
        description.includes('barınma') || 
        description.includes('soğuk') || 
        description.includes('sıcak') ||
        description.includes('korunma') ||
        description.includes('ev')) {
      return 'SHELTER';
    }
    
    // Check for cleaning-related keywords
    if (description.includes('temiz') || 
        description.includes('kirli') || 
        description.includes('çöp') ||
        description.includes('atık')) {
      return 'CLEANING';
    }
    
    // Default to HEALTH for medical emergencies for cats and dogs
    if (animalType.includes('kedi') || 
        animalType.includes('köpek') ||
        description.includes('hasta') ||
        description.includes('yaralı') ||
        description.includes('kaza') ||
        description.includes('tedavi') ||
        description.includes('veteriner')) {
      return 'HEALTH';
    }
    
    // If no specific category is detected, return OTHER
    return 'OTHER';
  }

  private getEmergencyLevel(urgency: string): 'CRITICAL' | 'URGENT' | 'NORMAL' {
    const levels = {
      critical: 'CRITICAL',
      high: 'CRITICAL',
      medium: 'URGENT',
      default: 'NORMAL'
    } as const;
    return levels[urgency as keyof typeof levels] || levels.default;
  }

  private getXpRewardFromUrgency(urgency: string): number {
    const rewards = {
      critical: 350,
      high: 300,
      medium: 200,
      default: 100
    };
    return rewards[urgency as keyof typeof rewards] || rewards.default;
  }

  private getPriorityFromEmergency(urgency: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const priorities = {
      critical: 'HIGH',
      high: 'HIGH',
      medium: 'MEDIUM',
      default: 'LOW'
    } as const;
    return priorities[urgency as keyof typeof priorities] || priorities.default;
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: Math.random().toString()
    };
    // mockTasks.push(newTask);
    return newTask;
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    // const index = mockTasks.findIndex(t => t.id === id);
    // if (index === -1) throw new Error('Task not found');
    
    // mockTasks[index] = { ...mockTasks[index], ...task };
    // return mockTasks[index];
    throw new Error('Task not found');
  }

  async deleteTask(id: string): Promise<void> {
    // const index = mockTasks.findIndex(t => t.id === id);
    // if (index !== -1) {
    //   mockTasks.splice(index, 1);
    // }
    throw new Error('Task not found');
  }

  async createEmergencyTask(emergency: EmergencyRequest): Promise<Task> {
    // Acil durumdan görev oluştur
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 7200000); // 2 saat sonra
    
    const task: Omit<Task, 'id'> = {
      title: emergency.title,
      description: emergency.description,
      status: 'OPEN',
      category: this.getCategoryFromEmergency(emergency),
      location: {
        address: emergency.location,
        latitude: 41.0082, // varsayılan değerler
        longitude: 28.9784
      },
      priority: this.getPriorityFromEmergency(emergency.urgency),
      xpReward: this.getXpRewardFromUrgency(emergency.urgency),
      isEmergency: true, // Tüm acil durum görevleri isEmergency=true olarak işaretlenmeli
      emergencyLevel: this.getEmergencyLevel(emergency.urgency),
      emergencyRequestId: emergency.id, // Emergency request ID
      images: emergency.imageUrl ? [emergency.imageUrl] : [],
      createdAt: now.toISOString(),
      deadline: twoHoursLater.toISOString(), // 2 saat sonra
      createdBy: {
        id: emergency.userId,
        name: emergency.userName
      }
    };

    try {
      // Firestore'a ekle
      console.log(`TaskService: Creating emergency task: ${task.title}, isEmergency: ${task.isEmergency}`);
      
      const docRef = await addDoc(collection(db, this.tasksCollection), {
        ...task,
        createdAt: Timestamp.fromDate(now),
        deadline: Timestamp.fromDate(twoHoursLater)
      });
      const taskWithId = { ...task, id: docRef.id };
      
      console.log(`TaskService: Created emergency task with ID: ${taskWithId.id}, isEmergency: ${taskWithId.isEmergency}`);
      return taskWithId;
    } catch (error) {
      console.error('Error creating emergency task:', error);
      throw error;
    }
  }

  async assignTask(taskId: string, userId: string): Promise<void> {
    try {
      console.log(`TaskService: Assigning task ${taskId} to user ${userId}`);
      
      // Önce görevi Firestore'dan almayı deneyelim
      try {
        const docRef = doc(db, this.tasksCollection, taskId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          console.log(`TaskService: Task found in Firestore: ${docSnap.id}`);
          
          // Task zaten atanmışsa görevin kimin üzerinde olduğunu kontrol et
          if (docSnap.data().assignedTo) {
            // Eğer görev zaten bu kullanıcıya atanmışsa, işlemi başarılı kabul et
            if (docSnap.data().assignedTo === userId) {
              console.log(`TaskService: Task ${taskId} is already assigned to user ${userId}, continuing`);
              return; // Hata fırlatmadan metodu sonlandır
            }
            
            // Başka birine atanmışsa hata mesajı ver
            console.error(`TaskService: Task ${taskId} is already assigned to another user: ${docSnap.data().assignedTo}`);
            throw new Error('Bu görev başka bir kullanıcı tarafından üstlenilmiş');
          }
          
          // Firestore'da görevi güncelle
          await updateDoc(docRef, {
            assignedTo: userId,
            status: 'IN_PROGRESS'
          });
          
          console.log(`TaskService: Task updated in Firestore`);
        } else {
          console.log(`TaskService: Task not found in Firestore, checking local tasks`);
        }
      } catch (firestoreError) {
        // Bu görevin başka birine atanmasıyla ilgili hatayı yeniden fırlat
        if (firestoreError.message.includes('already assigned')) {
          throw firestoreError;
        }
        
        console.error(`TaskService: Firestore error while assigning task: ${firestoreError.message}`);
        // Firestore hatası olsa bile devam et ve bellek içindeki veriyi güncellemeyi dene
      }
      
      // Bellek içindeki görevi de güncelle
      // const taskIndex = this.tasks.findIndex(task => task.id === taskId);
      // if (taskIndex === -1) {
      //   console.error(`TaskService: Task ${taskId} not found in memory`);
      //   throw new Error('Görev bulunamadı');
      // }
      
      // Bellek içinde de görevin atanmış olup olmadığını kontrol et
      // if (this.tasks[taskIndex].assignedTo) {
      //   // Eğer görev zaten bu kullanıcıya atanmışsa, işlemi başarılı kabul et
      //   if (this.tasks[taskIndex].assignedTo === userId) {
      //     console.log(`TaskService: Task ${taskId} is already assigned to user ${userId} in memory, continuing`);
      //     return; // Hata fırlatmadan metodu sonlandır
      //   }
      
      //   // Başka birine atanmışsa hata mesajı ver
      //   console.error(`TaskService: Task ${taskId} is already assigned to user ${this.tasks[taskIndex].assignedTo} in memory`);
      //   throw new Error('Bu görev başka bir kullanıcı tarafından üstlenilmiş');
      // }
      
      console.log(`TaskService: Updating memory task ${taskId}`);
      
      // this.tasks[taskIndex] = {
      //   ...this.tasks[taskIndex],
      //   assignedTo: userId,
      //   status: 'IN_PROGRESS'
      // };
      
      console.log(`TaskService: Task ${taskId} successfully assigned to user ${userId}`);
    } catch (error) {
      console.error(`TaskService: Error assigning task: ${error.message}`);
      throw error; 
    }
  }

  async unassignTask(taskId: string): Promise<void> {
    // const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    // if (taskIndex === -1) throw new Error('Task not found');
    
    console.log(`Unassigning task ${taskId}`);
    
    // this.tasks[taskIndex] = {
    //   ...this.tasks[taskIndex],
    //   assignedTo: undefined,
    //   status: 'OPEN'
    // };
    
    // Firestore güncellemesi (gerçek uygulamada)
    // await updateDoc(doc(db, this.tasksCollection, taskId), {
    //   assignedTo: firebase.firestore.FieldValue.delete(),
    //   status: 'OPEN'
    // });
  }

  async completeTask(taskId: string, userId: string, userName: string): Promise<void> {
    try {
      console.log(`Completing task ${taskId} by user ${userId} (${userName})`);
      
      // Firestore'da görevi güncelle
      const docRef = doc(db, this.tasksCollection, taskId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error(`TaskService: Task ${taskId} not found in Firestore for completion`);
        throw new Error(`Task with ID ${taskId} not found in Firestore`);
      }
      
      console.log(`TaskService: Found task in Firestore for completion: ${taskId}`);
      
      // Check if the task is assigned to this user
      const taskData = docSnap.data();
      if (taskData.assignedTo && taskData.assignedTo !== userId) {
        console.error(`TaskService: Task ${taskId} is assigned to ${taskData.assignedTo}, not to ${userId}`);
        throw new Error('Task is assigned to another user');
      }
      
      // Check task status before updating
      if (taskData.status !== 'IN_PROGRESS' && taskData.status !== 'OPEN') {
        console.error(`TaskService: Task ${taskId} has invalid status for completion: ${taskData.status}`);
        throw new Error(`Task has invalid status for completion: ${taskData.status}`);
      }
      
      // Update the task in Firestore
      console.log(`TaskService: Updating task in Firestore for completion: ${taskId}`);
      
      await updateDoc(docRef, {
        status: 'AWAITING_APPROVAL',
        completedBy: {
          id: userId,
          name: userName,
          completedAt: Timestamp.fromDate(new Date())
        },
        approvalStatus: 'PENDING',
        // If not already assigned, assign it now
        assignedTo: taskData.assignedTo || userId
      });
      
      console.log(`TaskService: Task updated in Firestore for completion: ${taskId}`);
    } catch (error) {
      console.error(`TaskService: Error completing task: ${error.message}`);
      throw error;
    }
  }

  async verifyAndCompleteTask(taskId: string, userId: string, verification: {
    imageUrl?: string;
    note?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }): Promise<Task> {
    try {
      console.log(`Verifying and completing task ${taskId} by user ${userId}`);
      console.log('Verification data received:', JSON.stringify(verification, null, 2));
      
      // Fetch task from Firestore
      const docRef = doc(db, this.tasksCollection, taskId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error(`TaskService: Task ${taskId} not found in Firestore`);
        throw new Error('Task not found');
      }
      
      const taskData = docSnap.data();
      console.log('Current task data:', JSON.stringify(taskData, null, 2));
      
      // Verify task is assigned to this user
      if (taskData.assignedTo !== userId) {
        console.error(`TaskService: Task ${taskId} is not assigned to user ${userId}`);
        throw new Error('Task is not assigned to this user');
      }
      
      // Verify task is in progress
      if (taskData.status !== 'IN_PROGRESS') {
        console.error(`TaskService: Task ${taskId} is not in IN_PROGRESS status`);
        throw new Error('Task is not in progress');
      }
      
      // Convert to Task object for return value
      const task = {
        id: docSnap.id,
        ...taskData,
        createdAt: taskData.createdAt?.toDate ? 
          this.safeGetISOString(taskData.createdAt) : 
          taskData.createdAt,
        deadline: taskData.deadline?.toDate ? 
          this.safeGetISOString(taskData.deadline) : 
          taskData.deadline
      } as Task;
      
      // Update task status to awaiting approval in Firestore
      console.log(`TaskService: Updating task ${taskId} to AWAITING_APPROVAL status`);
      
      // Create verification data (undefined alanları temizle)
      const verificationData: TaskVerification = removeUndefinedFields({
        id: Math.random().toString(),
        taskId: taskId,
        userId: userId,
        status: TaskVerificationStatus.PENDING,
        createdAt: new Date().toISOString(),
        imageUrl: verification.imageUrl,
        note: verification.note,
        location: verification.location
      }) as TaskVerification;
      
      console.log('Prepared verification data:', JSON.stringify(verificationData, null, 2));
      
      // Get existing verifications array or create empty array
      const existingVerifications = Array.isArray(taskData.verifications) ? taskData.verifications : [];
      
      // Prepare the update data with all required fields (undefined alanları temizle)
      const updateData = removeUndefinedFields({
        status: 'AWAITING_APPROVAL',
        completedBy: {
          id: userId,
          name: verification.note || 'Unknown User',
          completedAt: Timestamp.now()
        },
        approvalStatus: 'PENDING',
        verifications: [...existingVerifications, verificationData],
        assignedTo: taskData.assignedTo || userId
      });
      
      // Log the final update data
      console.log('Final update data:', JSON.stringify(updateData, null, 2));
      
      // Update the document with the new status and verification
      await updateDoc(docRef, updateData);
      
      console.log(`TaskService: Task ${taskId} updated to AWAITING_APPROVAL status`);
      
      // Return the updated task
      return {
        ...task,
        status: 'AWAITING_APPROVAL',
        completedBy: {
          id: userId,
          name: verification.note || 'Unknown User',
          completedAt: new Date().toISOString()
        },
        approvalStatus: 'PENDING',
        verifications: [...(task.verifications || []), verificationData]
      };
    } catch (error) {
      console.error(`TaskService: Error in verifyAndCompleteTask:`, error);
      // Log the full error details
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      throw error;
    }
  }

  async rejectTask(taskId: string, approverId: string, approverName: string, reason?: string): Promise<Task> {
    try {
      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', approverId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      if (userData.role !== 'admin') {
        throw new Error('Only admin users can reject tasks');
      }

      // Get the task
      const taskDoc = await getDoc(doc(db, this.tasksCollection, taskId));
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const taskData = taskDoc.data();
      if (taskData.status !== 'AWAITING_APPROVAL') {
        throw new Error('Task is not awaiting approval');
      }

      // Update task status back to IN_PROGRESS and mark as rejected
      const updateData = {
        status: 'IN_PROGRESS' as TaskStatus,
        approvalStatus: 'REJECTED' as ApprovalStatus,
        approvedBy: {
          id: approverId,
          name: approverName,
          approvedAt: Timestamp.now().toDate().toISOString()
        },
        rejectionReason: reason || 'No reason provided'
      };

      await updateDoc(doc(db, this.tasksCollection, taskId), updateData);

      // Convert to Task type with all required fields
      const task: Task = {
        id: taskDoc.id,
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        location: taskData.location,
        xpReward: taskData.xpReward,
        status: updateData.status,
        approvalStatus: updateData.approvalStatus,
        approvedBy: updateData.approvedBy,
        rejectionReason: updateData.rejectionReason,
        createdAt: taskData.createdAt?.toDate?.() ? 
          this.safeGetISOString(taskData.createdAt) : 
          taskData.createdAt,
        deadline: taskData.deadline?.toDate?.() ? 
          this.safeGetISOString(taskData.deadline) : 
          taskData.deadline
      };

      return task;
    } catch (error) {
      console.error('Error rejecting task:', error);
      throw error;
    }
  }

  async getEmergencyTasks(): Promise<Task[]> {
    try {
      console.log("TaskService: Getting emergency tasks");
      
      // Önce özel bir hata mesajı için Firebase indexing hatası olup olmadığını kontrol edeceğiz
      const isFirebaseIndexError = (error: any): boolean => {
        return error && error.message && 
          (error.message.includes('The query requires an index') || 
           error.message.includes('FAILED_PRECONDITION') || 
           error.message.includes('index.html'));
      };
      
      try {
        // İki koşullu sorgu kullan - isEmergency true ve status COMPLETED olmayan
        console.log("TaskService: Executing Firestore query for non-completed emergency tasks");
        const q = query(
          collection(db, this.tasksCollection),
          where('isEmergency', '==', true),
          where('status', '!=', 'COMPLETED')
        );
        
        console.log("TaskService: Query created, executing getDocs");
        const querySnapshot = await getDocs(q);
        console.log(`TaskService: Found ${querySnapshot.size} non-completed emergency tasks in Firestore`);
        
        // Hata ayıklama için Firestore belgelerini ayrıntılı olarak göster
        if (querySnapshot.size === 0) {
          console.log("TaskService: No emergency tasks found in Firestore with isEmergency=true and status!=COMPLETED");
          
          // Eğer hiç acil durum yoksa, kontrol için tüm görevleri al ve isEmergency alanını kontrol et
          try {
            const allTasksSnapshot = await getDocs(collection(db, this.tasksCollection));
            console.log(`TaskService: Found total ${allTasksSnapshot.size} tasks in Firestore`);
            
            // isEmergency alanına sahip kaç görev var kontrol et
            const tasksWithEmergencyField = allTasksSnapshot.docs.filter(doc => 
              doc.data().hasOwnProperty('isEmergency')
            );
            
            console.log(`TaskService: ${tasksWithEmergencyField.length} tasks have 'isEmergency' field`);
            
            // isEmergency=true olan görevleri manuel olarak filtrele
            const emergencyTasks = allTasksSnapshot.docs.filter(doc => {
              const data = doc.data() as Record<string, any>;
              return data.isEmergency === true && data.status !== 'COMPLETED';
            });
            
            console.log(`TaskService: Manual filter found ${emergencyTasks.length} tasks with isEmergency=true and not completed`);
            
            // Manuel filtrelem ile bulunan acil görevleri döndür
            if (emergencyTasks.length > 0) {
              return emergencyTasks.map(doc => {
                const data = doc.data() as Record<string, any>;
                return {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate ? 
                    this.safeGetISOString(data.createdAt) : 
                    data.createdAt,
                  deadline: data.deadline?.toDate ? 
                    this.safeGetISOString(data.deadline) : 
                    data.deadline
                } as Task;
              });
            }
          } catch (checkError) {
            console.error("TaskService: Error while checking all tasks:", checkError);
          }
        }
        
        // Firestore'dan gelen verileri işle
        const tasks = querySnapshot.docs.map(doc => {
          const data = doc.data() as Record<string, any>;
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? 
              this.safeGetISOString(data.createdAt) : 
              data.createdAt,
            deadline: data.deadline?.toDate ? 
              this.safeGetISOString(data.deadline) : 
              data.deadline
          } as Task;
        }).filter(task => task !== null) as Task[];
        
        // Tarih sırasına göre manuel sırala
        tasks.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        console.log(`TaskService: Processed ${tasks.length} valid emergency tasks`);
        
        // İlk birkaç görevi log'a detaylı yazdır
        if (tasks.length > 0) {
          console.log("TaskService: Sample of processed emergency tasks:");
          tasks.slice(0, 2).forEach((task, idx) => {
            console.log(`TaskService: Task ${idx + 1}: ID=${task.id}, Title=${task.title}, Status=${task.status}`);
          });
        }
        
        return tasks;
      } catch (firestoreError) {
        console.error("TaskService: Firestore error in getEmergencyTasks:", firestoreError);
        
        // Eğer hata bir index hatası ise, özel bir mesaj göster
        if (isFirebaseIndexError(firestoreError)) {
          console.log("TaskService: This is a Firebase index error. Please create the required index from the Firebase console.");
          console.log("TaskService: The index URL might be in the error message above.");
        }
        
        // Hata durumunda sadece id ve isEmergency alanını filtreleyen basit bir sorgu dene
        try {
          console.log("TaskService: Attempting fallback query without complex filtering");
          const fallbackSnapshot = await getDocs(collection(db, this.tasksCollection));
          
          // Bellek içinde filtrele
          const emergencyTasks = fallbackSnapshot.docs
            .filter(doc => {
              const data = doc.data() as Record<string, any>;
              return data.isEmergency === true && data.status !== 'COMPLETED';
            })
            .map(doc => {
              const data = doc.data() as Record<string, any>;
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? 
                  this.safeGetISOString(data.createdAt) : 
                  data.createdAt,
                deadline: data.deadline?.toDate ? 
                  this.safeGetISOString(data.deadline) : 
                  data.deadline
              } as Task;
            });
          
          // Tarih sırasına göre manuel sırala
          emergencyTasks.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          
          console.log(`TaskService: Retrieved ${emergencyTasks.length} emergency tasks via fallback query`);
          return emergencyTasks;
        } catch (fallbackError) {
          console.error("TaskService: Fallback query also failed:", fallbackError);
          return []; // Boş dizi döndür
        }
      }
    } catch (error) {
      console.error('TaskService: General error in getEmergencyTasks:', error);
      // Hiçbir şekilde veri alınamadıysa boş dizi döndür
      return [];
    }
  }

  // Add this helper method to safely get ISO string from Firestore timestamps
  private safeGetISOString(timestampObj: any): string {
    try {
      return timestampObj.toDate().toISOString();
    } catch (error) {
      console.warn('Invalid date conversion:', error);
      return new Date().toISOString(); // Return current date as fallback
    }
  }
} 