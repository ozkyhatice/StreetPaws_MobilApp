import { Task, TaskStatus, TaskCategory } from '../types/task';
import { collection, query, where, orderBy, getDocs, addDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EmergencyRequest } from '../services/emergencyService';
import { XPService } from './xpService';

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Sokak Kedilerini Besle',
    description: 'Mahallendeki sokak kedilerini besle ve fotoğrafını çek',
    location: {
      latitude: 41.0082,
      longitude: 28.9784,
      address: 'Taksim Meydanı, İstanbul'
    },
    status: 'OPEN',
    priority: 'HIGH',
    category: 'FEEDING',
    xpReward: 100,
    images: ['https://picsum.photos/seed/cat1/400/300'],
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 86400000).toISOString(),
    createdBy: {
      id: '1',
      name: 'Hayvansever Derneği'
    }
  },
  {
    id: '2',
    title: 'Köpek Kulübesi Yap',
    description: 'Sokak köpekleri için kulübe yap',
    location: {
      latitude: 41.0082,
      longitude: 28.9784,
      address: 'Beşiktaş, İstanbul'
    },
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    category: 'SHELTER',
    xpReward: 200,
    images: ['https://picsum.photos/seed/dog1/400/300'],
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 172800000).toISOString(),
    createdBy: {
      id: '1',
      name: 'Hayvansever Derneği'
    }
  },
  {
    id: '3',
    title: 'Sahildeki Hayvanları Besle',
    description: 'Kadıköy sahilindeki kedi ve köpekleri besle',
    location: {
      latitude: 40.9914,
      longitude: 29.0303,
      address: 'Kadıköy Sahil, İstanbul'
    },
    status: 'OPEN',
    priority: 'LOW',
    category: 'FEEDING',
    xpReward: 80,
    images: ['https://picsum.photos/seed/beach/400/300'],
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 259200000).toISOString(),
    createdBy: {
      id: '1',
      name: 'Hayvansever Derneği'
    }
  }
];

export const getTasks = async (): Promise<Task[]> => {
  return mockTasks;
};

export const getTask = async (id: string): Promise<Task | null> => {
  console.log(`Global getTask called with id: ${id}`);
  
  if (!id) {
    console.warn("getTask called without an ID");
    return null;
  }
  
  const task = mockTasks.find(task => {
    console.log(`Comparing task id: ${task.id} with requested id: ${id}`);
    return task.id === id || task.id.toString() === id.toString();
  });
  
  console.log(`Global getTask result:`, task ? task.title : "Not found");
  return task || null;
};

export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  const newTask: Task = {
    ...task,
    id: Math.random().toString()
  };
  mockTasks.push(newTask);
  return newTask;
};

export const updateTask = async (id: string, task: Partial<Task>): Promise<Task> => {
  const index = mockTasks.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Task not found');
  
  mockTasks[index] = { ...mockTasks[index], ...task };
  return mockTasks[index];
};

export const deleteTask = async (id: string): Promise<void> => {
  const index = mockTasks.findIndex(t => t.id === id);
  if (index !== -1) {
    mockTasks.splice(index, 1);
  }
};

