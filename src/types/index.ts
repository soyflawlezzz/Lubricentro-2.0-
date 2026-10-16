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

  // Otros
  notes?: string;
  nextServiceKm?: number;
  nextServiceDate?: string;
  
  statusHistory: StatusHistoryItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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

export interface CompanySettings {
  companyName: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
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

