// Tipos principais para o sistema Giro Certo

export enum DeliveryStatus {
  pending = 'pending',
  accepted = 'accepted',
  arrivedAtStore = 'arrivedAtStore',
  inTransit = 'inTransit',
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

export enum UserType {
  CASUAL = 'CASUAL',
  DIARIO = 'DIARIO',
  RACING = 'RACING',
  DELIVERY = 'DELIVERY',
  LOJISTA = 'LOJISTA',
}

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  photoUrl?: string;
  pilotProfile: string;
  userType?: UserType | null;
  role: UserRole;
  isSubscriber: boolean;
  subscriptionType: SubscriptionType;
  loyaltyPoints: number;
  currentLat?: number;
  currentLng?: number;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
  /** Admin: documentação verificada (entregador) */
  hasVerifiedDocuments?: boolean;
  /** Admin: bloqueio de corridas (inadimplência, etc.) */
  deliveryRiderBlocked?: boolean;
  /** Override de bloqueio por manutenção crítica */
  maintenanceBlockOverride?: boolean;
  partnerId?: string | null;
  coverUrl?: string | null;
  verificationBadge?: boolean;
  followersCount?: number;
  followingCount?: number;
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

/** Quem gerencia catálogo, promoções e aparência da vitrine. */
export type StoreManagementMode = 'self' | 'giro_managed';

export interface StoreReadinessCheck {
  key: string;
  label: string;
  passed: boolean;
  hint?: string;
}

export interface StoreReadiness {
  ready: boolean;
  score: number;
  checks: StoreReadinessCheck[];
}

export interface StoreAdminStats {
  ordersToday: number;
  ordersPending: number;
  productsActive: number;
  revenueToday: number;
}

export interface StoreAuditLogEntry {
  id: string;
  action: string;
  actorName: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface StoreTemplate {
  id: string;
  name: string;
  description: string | null;
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
  /** Identificador público da loja na URL da vitrine (/loja/<slug>). */
  slug?: string | null;
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
  /** prepaid | postpaid_pix | authorize_capture */
  delivery_payment_collection_mode?: string | null;
  /** daily | weekly | monthly */
  delivery_settlement_frequency?: string | null;
  /** Perfil de repasse Asaas (conta ou chave PIX) */
  payout_bank_account_json?: Record<string, unknown> | null;
  /** Utilizadores do app com partnerId = esta loja */
  linked_users?: Array<{ id: string; name: string; email: string | null }>;
  /** self (padrão) | giro_managed — vitrine gerenciada pela equipe Giro Certo */
  storeManagementMode?: StoreManagementMode | null;
  storeDeliveryFeeMode?: 'fixed' | 'distance_capped' | 'distance' | null;
  storeDeliveryFeeMax?: number | null;
  storeDeliveryFeeFixed?: number | null;
  /** snake_case vindo direto do PostgreSQL */
  store_delivery_fee_mode?: string | null;
  store_delivery_fee_max?: number | null;
  store_delivery_fee_fixed?: number | null;
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

/** Pedido ativo do rider (Torre de Controle / dashboard). */
export interface ActiveDeliverySummary {
  id: string;
  status: string;
  storeName: string;
  storeAddress: string;
  deliveryAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
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
  currentOrderStatus?: DeliveryStatus | string | null;
  /** Detalhes do pedido em rota (quando houver). */
  currentOrder?: ActiveDeliverySummary | null;
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

// ============================================
// Loja Virtual (catálogo, pedidos)
// ============================================

export enum StoreOrderStatus {
  awaiting_payment = 'awaiting_payment',
  paid = 'paid',
  accepted_by_store = 'accepted_by_store',
  dispatched = 'dispatched',
  in_delivery = 'in_delivery',
  completed = 'completed',
  cancelled = 'cancelled',
  rejected = 'rejected',
}

export interface ProductCategory {
  id: string;
  partnerId: string;
  name: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
  id: string;
  optionGroupId: string;
  name: string;
  priceDelta: number;
  active: boolean;
  sortOrder: number;
}

export interface ProductOptionGroup {
  id: string;
  productId: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  sortOrder: number;
  options?: ProductOption[];
}

export interface Product {
  id: string;
  partnerId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  basePrice: number;
  photoUrl: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  optionGroups?: ProductOptionGroup[];
}

export interface SelectedOptionSnapshot {
  groupName: string;
  optionName: string;
  priceDelta: number;
}

export interface StoreOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selectedOptions: SelectedOptionSnapshot[];
  notes?: string | null;
}

export type CouponDiscountType = 'percent' | 'fixed';

export interface StoreCoupon {
  id: string;
  partnerId: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreAppearance {
  id: string;
  name: string;
  slug: string | null;
  tradingName: string | null;
  photoUrl: string | null;
  coverUrl: string | null;
  themeColor: string | null;
  description: string | null;
}

export interface StoreBanner {
  id: string;
  partnerId: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
  discount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreOrder {
  id: string;
  partnerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLatitude: number | null;
  customerLongitude: number | null;
  notes: string | null;
  subtotal: number;
  discount?: number;
  couponCode?: string | null;
  deliveryFee: number;
  total: number;
  currency: string;
  status: StoreOrderStatus;
  trackingToken: string;
  deliveryOrderId: string | null;
  /** Código de 4 dígitos para retirada no app (após aceite/despacho). */
  pickupCode?: string | null;
  invoiceUrl: string | null;
  createdAt: string;
  paidAt: string | null;
  acceptedAt: string | null;
  dispatchedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items?: StoreOrderItem[];
}

// ============================================
// Loja Virtual — vitrine pública (DTOs reduzidos)
// ============================================

export interface PublicStore {
  id: string;
  slug: string;
  name: string;
  tradingName: string | null;
  photoUrl: string | null;
  coverUrl: string | null;
  themeColor: string | null;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  avgPreparationTime: number | null;
  operatingHours: any | null;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  deliveryFeePolicy?: {
    mode: 'fixed' | 'distance_capped' | 'distance';
    fixedFee: number | null;
    maxFee: number | null;
    label: string;
  };
}

export interface PublicOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface PublicOptionGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: PublicOption[];
}

export interface PublicCatalogProduct {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  basePrice: number;
  photoUrl: string | null;
  optionGroups: PublicOptionGroup[];
}

export interface PublicCatalogCategory {
  id: string;
  name: string;
  products: PublicCatalogProduct[];
}

export interface PublicBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
}

export interface PublicReview {
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
}

export interface PublicStorefront {
  store: PublicStore;
  banners: PublicBanner[];
  categories: PublicCatalogCategory[];
  reviews?: PublicReview[];
}

export interface CreateStoreOrderItemInput {
  productId: string;
  quantity: number;
  selectedOptionIds?: string[];
  notes?: string;
}

export interface CreateStoreOrderInput {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCpf?: string;
  customerLatitude?: number;
  customerLongitude?: number;
  notes?: string;
  items: CreateStoreOrderItemInput[];
}

export interface CreatedStoreOrder {
  id: string;
  trackingToken: string;
  status: StoreOrderStatus;
  subtotal: number;
  discount?: number;
  couponCode?: string | null;
  deliveryFee: number;
  total: number;
  currency: string;
}

export interface CouponPreview {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discount: number;
}

export interface StoreCheckoutResult {
  status: StoreOrderStatus;
  invoiceUrl: string | null;
  billingType: string;
  pix: { encodedImage?: string; payload?: string; expirationDate?: string } | null;
}

export interface PublicOrderStatus {
  id: string;
  status: StoreOrderStatus;
  store: { name: string; slug: string };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    selectedOptions: SelectedOptionSnapshot[];
  }>;
  subtotal: number;
  discount?: number;
  couponCode?: string | null;
  deliveryFee: number;
  total: number;
  currency: string;
  reviewed?: boolean;
  timeline: {
    createdAt: string;
    paidAt: string | null;
    acceptedAt: string | null;
    dispatchedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
  };
  hasDelivery: boolean;
  /** Posições para o mapa (rider só quando entrega ativa). */
  tracking?: {
    active: boolean;
    storeLat: number | null;
    storeLng: number | null;
    deliveryLat: number | null;
    deliveryLng: number | null;
    riderLat: number | null;
    riderLng: number | null;
  } | null;
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
  vehicleType?: 'MOTORCYCLE' | 'BICYCLE';
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
  /** Itens de equipamento declarados no cadastro (ex.: luz, capacete) */
  equipments?: string[];
  /** Comprovante opcional (nota / canhoto) em base64 */
  bikeOptionalReceiptData?: string;
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