export class TaskService {
  private static instance: TaskService;
  private readonly tasksCollection = 'tasks';
  public tasks: Task[] = [
    {
      id: '1',
      title: 'Sokak Hayvanlarını Besle',
      description: 'Mahallemizdeki sokak hayvanlarını beslemek için yardıma ihtiyacımız var.',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'FEEDING',
      location: {
        latitude: 41.0082,
        longitude: 28.9784,
        address: 'Taksim Meydanı, İstanbul'
      },
      xpReward: 100,
      images: ['https://picsum.photos/seed/animal1/400/300'],
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 86400000).toISOString(),
      createdBy: {
        id: '1',
        name: 'Hayvansever Derneği'
      }
    },
    {
      id: '2',
      title: 'Veteriner Ziyareti',
      description: 'Yaralı bir kedi için veteriner ziyareti gerekiyor.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'HEALTH',
      location: {
        latitude: 41.0422,
        longitude: 29.0089,
        address: 'Beşiktaş, İstanbul'
      },
      xpReward: 150,
      images: ['https://picsum.photos/seed/vet/400/300'],
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 43200000).toISOString(),
      createdBy: {
        id: '1',
        name: 'Hayvansever Derneği'
      }
    },
    {
      id: '3',
      title: 'Sokak Köpeklerinin Aşılanması',
      description: 'Kadıköy bölgesindeki sokak köpeklerinin aşılanması gerekiyor.',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'HEALTH',
      location: {
        latitude: 40.9914,
        longitude: 29.0303,
        address: 'Kadıköy, İstanbul'
      },
      xpReward: 200,
      images: ['https://picsum.photos/seed/vaccine/400/300'],
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 172800000).toISOString(),
      createdBy: {
        id: '1',
        name: 'Hayvansever Derneği'
      }
    },
    {
      id: 'emergency_1',
      title: 'ACİL: Yaralı Kedi Yardım',
      description: 'Kadıköy meydanda yaralı bir kedi bulundu. Acil müdahale gerekiyor!',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'HEALTH',
      location: {
        latitude: 40.9920,
        longitude: 29.0310,
        address: 'Kadıköy Meydan, İstanbul'
      },
      xpReward: 300,
      images: ['https://picsum.photos/seed/emergency1/400/300'],
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 7200000).toISOString(),
      isEmergency: true,
      emergencyLevel: 'CRITICAL',
      createdBy: {
        id: '1',
        name: 'Hayvansever Derneği'
      }
    },
    {
      id: 'emergency_2',
      title: 'ACİL: Aç Köpek Sürüsü',
      description: 'Beşiktaş parkında aç köpekler var, acil mama yardımı gerekiyor.',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'FEEDING',
      location: {
        latitude: 41.0422,
        longitude: 29.0085,
        address: 'Beşiktaş Parkı, İstanbul'
      },
      xpReward: 200,
      images: ['https://picsum.photos/seed/emergency2/400/300'],
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 14400000).toISOString(),
      isEmergency: true,
      emergencyLevel: 'URGENT',
      createdBy: {
        id: '1',
        name: 'Hayvansever Derneği'
      }
    }
  ];
  
  private constructor() {}

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  async getTasks(filters?: Partial<Task>): Promise<Task[]> {
    let filteredTasks = [...this.tasks];
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        filteredTasks = filteredTasks.filter(task => 
          task[key as keyof Task] === filters[key as keyof Task]
        );
      });
    }
    
    return filteredTasks;
  }

  async getTask(id: string): Promise<Task | null> {
    console.log(`TaskService instance getTask called with id: ${id}`);
    
    if (!id) {
      console.warn("getTask called without an ID");
      return null;
    }
    
    // Önce sınıf içindeki tasks array'inde hem id hem de string olarak ara
    const instanceTask = this.tasks.find(task => {
      console.log(`Comparing instance task id: ${task.id} with requested id: ${id}`);
      return task.id === id || task.id.toString() === id.toString();
    });
    
    if (instanceTask) {
      console.log(`Found task in instance tasks: ${instanceTask.title}`);
      return instanceTask;
    }
    
    // Eğer bulunamazsa global mockTasks'da ara
    console.log(`No task found in instance tasks with id: ${id}, checking mockTasks`);
    const mockTask = mockTasks.find(task => {
      console.log(`Comparing mock task id: ${task.id} with requested id: ${id}`);
      return task.id === id || task.id.toString() === id.toString();
    });
    
    if (mockTask) {
      console.log(`Found task in mockTasks: ${mockTask.title}`);
      return mockTask;
    }
    
    console.warn(`Task with id ${id} not found in any source`);
    return null;
  }

  async createEmergencyTask(emergency: EmergencyRequest): Promise<Task> {
    // Acil durumdan görev oluştur
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
      isEmergency: true,
      emergencyLevel: this.getEmergencyLevel(emergency.urgency),
      images: emergency.imageUrl ? [emergency.imageUrl] : [],
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 7200000).toISOString(), // 2 saat sonra
      createdBy: {
        id: emergency.userId,
        name: emergency.userName
      }
    };

    try {
      // Firestore'a ekle
      const docRef = await addDoc(collection(db, this.tasksCollection), {
        ...task,
        createdAt: Timestamp.fromDate(new Date(task.createdAt)),
        deadline: Timestamp.fromDate(new Date(task.deadline))
      });
      const taskWithId = { ...task, id: docRef.id };
      
      console.log(`Created emergency task with ID: ${taskWithId.id}`);
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

  private getPriorityFromEmergency(urgency: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (urgency) {
      case 'high': return 'HIGH';
      case 'medium': return 'MEDIUM';
      default: return 'LOW';
    }
  }

  private getEmergencyLevel(urgency: string): 'CRITICAL' | 'URGENT' | 'NORMAL' {
    switch (urgency) {
      case 'high': return 'CRITICAL';
      case 'medium': return 'URGENT';
      default: return 'NORMAL';
    }
  }

  private getXpRewardFromUrgency(urgency: string): number {
    switch (urgency) {
      case 'high': return 300;
      case 'medium': return 200;
      default: return 100;
    }
  }

  async assignTask(taskId: string, userId: string): Promise<void> {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    console.log(`Assigning task ${taskId} to user ${userId}`);
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      assignedTo: userId,
      status: 'IN_PROGRESS'
    };
    
    // Firestore güncellemesi (gerçek uygulamada)
    // await updateDoc(doc(db, this.tasksCollection, taskId), {
    //   assignedTo: userId,
    //   status: 'IN_PROGRESS'
    // });
  }

  async unassignTask(taskId: string): Promise<void> {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    console.log(`Unassigning task ${taskId}`);
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      assignedTo: undefined,
      status: 'OPEN'
    };
    
    // Firestore güncellemesi (gerçek uygulamada)
    // await updateDoc(doc(db, this.tasksCollection, taskId), {
    //   assignedTo: firebase.firestore.FieldValue.delete(),
    //   status: 'OPEN'
    // });
  }

  async completeTask(taskId: string, userId: string, userName: string): Promise<void> {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    console.log(`Completing task ${taskId} by user ${userId} (${userName})`);
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      status: 'AWAITING_APPROVAL',
      completedBy: {
        id: userId,
        name: userName,
        completedAt: new Date().toISOString()
      },
      approvalStatus: 'PENDING'
    };
    
    // Firestore güncellemesi (gerçek uygulamada)
    // await updateDoc(doc(db, this.tasksCollection, taskId), {
    //   status: 'AWAITING_APPROVAL',
    //   completedBy: {
    //     id: userId,
    //     name: userName,
    //     completedAt: Timestamp.now()
    //   },
    //   approvalStatus: 'PENDING'
    // });
  }

  async verifyAndCompleteTask(taskId: string, userId: string, verification: any): Promise<Task> {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    const task = this.tasks[taskIndex];
    
    if (task.assignedTo !== userId) {
      throw new Error('Task is not assigned to this user');
    }
    
    if (task.status !== 'IN_PROGRESS') {
      throw new Error('Task is not in progress');
    }
    
    console.log(`Verifying and completing task ${taskId} by user ${userId}`);
    
    // Update task status to awaiting approval
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      status: 'AWAITING_APPROVAL',
      completedBy: {
        id: userId,
        name: verification.userName || 'User Name',
        completedAt: new Date().toISOString()
      },
      approvalStatus: 'PENDING',
      verifications: [...(task.verifications || []), verification]
    };
    
    // Firestore güncellemesi (gerçek uygulamada)
    // await updateDoc(doc(db, this.tasksCollection, taskId), {
    //   status: 'AWAITING_APPROVAL',
    //   completedBy: {
    //     id: userId,
    //     name: verification.userName || 'User Name',
    //     completedAt: Timestamp.now()
    //   },
    //   approvalStatus: 'PENDING',
    //   verifications: firebase.firestore.FieldValue.arrayUnion(verification)
    // });
    
    return this.tasks[taskIndex];
  }

  async approveTask(taskId: string, approverId: string, approverName: string): Promise<Task> {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    const task = this.tasks[taskIndex];
    
    if (task.status !== 'AWAITING_APPROVAL') {
      throw new Error('Task is not awaiting approval');
    }
    
    console.log(`Approving task ${taskId} by user ${approverId} (${approverName})`);
    
    // Update task status to completed and approval status
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      status: 'COMPLETED',
      approvalStatus: 'APPROVED',
      approvedBy: {
        id: approverId,
        name: approverName,
        approvedAt: new Date().toISOString()
      }
    };
    
    // Firestore güncellemesi (gerçek uygulamada)
    // await updateDoc(doc(db, this.tasksCollection, taskId), {
    //   status: 'COMPLETED',
    //   approvalStatus: 'APPROVED',
    //   approvedBy: {
    //     id: approverId,
    //     name: approverName,
    //     approvedAt: Timestamp.now()
    //   }
    // });
    
    // Görevi tamamlayan kullanıcının achievement'larını güncelle
    await this.updateUserAchievementForTask(task);
    
    return this.tasks[taskIndex];
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
      
      // Firestore'dan kullanıcı verilerini al (gerçek uygulamada)
      // const userDoc = await getDoc(doc(db, 'users', userId));
      // const userData = userDoc.data();
      
      // Kullanıcı istatistiklerini güncelle (gerçek uygulamada)
      // const categoryField = `achievements.${category.toLowerCase()}`;
      // await updateDoc(doc(db, 'users', userId), {
      //   [categoryField]: increment(1),
      //   'stats.tasksCompleted': increment(1)
      // });
      
      // Simülasyon için konsola yazdır
      console.log(`✅ Achievement updated for user ${userId}: ${category} category count incremented`);
      
      // XP ödülünü ver (acil durumlar için ekstra XP)
      if (task.isEmergency) {
        const xpService = XPService.getInstance();
        await xpService.addTaskCompletionXP(
          userId, 
          task.id, 
          task.title, 
          true, 
          task.emergencyLevel
        );
      }
    } catch (error) {
      console.error('Error updating user achievement:', error);
      throw error;
    }
  }

  async rejectTask(taskId: string, approverId: string, approverName: string, reason?: string): Promise<Task> {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    const task = this.tasks[taskIndex];
    
    if (task.status !== 'AWAITING_APPROVAL') {
      throw new Error('Task is not awaiting approval');
    }
    
    console.log(`Rejecting task ${taskId} by user ${approverId} (${approverName})`);
    
    // Update task status back to IN_PROGRESS and mark as rejected
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      status: 'IN_PROGRESS',
      approvalStatus: 'REJECTED',
      approvedBy: {
        id: approverId,
        name: approverName,
        approvedAt: new Date().toISOString()
      },
      rejectionReason: reason
    };
    
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
    
    return this.tasks[taskIndex];
  }

  async getEmergencyTasks(): Promise<Task[]> {
    try {
      // Firestore sorgusu
      const q = query(
        collection(db, this.tasksCollection),
        where('isEmergency', '==', true),
        where('status', 'in', ['OPEN', 'IN_PROGRESS']),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          deadline: data.deadline?.toDate ? data.deadline.toDate().toISOString() : data.deadline
        } as Task;
      });
      
      // Simülasyon için yerel veri (yorum satırına alındı)
      /*
      return this.tasks.filter(task => 
        task.isEmergency === true && 
        (task.status === 'OPEN' || task.status === 'IN_PROGRESS')
      );
      */
    } catch (error) {
      console.error('Error getting emergency tasks:', error);
      throw error;
    }
  }
} 