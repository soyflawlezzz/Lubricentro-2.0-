import { CompanySettings, Product, ServiceItemDef } from '../types';

export const INITIAL_SERVICES: ServiceItemDef[] = [
  // Aceite y Filtros
  { id: 'srv-oil-motor', name: 'Cambio de Aceite de Motor', category: 'aceite_filtro', defaultPrice: 12000, active: true },
  { id: 'srv-oil-filter', name: 'Cambio Filtro de Aceite', category: 'aceite_filtro', defaultPrice: 4000, active: true },
  { id: 'srv-air-filter', name: 'Cambio Filtro de Aire', category: 'aceite_filtro', defaultPrice: 4000, active: true },
  { id: 'srv-cabin-filter', name: 'Cambio Filtro de Habitáculo', category: 'aceite_filtro', defaultPrice: 5000, active: true },
  { id: 'srv-brake-fluid', name: 'Reemplazo Líquido de Frenos (DOT 4)', category: 'aceite_filtro', defaultPrice: 15000, active: true },
  { id: 'srv-trans-fluid', name: 'Reemplazo Líquido de Transmisión', category: 'aceite_filtro', defaultPrice: 20000, active: true },
  { id: 'srv-levels', name: 'Revisión y Completado de Niveles', category: 'aceite_filtro', defaultPrice: 3500, active: true },
  { id: 'srv-grease', name: 'Engrase y Revisión General de Chasis', category: 'aceite_filtro', defaultPrice: 8000, active: true },

  // Mecánica Integral
  { id: 'srv-shocks', name: 'Cambio de Amortiguadores Delanteros/Traseros', category: 'mecanica', defaultPrice: 35000, active: true },
  { id: 'srv-bearings', name: 'Cambio de Rodamientos / Rulemanes de Rueda', category: 'mecanica', defaultPrice: 22000, active: true },
  { id: 'srv-tie-rod', name: 'Cambio de Extremos y Precaps de Dirección', category: 'mecanica', defaultPrice: 18000, active: true },
  { id: 'srv-ball-joint', name: 'Cambio de Rótulas de Suspensión', category: 'mecanica', defaultPrice: 16000, active: true },
  { id: 'srv-scanner', name: 'Diagnóstico Computarizado con Scanner OBD2', category: 'mecanica', defaultPrice: 15000, active: true },
  { id: 'srv-sway-bar', name: 'Cambio de Bieletas de Barra Estabilizadora', category: 'mecanica', defaultPrice: 12000, active: true },
  { id: 'srv-bushings', name: 'Cambio de Bujes de Parrilla y Puente', category: 'mecanica', defaultPrice: 26000, active: true },
  { id: 'srv-brakes', name: 'Frenos Completos (Pastillas, Discos, Cintas)', category: 'mecanica', defaultPrice: 28000, active: true },
  { id: 'srv-clutch', name: 'Kit de Embrague (Placa, Disco y Crapodina)', category: 'mecanica', defaultPrice: 75000, active: true },
  { id: 'srv-timing', name: 'Distribución y Bomba de Agua', category: 'mecanica', defaultPrice: 80000, active: true },
];

export const INITIAL_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [];

export const DEFAULT_BUDGET_FORMAT = {
  headerTitle: 'PRESUPUESTO DE SERVICIO',
  headerSubtitle: 'Lubricentro & Mecánica Automotor',
  headerCustomText: 'Atención especializada • Trabajos garantizados',
  headerLogoPosition: 'left' as const,
  showBranchAddresses: true,
  accentColor: '#DC2626',
  templateStyle: 'modern_card' as const,
  validityDaysText: 'Presupuesto válido por 10 días a partir de la fecha de emisión.',
  footerNotes: 'Precios sujetos a variación según disponibilidad de repuestos e insumos al momento de ejecutar el trabajo.',
  customTerms: 'Trabajos de mano de obra y repuestos garantizados según especificaciones técnicas de fábrica.',
  showSignatureBlock: true,
  showItemCode: true,
  showItemCategory: true,
  showUnitPrices: true,
  showVehicleKm: true,
};

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'LUBRICENTRO 2.0',
  logoUrl: '/lubricentro-official-logo.png',
  phone: '1164884571',
  whatsapp: '5491164884571',
  whatsappEscobar: '5491164884571',
  whatsappMaschwitz: '5491164884571',
  addressEscobar: 'Estrada 1355, Belén de Escobar',
  addressMaschwitz: 'Colectora Oeste 1439, Ing. Maschwitz',
  email: '',
  commercialInfo: '',
  whatsappReadyTemplate: '¡Hola {cliente}! Te avisamos desde Lubricentro 2.0 que tu vehículo {vehiculo} (Patente: {patente}) ya está listo para retirar en la sucursal {sucursal}. Total: ${total}. ¡Muchas gracias por confiar en nosotros!',
  whatsappBudgetTemplate: '¡Hola {cliente}! Te acercamos el presupuesto de Lubricentro 2.0 para tu vehículo {vehiculo} (Patente: {patente}) por un total de ${total}. ¿Querés que reservemos tu turno para realizar el trabajo?',
  whatsappReminderTemplate: '¡Hola {cliente}! Te recordamos desde Lubricentro 2.0 que próximamente corresponde realizar el service de tu {vehiculo} (Patente: {patente}). Podés comunicarte con nosotros para coordinar tu turno en Escobar o Maschwitz.',
  servicesCatalog: INITIAL_SERVICES,
  paymentMethods: ['Efectivo', 'Transferencia Bancaria', 'Débito', 'Crédito', 'Mercado Pago', 'Cuenta Corriente', 'Otro'],
  budgetFormat: DEFAULT_BUDGET_FORMAT,
};

export const INITIAL_SUPPLIERS = [];

export const INITIAL_INVOICES = [];


