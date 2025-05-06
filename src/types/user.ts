import { Badge } from './badge';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
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
  completedTasks: string[];
  volunteerHours: number;
  badges: Badge[];
  activeTask?: string;
  savedPets: string[];
  favoriteLocations: string[];
} 