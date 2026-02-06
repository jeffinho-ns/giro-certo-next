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

export enum PartnerType {
  STORE = 'STORE',
  MECHANIC = 'MECHANIC',
}

export enum PaymentPlanType {
  MONTHLY_SUBSCRIPTION = 'MONTHLY_SUBSCRIPTION',
  PERCENTAGE_PER_ORDER = 'PERCENTAGE_PER_ORDER',
}

export enum PaymentStatus {
  ACTIVE = 'ACTIVE',
  WARNING = 'WARNING',
  OVERDUE = 'OVERDUE',
  SUSPENDED = 'SUSPENDED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum DisputeType {
  DELIVERY_ISSUE = 'DELIVERY_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  RIDER_COMPLAINT = 'RIDER_COMPLAINT',
  STORE_COMPLAINT = 'STORE_COMPLAINT',
}

export interface Dispute {
  id: string;
  deliveryOrderId: string | null;
  reportedBy: string;
  disputeType: DisputeType;
  status: DisputeStatus;
  description: string;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  locationLogs: any | null;
  createdAt: string;
  updatedAt: string;
  deliveryOrder?: any;
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
  resolver?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  rating: number;
  reviewCount?: number;
  isTrusted: boolean;
  specialties: string[];
  photoUrl: string | null;
  // Dados Empresariais
  cnpj: string | null;
  companyName: string | null; // Razão Social
  tradingName: string | null; // Nome Fantasia
  stateRegistration: string | null; // Inscrição Estadual
  // Geolocalização Expandida
  maxServiceRadius: number | null; // Raio máximo de atendimento em km
  // Configurações Operacionais
  avgPreparationTime: number | null; // Tempo médio de preparo em minutos
  operatingHours: any | null; // JSON: {"monday": {"open": "08:00", "close": "22:00"}, ...}
  // Status
  isBlocked: boolean; // Bloqueado se inadimplente
  createdAt: string;
  updatedAt: string;
  payment?: PartnerPayment;
}

export interface PartnerPayment {
  id: string;
  partnerId: string;
  planType: PaymentPlanType;
  monthlyFee: number | null;
  percentageFee: number | null;
  status: PaymentStatus;
  dueDate: string | null;
  lastPaymentDate: string | null;
  paymentHistory: any; // JSON array
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  activeRiders: number;
  activeRidersByType: {
    motorcycles: number;
    bicycles: number;
  };
  todaysOrders: number;
  premiumSubscribers: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  verifiedRiders: number;
}

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  BICYCLE = 'BICYCLE',
}

export interface ActiveRider {
  id: string;
  name: string;
  email: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  hasVerifiedBadge: boolean;
  isSubscriber: boolean;
  subscriptionType: string;
  bike: {
    id: string;
    vehicleType: VehicleType;
    model: string;
    brand: string;
    plate?: string;
  } | null;
  averageRating: number;
  activeOrders: number;
}

export enum AlertType {
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  MAINTENANCE_CRITICAL = 'MAINTENANCE_CRITICAL',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  userId: string | null;
  partnerId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// Delivery Registration
export enum DeliveryRegistrationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface DeliveryRegistration {
  id: string;
  userId: string;
  status: DeliveryRegistrationStatus;
  cpfCnh: string;
  selfieWithDocData?: string; // base64
  motoWithPlateData?: string; // base64
  platePlateCloseupData?: string; // base64
  cnhPhotoData?: string; // base64
  crlvPhotoData?: string; // base64
  plateLicense: string;
  currentKilometers: number;
  lastOilChangeDate?: string;
  lastOilChangeKm?: number;
  emergencyPhone?: string;
  consentImages: boolean;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

