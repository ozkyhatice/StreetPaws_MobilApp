export enum TaskVerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface TaskVerification {
  id: string;
  taskId: string;
  userId: string;
  status: TaskVerificationStatus;
  createdAt: string;
  imageUrl?: string;
  note?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  reviewerId?: string;
  reviewNote?: string;
} 