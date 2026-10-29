export type UserRole = 'ADMINISTRADOR' | 'USUARIO_SUCURSAL';
export type BranchId = 'escobar' | 'maschwitz' | 'todas';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  branchId: BranchId;
  active: boolean;
  isOwner?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  whatsapp: string;
  active: boolean;
}

export interface Client {
  id: string;
  fullName: string;
  documentNumber?: string;
  phone: string;
  whatsapp: string;
  email?: string;
  address?: string;
  notes?: string;
  branchId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  currentKm: number;
  lastServiceKm?: number;
  clientId: string;
  clientName: string;
  branchId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkOrderType = 'aceite_filtro' | 'mecanica_integral';
export type WorkOrderStatus = 'pendiente' | 'en_proceso' | 'a_entregar' | 'entregada';

export interface StatusHistoryItem {
  status: WorkOrderStatus;
  user: string;
  timestamp: string;
  note?: string;
}

export type WorkOrderCategory =
  | 'aceite'
  | 'liquido'
  | 'filtro'
  | 'repuesto'
  | 'mano_de_obra'
  | 'servicio'
  | 'otro';

export interface WorkOrderItem {
  id: string;
  description: string;
  category: WorkOrderCategory;
  code?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  branchId: string;
  
  // Cliente
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientWhatsapp: string;

  // Vehículo
  vehicleId?: string;
  licensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  currentKm: number;
  lastServiceKm?: number;

  // Servicios checkbox / items específicos
  servicesSelected: string[];
  
  // Productos y filtros para Aceite / Filtro
  oilBrand?: string;
  fluidType?: string;
  oilFilterCode?: string;
  airFilterCode?: string;
  cabinFilterCode?: string;

  // Items detallados y costos
  items: WorkOrderItem[];
  laborCost?: number;
  total: number;
  paymentMethod: string;

  // Recepción Técnica & Inspección
  assignedBay?: string;
  assignedMechanic?: string;
  checklist?: ReceptionChecklist;
  damages?: DamageMark[];
  courtesyChecks?: CourtesyCheck;
  oilDispense?: OilDispenseConfig;
  estimatedTimeMinutes?: number;

  // Otros
  notes?: string;
  nextServiceKm?: number;
  nextServiceDate?: string;
  
