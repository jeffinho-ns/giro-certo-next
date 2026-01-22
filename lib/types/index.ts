// Tipos principais para o sistema Giro Certo

export enum DeliveryStatus {
  pending = 'pending',
  accepted = 'accepted',
  inProgress = 'inProgress',
  completed = 'completed',
  cancelled = 'cancelled',
}

export enum DeliveryPriority {
  low = 'low',
  normal = 'normal',
  high = 'high',
  urgent = 'urgent',
}

export enum SubscriptionType {
  standard = 'standard',
  premium = 'premium',
}

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  photoUrl?: string;
  pilotProfile: string;
  role: UserRole;
  isSubscriber: boolean;
  subscriptionType: SubscriptionType;
  loyaltyPoints: number;
  currentLat?: number;
  currentLng?: number;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bike {
  id: string;
  userId: string;
  model: string;
  brand: string;
  plate: string;
  currentKm: number;
  createdAt: string;
}

export interface DeliveryOrder {
  id: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  recipientName?: string;
  recipientPhone?: string;
  notes?: string;
  value: number;
  deliveryFee: number;
  appCommission: number;
  status: DeliveryStatus;
  priority: DeliveryPriority;
  riderId?: string;
  riderName?: string;
  distance?: number;
  estimatedTime?: number;
  createdAt: string;
  acceptedAt?: string;
  inProgressAt?: string;
  completedAt?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  deliveryOrderId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  isTrusted: boolean;
  specialties: string[];
}

export interface DashboardStats {
  activeRiders: number;
  todaysOrders: number;
  premiumSubscribers: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}
