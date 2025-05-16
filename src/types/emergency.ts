export interface EmergencyRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  animalType: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  imageUrl?: string | null;
  userId: string;
  userName: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  contactPhone?: string;
  resolvedBy?: {
    id: string;
    name: string;
    resolvedAt: string;
  };
  relatedTaskId?: string;
}

export type EmergencyStatus = 'pending' | 'in-progress' | 'resolved' | 'cancelled';
export type EmergencyUrgency = 'critical' | 'high' | 'medium' | 'low'; 