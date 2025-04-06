export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  location: TaskLocation;
  deadline?: string;
  xpReward: number;
  assignedTo?: string;
  images?: string[];
  verifications?: TaskVerification[];
}

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskCategory = 'FEEDING' | 'CLEANING' | 'HEALTH' | 'SHELTER' | 'OTHER';

export interface TaskLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface TaskVerification {
  type: VerificationType;
  required: boolean;
}

export type VerificationType = 'PHOTO' | 'LOCATION' | 'QR_CODE' | 'TIME_TRACKED';

export interface TaskFilter {
  status?: TaskStatus;
  category?: TaskCategory;
  searchText?: string;
  [key: string]: any;
} 