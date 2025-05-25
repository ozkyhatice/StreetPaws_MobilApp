import { Badge } from './badge';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  firstName?: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  role: 'user' | 'admin' | 'volunteer';
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    darkMode: boolean;
  };
  stats: {
    tasksCompleted: number;
    volunteeredHours: number;
    donationsCount: number;
    totalDonationAmount: number;
    xpPoints: number;
    level: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  xp: number;
  volunteerHours: number;
  badges: Badge[];
  activeTask?: string;
  savedPets: string[];
  favoriteLocations: string[];
  bio?: string;
  city?: string;
  dateOfBirth?: string;
  skills?: string[];
  isBusinessAccount?: boolean;
  businessType?: string;
  isApproved?: boolean;
  rating?: number;
  userType?: string;
  businessName?: string;
  address?: string;
  website?: string;
  description?: string;
  streak?: number;
  taskCompletions?: {
    taskId: string;
    xp: number;
    timestamp: string;
    isEmergency?: boolean;
    title?: string;
  }[];
} 