  statusHistory: StatusHistoryItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DamageMark {
  id: string;
  view: 'lateral_derecha' | 'lateral_izquierda' | 'superior_cristales' | 'trasera' | 'frontal';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: 'rayon' | 'parabrisas_picado' | 'golpe' | 'otro';
  description: string;
}

export interface ReceptionChecklist {
  spareWheel?: boolean; // Rueda de auxilio presente (opcional)
  fireExtinguisher?: boolean; // Matafuego con oblea vigente (opcional)
  securityLugNutLocation?: string; // Tuerca de seguridad (opcional)
  declaredValuables?: string; // Pertenencias de valor declaradas
  fuelLevel: 'reserva' | '1/4' | '1/2' | '3/4' | 'lleno'; // Nivel de combustible
}

export interface CourtesyCheck {
  brakeFluid: string; // ej: "1.2% H2O (Óptimo)"
  coolant: string; // ej: "G12 Orgánico (-28°C)"
  tirePressure: string; // ej: "32 PSI / 35 Aux"
  greasingCardan: boolean; // Engrase de crucetas y cardán
  obdDiagnostics?: boolean; // Diagnóstico OBD-II
  brakePadsCheck?: boolean; // Revisión pastillas de freno
}

export interface OilDispenseConfig {
  sourceType: 'tambor_granel' | 'bidon_cerrado';
  drumId?: string;
  liters: number;
  crankcaseCapacity?: number;
  oilViscosity?: string;
  unitPricePerLiter?: number;
}

export type ServiceBayType = 'fosa' | 'elevador' | 'zona_fluidos' | 'alineacion';
export type ServiceBayStatus = 'libre' | 'en_servicio' | 'drenando' | 'en_proceso' | 'finalizando';

export interface ServiceBay {
  id: string;
  name: string; // "Fosa 1", "Fosa 2", "Elevador 1", "Elevador 2", "Zona Fluidos"
  branchId: BranchId;
  type: ServiceBayType;
  status: ServiceBayStatus;
  orderId?: string;
  orderNumber?: string;
  licensePlate?: string;
  vehicleModel?: string;
  mechanicName?: string;
  taskDescription?: string;
  progressPercent?: number;
  estimatedMinutesLeft?: number;
  updatedAt?: string;
}

export interface OilDrum {
  id: string;
  name: string; // "Shell Helix Ultra 5W-30", "Castrol Magnatec 10W-40"
  viscosity: string;
  capacityLiters: number; // 208
  currentLiters: number; // 142
  branchId: BranchId;
  location: string; // "Pañol Fosa 1"
  minLitersAlert: number; // 30
  pricePerLiter: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock?: number;
  status: 'activo' | 'inactivo';
  branchId: string; // 'escobar' | 'maschwitz' | 'ambas'
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId?: string;
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  items: SaleItem[];
  total: number;
  paymentMethod: string;
  branchId: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  createdBy: string;
  createdAt: string;
}

export type BudgetStatus = 'pendiente' | 'aprobado' | 'convertido_ot' | 'rechazado';

export interface BudgetItem {
  id: string;
  description: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Budget {
  id: string;
  budgetNumber: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientWhatsapp?: string;
  licensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear?: number;
  items: BudgetItem[];
  laborCost: number;
  subtotal: number;
  total: number;
  observations?: string;
  branchId: string;
  status: BudgetStatus;
  convertedWorkOrderId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  concept: string;
  supplier: string;
  amount: number;
  paymentMethod: string;
  branchId: string;
  user: string;
  date: string;
  observations?: string;
  createdBy: string;
  createdAt: string;
}

export interface ServiceItemDef {
  id: string;
  name: string;
  category: 'aceite_filtro' | 'mecanica';
  defaultPrice?: number;
  active: boolean;
}

export interface Reminder {
  id: string;
  workOrderId?: string;
  clientName: string;
  clientWhatsapp: string;
  clientPhone?: string;
  licensePlate: string;
  vehicleInfo: string;
  estimatedDate?: string;
  estimatedKm?: number;
  status: 'pendiente' | 'notificado' | 'completado';
  branchId: string;
  message?: string;
  createdAt: string;
}

export type AppointmentStatus = 'pendiente' | 'confirmado' | 'en_taller' | 'completado' | 'cancelado';

export interface ServiceAppointment {
  id: string;
  clientName: string;
  clientWhatsapp: string;
  clientPhone?: string;
  licensePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (ej: "09:30")
  branchId: 'escobar' | 'maschwitz' | 'ambas';
  serviceType: 'aceite_filtro' | 'mecanica_integral' | 'frenos' | 'suspension' | 'distribucion' | 'revision_general' | 'otro';
  estimatedDuration?: string;
  status: AppointmentStatus;
  notes?: string;
  createdFromWorkOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export type BudgetTemplateStyle = 'modern_card' | 'classic_clean' | 'compact_bold' | 'executive_minimal';

export interface BudgetFormatSettings {
  headerTitle?: string;
  headerSubtitle?: string;
  headerCustomText?: string;
  headerLogoPosition?: 'left' | 'center' | 'right' | 'hidden';
  showBranchAddresses?: boolean;
  accentColor?: string;
  templateStyle?: BudgetTemplateStyle;
  validityDaysText?: string;
  footerNotes?: string;
  customTerms?: string;
  showSignatureBlock?: boolean;
  showItemCode?: boolean;
  showItemCategory?: boolean;
  showUnitPrices?: boolean;
  showVehicleKm?: boolean;
}

export interface CompanySettings {
  companyName: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
  whatsappEscobar?: string;
  whatsappMaschwitz?: string;
  addressEscobar: string;
  addressMaschwitz: string;
  email: string;
  commercialInfo: string;
  whatsappReadyTemplate: string;
  whatsappBudgetTemplate: string;
  whatsappReminderTemplate: string;
  servicesCatalog: ServiceItemDef[];
  paymentMethods: string[];
  googleDrivePriceListUrl?: string;
  defaultPriceMarginPercent?: number;
  lastPriceListSyncDate?: string;
  budgetFormat?: BudgetFormatSettings;
}

export interface Supplier {
  id: string;
  name: string; // Razón Social / Nombre
  cuit: string; // CUIT
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  contactPerson: string;
  observations?: string;
  status: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'pendiente' | 'pagada' | 'vencida';
export type VoucherType =
  | 'Factura A'
  | 'Factura B'
  | 'Factura C'
  | 'Remito'
  | 'Nota de Débito'
  | 'Nota de Crédito'
  | 'Comprobante';

export interface InvoiceItem {
  id?: string;
  code?: string;
  description: string;
  quantity: number;
  cost: number;
  total: number;
}

export interface Invoice {
  id: string;
  supplierId: string;
  supplierName: string;
  cuit: string;
  invoiceNumber: string;
  voucherType: VoucherType;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  concept: string;
  amount: number;
  items?: InvoiceItem[];
  paymentMethod: string;
  status: InvoiceStatus;
  paymentDate?: string;
  observations?: string;
  branchId: string; // 'escobar' | 'maschwitz' | 'ambas' | 'general'
  attachmentUrl?: string; // base64 / URL of PDF or image
  attachmentName?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

