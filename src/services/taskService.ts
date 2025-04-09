import { Task, TaskStatus, TaskCategory } from '../types/task';

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
    category: 'FEEDING',
    xpReward: 100,
    images: ['https://picsum.photos/200']
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
    category: 'SHELTER',
    xpReward: 200,
    images: ['https://picsum.photos/200']
  }
];

export const getTasks = async (): Promise<Task[]> => {
  return mockTasks;
};

export const getTask = async (id: string): Promise<Task | null> => {
  return mockTasks.find(task => task.id === id) || null;
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
  private tasks: Task[] = [
    {
      id: '1',
      title: 'Sokak Hayvanlarını Besle',
      description: 'Mahallemizdeki sokak hayvanlarını beslemek için yardıma ihtiyacımız var.',
      status: 'OPEN',
      category: 'FEEDING',
      location: {
        latitude: 41.0082,
        longitude: 28.9784,
        address: 'Taksim Meydanı, İstanbul'
      },
      xpReward: 100,
      images: ['https://picsum.photos/200']
    },
    {
      id: '2',
      title: 'Veteriner Ziyareti',
      description: 'Yaralı bir kedi için veteriner ziyareti gerekiyor.',
      status: 'IN_PROGRESS',
      category: 'HEALTH',
      location: {
        latitude: 41.0422,
        longitude: 29.0089,
        address: 'Beşiktaş, İstanbul'
      },
      xpReward: 150,
      images: ['https://picsum.photos/200']
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
    return this.tasks.find(task => task.id === id) || null;
  }

  async assignTask(taskId: string, userId: string): Promise<void> {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      assignedTo: userId,
      status: 'IN_PROGRESS'
    };
  }

  async unassignTask(taskId: string): Promise<void> {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      assignedTo: undefined,
      status: 'OPEN'
    };
  }

  async completeTask(taskId: string): Promise<void> {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      status: 'COMPLETED'
    };
  }
} 