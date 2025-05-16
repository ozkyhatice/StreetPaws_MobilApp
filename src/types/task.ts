import { TaskVerification } from './taskVerification';

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
  completedBy?: {
    id: string;
    name: string;
    completedAt: string;
  };
  approvalStatus?: ApprovalStatus;
  approvedBy?: {
    id: string;
    name: string;
    approvedAt: string;
    note?: string;
  };
  isEmergency?: boolean;
  emergencyLevel?: EmergencyLevel;
  emergencyRequestId?: string;
  rewards?: TaskReward[];
  createdAt: string;
  priority?: TaskPriority;
  createdBy?: {
    id: string;
    name: string;
  };
  rejectionReason?: string;
}

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'AWAITING_APPROVAL';

export type TaskCategory = 'FEEDING' | 'CLEANING' | 'HEALTH' | 'SHELTER' | 'OTHER';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type EmergencyLevel = 'NORMAL' | 'URGENT' | 'CRITICAL';

export interface TaskLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export type VerificationType = 'PHOTO' | 'LOCATION' | 'QR_CODE' | 'TIME_TRACKED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TaskReward {
  type: RewardType;
  amount: number;
  description: string;
  badgeId?: string;
}

export type RewardType = 'XP' | 'BADGE' | 'BONUS_XP';

export type TaskFilter = {
  filterType: 'all' | 'tasks' | 'emergencies' | 'completed' | 'awaiting_approval' | 'assigned';
  category?: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
  completedBy?: {
    id: string;
  };
}; 