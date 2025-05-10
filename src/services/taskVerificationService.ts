import { TaskVerification, TaskVerificationStatus } from '../types/taskVerification';

// Mock verifications data
const mockVerifications: TaskVerification[] = [];

interface VerificationData {
  taskId: string;
  userId: string;
  imageUrl: string;
  note?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export async function uploadVerificationImage(imageUri: string): Promise<string> {
  // Mock implementation that simply returns the URI
  // In a real app, this would upload to a storage service and return the URL
  console.log('Uploading image:', imageUri);
  return imageUri;
}

export async function submitTaskVerification(data: VerificationData): Promise<void> {
  // Mock implementation to simulate submitting verification data
  console.log('Submitting verification data:', data);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return;
}

export const getTaskVerifications = async (taskId: string): Promise<TaskVerification[]> => {
  return mockVerifications.filter(v => v.taskId === taskId);
};

export const getUserVerifications = async (userId: string): Promise<TaskVerification[]> => {
  return mockVerifications.filter(v => v.userId === userId);
};

export const updateVerificationStatus = async (
  verificationId: string,
  status: TaskVerificationStatus
): Promise<void> => {
  const index = mockVerifications.findIndex(v => v.id === verificationId);
  if (index !== -1) {
    mockVerifications[index] = {
      ...mockVerifications[index],
      status
    };
  }
};

// TaskVerificationService sınıfı
export class TaskVerificationService {
  private static instance: TaskVerificationService;
  private verifications: TaskVerification[] = [];

  private constructor() {}

  static getInstance(): TaskVerificationService {
    if (!TaskVerificationService.instance) {
      TaskVerificationService.instance = new TaskVerificationService();
    }
    return TaskVerificationService.instance;
  }

  async createVerification(data: {
    taskId: string;
    userId: string;
    imageUrl?: string;
    note?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }): Promise<TaskVerification> {
    const verification: TaskVerification = {
      id: Math.random().toString(),
      taskId: data.taskId,
      userId: data.userId,
      status: TaskVerificationStatus.PENDING,
      createdAt: new Date().toISOString(),
      imageUrl: data.imageUrl,
      note: data.note,
      location: data.location
    };

    this.verifications.push(verification);
    return verification;
  }

  async approveVerification(verificationId: string, reviewerId: string, reviewNote?: string): Promise<TaskVerification> {
    const index = this.verifications.findIndex(v => v.id === verificationId);
    if (index === -1) throw new Error('Verification not found');

    this.verifications[index] = {
      ...this.verifications[index],
      status: TaskVerificationStatus.APPROVED,
      reviewerId,
      reviewNote
    };

    return this.verifications[index];
  }

  async rejectVerification(verificationId: string, reviewerId: string, reviewNote: string): Promise<TaskVerification> {
    const index = this.verifications.findIndex(v => v.id === verificationId);
    if (index === -1) throw new Error('Verification not found');

    this.verifications[index] = {
      ...this.verifications[index],
      status: TaskVerificationStatus.REJECTED,
      reviewerId,
      reviewNote
    };

    return this.verifications[index];
  }

  async getVerification(verificationId: string): Promise<TaskVerification | null> {
    return this.verifications.find(v => v.id === verificationId) || null;
  }

  async getTaskVerifications(taskId: string): Promise<TaskVerification[]> {
    return this.verifications.filter(v => v.taskId === taskId);
  }

  async getUserVerifications(userId: string): Promise<TaskVerification[]> {
    return this.verifications.filter(v => v.userId === userId);
  }
} 