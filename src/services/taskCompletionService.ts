import { TaskService } from './taskService';
import { TaskVerificationService } from './taskVerificationService';
import { XPService } from './xpService';
import { UserService } from './userService';
import { Task } from '../types/task';
import { TaskVerification, TaskVerificationStatus } from '../types/taskVerification';

export class TaskCompletionService {
  private static instance: TaskCompletionService;
  private taskService: TaskService;
  private verificationService: TaskVerificationService;
  private xpService: XPService;
  private userService: UserService;

  private constructor() {
    this.taskService = TaskService.getInstance();
    this.verificationService = TaskVerificationService.getInstance();
    this.xpService = XPService.getInstance();
    this.userService = UserService.getInstance();
  }

  static getInstance(): TaskCompletionService {
    if (!TaskCompletionService.instance) {
      TaskCompletionService.instance = new TaskCompletionService();
    }
    return TaskCompletionService.instance;
  }

  /**
   * Kullanıcının bir görevi üstlenmesini sağlayan fonksiyon
   */
  async assignTaskToUser(taskId: string, userId: string): Promise<Task> {
    try {
      console.log(`TaskCompletionService: Attempting to assign task ${taskId} to user ${userId}`);
      
      // Önce görevin var olduğunu kontrol et
      const taskBefore = await this.taskService.getTask(taskId);
      if (!taskBefore) {
        console.error(`Task with ID ${taskId} not found`);
        throw new Error('Görev bulunamadı');
      }
      
      console.log(`TaskCompletionService: Task found: ${taskBefore.title}`);
      
      // Görevin zaten atanmış olmadığını kontrol et
      if (taskBefore.assignedTo) {
        console.error(`Task ${taskId} is already assigned to user ${taskBefore.assignedTo}`);
        throw new Error('Bu görev zaten başka bir kullanıcıya atanmış');
      }
      
    // Görev atama işlemi
    await this.taskService.assignTask(taskId, userId);
      console.log(`TaskCompletionService: Task ${taskId} assigned to user ${userId}`);
    
    // Kullanıcının aktif görevini güncelleme
    await this.userService.updateUser(userId, { activeTask: taskId });
      console.log(`TaskCompletionService: User ${userId} activeTask updated to ${taskId}`);
    
    // Atanan görevi döndürür
    const task = await this.taskService.getTask(taskId);
      if (!task) {
        console.error(`Task ${taskId} not found after assignment`);
        throw new Error('Görev atama sonrası bulunamadı');
      }
    
      console.log(`TaskCompletionService: Successfully assigned task: ${task.title}`);
    return task;
    } catch (error) {
      console.error(`Error in assignTaskToUser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kullanıcının bir görevi tamamladığını bildiren fonksiyon
   * Görev için doğrulama oluşturur, durumu beklemeye alır
   */
  async submitTaskCompletion(
    taskId: string, 
    userId: string, 
    verificationData: {
      imageUrl?: string;
      note?: string;
      location?: {
        latitude: number;
        longitude: number;
      };
    }
  ): Promise<TaskVerification> {
    // Görevi kontrol et
    const task = await this.taskService.getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    if (task.assignedTo !== userId) {
      throw new Error('Task is not assigned to this user');
    }
    
    if (task.status !== 'IN_PROGRESS') {
      throw new Error('Task is not in progress');
    }
    
    // Doğrulama oluştur
    const verification = await this.verificationService.createVerification({
      taskId,
      userId,
      ...verificationData
    });
    
    // Kullanıcı adını al
    const user = await this.userService.getUserById(userId);
    const userName = user?.displayName || user?.username || 'Bilinmeyen Kullanıcı';
    
    // Görevin durumunu "COMPLETED" olarak güncelle (artık isim doğru olacak)
    await this.taskService.verifyAndCompleteTask(taskId, userId, { ...verification, userName });
    
    // Kullanıcının aktif görevini temizle
    await this.userService.updateUser(userId, { activeTask: undefined });
    
    return verification;
  }

  /**
   * Admin/yetkili tarafından görev tamamlanmasının onaylandığı fonksiyon
   * Onay verildiğinde kullanıcıya XP eklenir
   */
  async approveTaskCompletion(
    verificationId: string, 
    reviewerId: string, 
    reviewNote?: string
  ): Promise<void> {
    // Doğrulamayı onayla
    const verification = await this.verificationService.approveVerification(
      verificationId,
      reviewerId,
      reviewNote
    );
    
    // Görevi ve kullanıcıyı bul
    const task = await this.taskService.getTask(verification.taskId);
    if (!task) throw new Error('Task not found');
    
    // Kullanıcıya XP ekle
    await this.xpService.addTaskCompletionXP(verification.userId, task.title);
    
    // Kullanıcının tamamlanmış görevler listesine ekle ve istatistiklerini güncelle
    const user = await this.userService.getUserById(verification.userId);
    if (!user) throw new Error('User not found');
    
    await this.userService.updateUser(verification.userId, {
      completedTasks: [...(user.completedTasks || []), task.id]
    });
    
    await this.userService.updateUserStats(verification.userId, {
      ...user.stats,
      tasksCompleted: (user.stats.tasksCompleted || 0) + 1,
      xpPoints: (user.stats.xpPoints || 0) + task.xpReward
    });
  }

  /**
   * Admin/yetkili tarafından görev tamamlanmasının reddedildiği fonksiyon
   * Görev tekrar açık duruma getirilir
   */
  async rejectTaskCompletion(
    verificationId: string, 
    reviewerId: string, 
    reviewNote: string
  ): Promise<void> {
    // Doğrulamayı reddet
    const verification = await this.verificationService.rejectVerification(
      verificationId,
      reviewerId,
      reviewNote
    );
    
    // Görevi ve kullanıcıyı bul
    const task = await this.taskService.getTask(verification.taskId);
    if (!task) throw new Error('Task not found');
    
    // Görevi tekrar açık duruma getir
    await this.taskService.updateTask(task.id, {
      status: 'OPEN',
      assignedTo: undefined
    });
  }

  /**
   * Onay bekleyen tüm task doğrulamalarını getiren fonksiyon
   */
  async getPendingVerifications(): Promise<{
    verification: TaskVerification;
    task: Task;
  }[]> {
    // Tüm görevleri ve doğrulamaları al (gerçek uygulamada daha verimli bir yöntem kullanılacaktır)
    const tasks = await this.taskService.getTasks();
    
    const result: { verification: TaskVerification; task: Task }[] = [];
    
    for (const task of tasks) {
      const verifications = await this.verificationService.getTaskVerifications(task.id);
      
      for (const verification of verifications) {
        if (verification.status === TaskVerificationStatus.PENDING) {
          result.push({
            verification,
            task
          });
        }
      }
    }
    
    return result;
  }
} 