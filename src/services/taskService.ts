import { Task, TaskStatus, TaskCategory } from '../types/task';
import { TaskVerification, TaskVerificationStatus } from '../types/taskVerification';
import { collection, query, where, orderBy, getDocs, addDoc, doc, getDoc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EmergencyRequest } from '../services/emergencyService';
import { XPService } from './xpService';

// Firestore'a gönderilecek objelerde undefined alanları temizler
function removeUndefinedFields<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}

export class TaskService {
  private static instance: TaskService;
  private readonly tasksCollection = 'tasks';
  
  private constructor() {}

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  async getTasks(filters?: Partial<Task>): Promise<Task[]> {
    try {
      console.log("TaskService: Getting regular tasks");
      
      // Build Firestore query
      let firebaseQuery;
      try {
        // Start with a query that excludes completed tasks by default
        console.log("TaskService: Creating Firestore query for tasks");
        
        // Create base query
        const baseQuery = query(
          collection(db, this.tasksCollection),
          where('status', '!=', 'COMPLETED') // Filter out completed tasks by default
        );
        
        firebaseQuery = baseQuery;
        
        // Apply additional filters if provided
        if (filters) {
          // If explicitly requesting completed tasks, use a different query
          if (filters.status === 'COMPLETED') {
            console.log("TaskService: Explicitly requesting COMPLETED tasks");
            firebaseQuery = query(
              collection(db, this.tasksCollection),
              where('status', '==', 'COMPLETED')
            );
          }
          
          // Other filters can be applied in memory after fetching from Firestore
        }
        
        // Execute query
        console.log("TaskService: Executing Firestore query");
        const querySnapshot = await getDocs(firebaseQuery);
        console.log(`TaskService: Retrieved ${querySnapshot.size} tasks from Firestore`);
        
        // Process results
        let tasks = querySnapshot.docs.map(doc => {
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
        
        // Apply any remaining filters in memory
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            // Skip the status filter which was already handled in the query
            if (key !== 'status' || (key === 'status' && value !== 'COMPLETED')) {
              tasks = tasks.filter(task => task[key as keyof Task] === value);
            }
          });
        }
        
        // Sort tasks by creation date (newest first)
        tasks.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        console.log(`TaskService: Returning ${tasks.length} filtered tasks`);
        return tasks;
      } catch (firestoreError) {
        console.error("TaskService: Error querying Firestore:", firestoreError);
        // Return empty array for Firestore errors - never use mock data
        return [];
      }
    } catch (error) {
      console.error("TaskService: General error in getTasks:", error);
      // Return empty array in case of error
      return [];
    }
  }

  async getTask(id: string): Promise<Task | null> {
    console.log(`TaskService instance getTask called with id: ${id}`);
    
    if (!id) {
      console.warn("getTask called without an ID");
      return null;
    }
    
    try {
      // Try to get the task from Firestore
      console.log(`Trying to fetch task ${id} from Firestore`);
      const docRef = doc(db, this.tasksCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`Found task in Firestore: ${data.title}`);
        
        const task = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? 
            this.safeGetISOString(data.createdAt) : 
            data.createdAt,
          deadline: data.deadline?.toDate ? 
            this.safeGetISOString(data.deadline) : 
            data.deadline
        } as Task;
        
        return task;
      }
      
      console.log(`Task ${id} not found in Firestore`);
      return null;
    } catch (error) {
      console.error(`Error fetching task from Firestore: ${error.message}`);
      return null;
    }
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

  private getCategoryFromEmergency(emergency: EmergencyRequest): TaskCategory {
    if (emergency.animalType?.toLowerCase().includes('kedi') || 
        emergency.animalType?.toLowerCase().includes('köpek')) {
      return 'HEALTH';
    }
    return 'OTHER';
  }

  private getEmergencyLevel(urgency: string): 'CRITICAL' | 'URGENT' | 'NORMAL' {
    switch (urgency) {
      case 'critical': return 'CRITICAL';
      case 'high': return 'CRITICAL';
      case 'medium': return 'URGENT';
      default: return 'NORMAL';
    }
  }

  private getXpRewardFromUrgency(urgency: string): number {
    switch (urgency) {
      case 'critical': return 350;
      case 'high': return 300;
      case 'medium': return 200;
      default: return 100;
    }
  }

  private getPriorityFromEmergency(urgency: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (urgency) {
      case 'critical': return 'HIGH';
      case 'high': return 'HIGH';
      case 'medium': return 'MEDIUM';
      default: return 'LOW';
    }
  }

  private isUrgencyEmergency(urgency: string): boolean {
    // Tüm acil durum isteklerinin isEmergency alanı true olmalı
    return true;
    
    // Artık sadece belirli aciliyet seviyeleri değil, tüm acil istekler acil görev olarak işaretleniyor
    // switch (urgency) {
    //   case 'critical': return true;
    //   case 'high': return true;
    //   default: return false;
    // }
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

  async approveTask(taskId: string, approverId: string, approverName: string, note?: string): Promise<void> {
    try {
      const taskRef = doc(db, this.tasksCollection, taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('Görev bulunamadı');
      }
      
      const taskData = taskDoc.data();
      
      // Update task status and add approval info
      await updateDoc(taskRef, {
        status: 'COMPLETED',
        approvedBy: {
          id: approverId,
          name: approverName,
          approvedAt: new Date().toISOString(),
          note: note || null
        },
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error approving task:', error);
      throw error;
    }
  }

  private async updateUserAchievementForTask(task: Task): Promise<void> {
    if (!task.completedBy || !task.completedBy.id) {
      console.warn('No completedBy information in task');
      return;
    }
    
    try {
      const userId = task.completedBy.id;
      const category = task.category;
      
      console.log(`Updating achievements for user ${userId} for category ${category}`);
      
      // Firestore'dan kullanıcı verilerini al
      try {
        // Kullanıcı istatistiklerini güncelle
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // Kategori bazlı sayaç alanını belirle
          const categoryField = `achievements.${category.toLowerCase()}`;
          
          // Kullanıcının kategori bazlı tamamlanan görev sayısını ve toplam görev sayısını güncelle
          await updateDoc(userRef, {
            [categoryField]: increment(1),
            'stats.tasksCompleted': increment(1)
          });
          
          console.log(`TaskService: User stats updated in Firestore for user ${userId}`);
          
          // Tamamlanan görevin kategorisine göre XPService üzerinden kategori sayacını da güncelle
          // Bu işlem, kategori bazlı rozetlerin kazanılmasını kontrol edecek
          const xpService = XPService.getInstance();
          await xpService.updateTaskProgressForCategory(userId, category);
          
          console.log(`TaskService: Updated task progress for category ${category}`);
        } else {
          console.log(`TaskService: User ${userId} not found in Firestore, skipping stats update`);
        }
      } catch (error) {
        console.error(`TaskService: Error updating user stats in Firestore: ${error.message}`);
      }
      
      // XP ödülünü ver
      const xpService = XPService.getInstance();
      
      if (task.isEmergency) {
        // Acil görev için XP ekle
        await xpService.addTaskCompletionXP(
          userId, 
          task.id, 
          task.title, 
          true, 
          task.emergencyLevel
        );
        console.log(`TaskService: Added XP for emergency task completion to user ${userId}`);
      } else {
        // Normal görev için XP ekle
        await xpService.addTaskCompletionXP(
          userId,
          task.id,
          task.title,
          false
        );
        console.log(`TaskService: Added XP for normal task completion to user ${userId}`);
      }
      
      console.log(`TaskService: Successfully updated achievements and XP for user ${userId}`);
    } catch (error) {
      console.error('Error updating user achievement:', error);
      throw error;
    }
  }

  async rejectTask(taskId: string, approverId: string, approverName: string, reason?: string): Promise<Task> {
    // const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    // if (taskIndex === -1) throw new Error('Task not found');
    
    // const task = this.tasks[taskIndex];
    
    // if (task.status !== 'AWAITING_APPROVAL') {
    //   throw new Error('Task is not awaiting approval');
    // }
    
    console.log(`Rejecting task ${taskId} by user ${approverId} (${approverName})`);
    
    // Update task status back to IN_PROGRESS and mark as rejected
    // this.tasks[taskIndex] = {
    //   ...this.tasks[taskIndex],
    //   status: 'IN_PROGRESS',
    //   approvalStatus: 'REJECTED',
    //   approvedBy: {
    //     id: approverId,
    //     name: approverName,
    //     approvedAt: new Date().toISOString()
    //   },
    //   rejectionReason: reason
    // };
    
    // Firestore güncellemesi (gerçek uygulamada)
    // await updateDoc(doc(db, this.tasksCollection, taskId), {
    //   status: 'IN_PROGRESS',
    //   approvalStatus: 'REJECTED',
    //   approvedBy: {
    //     id: approverId,
    //     name: approverName,
    //     approvedAt: Timestamp.now()
    //   },
    //   rejectionReason: reason
    // });
    
    throw new Error('Task not found');
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