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