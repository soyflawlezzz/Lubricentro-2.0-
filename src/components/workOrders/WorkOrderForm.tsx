import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  WorkOrder,
  WorkOrderItem,
  WorkOrderCategory,
  WorkOrderType,
  Client,
  Vehicle,
  Product,
  CompanySettings,
  Budget,
  Sale,
} from '../../types';
import {
  Fuel,
  Wrench,
  Plus,
  Trash2,
  Search,
  Check,
  Save,
  History,
  Car,
  UserCheck,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  Copy,
  CheckCheck,
  Layers,
  Calculator,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { VehicleHistoryModal } from '../vehicles/VehicleHistoryModal';
import { ProductSearchAutocomplete } from '../common/ProductSearchAutocomplete';
import { formatCurrency } from '../../utils/formatters';

export const WORK_ORDER_CATEGORIES: Array<{
  id: WorkOrderCategory;
  name: string;
  label: string;
  icon: string;
  badgeClass: string;
  cardBg: string;
  borderColor: string;
  textColor: string;
}> = [
  {
    id: 'aceite',
    name: 'Aceites',
    label: 'Aceites & Lubricantes',
    icon: '🛢️',
    badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
    cardBg: 'bg-amber-950/20',
    borderColor: 'border-amber-800/40',
    textColor: 'text-amber-400',
  },
  {
    id: 'filtro',
    name: 'Filtros',
    label: 'Filtros (Aceite, Aire, Habitáculo, Combustible)',
    icon: '🔩',
    badgeClass: 'bg-red-950/60 text-red-300 border-red-800/50',
    cardBg: 'bg-red-950/20',
    borderColor: 'border-red-800/40',
    textColor: 'text-red-400',
  },
  {
    id: 'liquido',
    name: 'Líquidos',
    label: 'Líquidos & Fluidos (Refrigerante, Frenos, Dirección)',
    icon: '💧',
    badgeClass: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
    cardBg: 'bg-cyan-950/20',
    borderColor: 'border-cyan-800/40',
    textColor: 'text-cyan-400',
  },
  {
    id: 'repuesto',
    name: 'Repuestos',
    label: 'Repuestos & Piezas Mecánicas',
    icon: '⚙️',
    badgeClass: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
    cardBg: 'bg-indigo-950/20',
    borderColor: 'border-indigo-800/40',
    textColor: 'text-indigo-400',
  },
  {
    id: 'mano_de_obra',
    name: 'Mano de Obra',
    label: 'Mano de Obra & Servicios Taller',
    icon: '🔧',
    badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
    cardBg: 'bg-emerald-950/20',
    borderColor: 'border-emerald-800/40',
    textColor: 'text-emerald-400',
  },
  {
    id: 'otro',
    name: 'Otros',
    label: 'Otros Insumos & Varios',
    icon: '📦',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    cardBg: 'bg-slate-900/60',
    borderColor: 'border-slate-800',
    textColor: 'text-slate-400',
  },
];

interface WorkOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Omit<WorkOrder, 'id'>) => Promise<void>;
  initialType?: WorkOrderType;
  clients: Client[];
  vehicles: Vehicle[];
  products: Product[];
  settings?: CompanySettings;
  presetData?: Partial<WorkOrder>; // used when converting from Budget
  workOrders?: WorkOrder[];
  budgets?: Budget[];
  sales?: Sale[];
}

export const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'aceite_filtro',
  clients,
  vehicles,
  products,
  settings,
  presetData,
  workOrders = [],
  budgets = [],
  sales = [],
}) => {
  const { currentBranch, profile, user } = useAuth();

  const [type, setType] = useState<WorkOrderType>(initialType);
  const [branchId, setBranchId] = useState<string>('escobar');

  // Client
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');

  // Vehicle
  const [vehicleId, setVehicleId] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number>(new Date().getFullYear());
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [lastServiceKm, setLastServiceKm] = useState<number>(0);

  // Checkbox Services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState('');

  // Aceite / Filtro specific
  const [oilBrand, setOilBrand] = useState('');
  const [fluidType, setFluidType] = useState('');
  const [oilFilterCode, setOilFilterCode] = useState('');
  const [airFilterCode, setAirFilterCode] = useState('');
  const [cabinFilterCode, setCabinFilterCode] = useState('');

  // Categorized Items & Pricing
  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('todas');
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Extra items & pricing
  const [total, setTotal] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [notes, setNotes] = useState('');
  const [nextServiceKm, setNextServiceKm] = useState<number>(0);
  const [nextServiceDate, setNextServiceDate] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showPlateDropdown, setShowPlateDropdown] = useState(false);

  // Default initial services
  const defaultOilServices = [
    'Cambio de Aceite de Motor',
    'Filtro de Aceite',
    'Filtro de Aire',
    'Filtro de Habitáculo',
    'Líquido de Frenos',
    'Líquido de Transmisión',
    'Revisión de Niveles',
  ];

  const defaultMecanicaServices = [
    'Amortiguadores',
    'Rodamientos',
    'Extremo',
    'Rótula',
    'Scanner',
    'Bieleta',
    'Bujes',
    'Frenos Delanteros/Traseros',
    'Embrague',
    'Tren Delantero',
  ];

  // Past work orders count for this license plate
  const pastOrdersCount = useMemo(() => {
    if (!licensePlate.trim() || !workOrders) return 0;
    const clean = licensePlate.trim().toUpperCase();
    return workOrders.filter(
      (o) => (o.licensePlate || '').trim().toUpperCase() === clean
    ).length;
  }, [licensePlate, workOrders]);

  // Matching vehicles suggestions based on typed plate
  const matchingVehicles = useMemo(() => {
    if (!licensePlate.trim() || licensePlate.trim().length < 2) return [];
    const q = licensePlate.trim().toUpperCase();
    return vehicles
      .filter((v) => (v.licensePlate || '').toUpperCase().includes(q))
      .slice(0, 6);
  }, [licensePlate, vehicles]);

  // Registered clients search filter by ID, documentNumber, fullName, phone
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return [];
    const q = clientSearchQuery.trim().toLowerCase();
    return clients
      .filter((c) => {
        const name = (c.fullName || '').toLowerCase();
        const doc = (c.documentNumber || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const id = (c.id || '').toLowerCase();
        return (
          name.includes(q) ||
          doc.includes(q) ||
          phone.includes(q) ||
          id.includes(q)
        );
      })
      .slice(0, 8);
  }, [clientSearchQuery, clients]);

  // Registered vehicles for selected client
  const clientRegisteredVehicles = useMemo(() => {
    if (!clientId) return [];
    return vehicles.filter((v) => v.clientId === clientId);
  }, [clientId, vehicles]);

  useEffect(() => {
    if (isOpen) {
      const activeBranch = profile?.branchId !== 'todas' ? profile?.branchId || 'escobar' : (currentBranch !== 'todas' ? currentBranch : 'escobar');
      setBranchId(activeBranch);
      setFormError(null);
      setClientSearchQuery('');
      setShowClientDropdown(false);
      setShowPlateDropdown(false);

      if (presetData) {
        setType(presetData.type || initialType);
        setClientName(presetData.clientName || '');
        setClientPhone(presetData.clientPhone || '');
        setClientWhatsapp(presetData.clientWhatsapp || '');
        setLicensePlate(presetData.licensePlate || '');
        setVehicleBrand(presetData.vehicleBrand || '');
        setVehicleModel(presetData.vehicleModel || '');
        setVehicleYear(presetData.vehicleYear || new Date().getFullYear());
        setTotal(presetData.total || 0);
        setNotes(presetData.notes || '');
        setPaymentMethod(presetData.paymentMethod || 'Efectivo');
        if (presetData.servicesSelected && presetData.servicesSelected.length > 0) {
          setSelectedServices(presetData.servicesSelected);
        }
        if (presetData.items && presetData.items.length > 0) {
          setItems(presetData.items);
        } else if (presetData.total && presetData.total > 0) {
          setItems([
            {
              id: 'init-1',
              description: presetData.notes || 'Trabajo o servicio presupuestado',
              category: 'repuesto',
              quantity: 1,
              unitPrice: presetData.total,
              total: presetData.total,
            },
          ]);
        } else {
          setItems([]);
        }
      } else {
        setType(initialType);
        resetForm();
      }
    }
  }, [isOpen, initialType, presetData]);

  const resetForm = () => {
    setClientId('');
    setClientName('');
    setClientPhone('');
    setClientWhatsapp('');
    setVehicleId('');
    setLicensePlate('');
    setVehicleBrand('');
    setVehicleModel('');
    setVehicleYear(new Date().getFullYear());
    setCurrentKm(0);
    setLastServiceKm(0);
    setSelectedServices([]);
    setCustomService('');
    setOilBrand('');
    setFluidType('');
    setOilFilterCode('');
    setAirFilterCode('');
    setCabinFilterCode('');
    setItems([]);
    setActiveCategoryFilter('todas');
    setCopiedQuote(false);
    setTotal(0);
    setPaymentMethod('Efectivo');
    setNotes('');
    setNextServiceKm(0);
    setNextServiceDate('');
    setFormError(null);
    setClientSearchQuery('');
    setShowClientDropdown(false);
    setShowPlateDropdown(false);
  };

  // Autocomplete vehicle/client if license plate matched
  const handlePlateChange = (plateVal: string) => {
    const clean = plateVal.toUpperCase();
    setLicensePlate(clean);

    const matchVehicle = vehicles.find(
      (v) => v.licensePlate.trim().toUpperCase() === clean.trim()
    );
    if (matchVehicle) {
      setVehicleId(matchVehicle.id);
      setVehicleBrand(matchVehicle.brand || '');
      setVehicleModel(matchVehicle.model || '');
      setVehicleYear(matchVehicle.year || new Date().getFullYear());
      setCurrentKm(matchVehicle.currentKm || 0);
      setLastServiceKm(matchVehicle.lastServiceKm || 0);

      // Also match client if exists
      const matchClient = clients.find((c) => c.id === matchVehicle.clientId);
      if (matchClient) {
        setClientId(matchClient.id);
        setClientName(matchClient.fullName);
        setClientPhone(matchClient.phone || '');
        setClientWhatsapp(matchClient.whatsapp || matchClient.phone || '');
      }
    }
  };

  // Select vehicle from search dropdown
  const handleSelectVehicle = (v: Vehicle) => {
    setVehicleId(v.id);
    setLicensePlate(v.licensePlate.toUpperCase());
    setVehicleBrand(v.brand || '');
    setVehicleModel(v.model || '');
    setVehicleYear(v.year || new Date().getFullYear());
    setCurrentKm(v.currentKm || 0);
    setLastServiceKm(v.lastServiceKm || 0);

    if (v.clientId) {
      const matchClient = clients.find((c) => c.id === v.clientId);
      if (matchClient) {
        setClientId(matchClient.id);
        setClientName(matchClient.fullName);
        setClientPhone(matchClient.phone || '');
        setClientWhatsapp(matchClient.whatsapp || matchClient.phone || '');
      }
    }
    setShowPlateDropdown(false);
  };

  // Assign client by ID / search
  const handleAssignClient = (c: Client) => {
    setClientId(c.id);
    setClientName(c.fullName);
    setClientPhone(c.phone || '');
    setClientWhatsapp(c.whatsapp || c.phone || '');
    if (c.branchId && (c.branchId === 'escobar' || c.branchId === 'maschwitz')) {
      setBranchId(c.branchId);
    }
    setClientSearchQuery('');
    setShowClientDropdown(false);
  };

  const toggleService = (srv: string) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  const addCustomService = () => {
    if (customService.trim() && !selectedServices.includes(customService.trim())) {
      setSelectedServices((prev) => [...prev, customService.trim()]);
      setCustomService('');
    }
  };

  // Auto calculate next service KM & Date (+10,000 km, +6 months)
  const handleKmChange = (val: number) => {
    setCurrentKm(val);
    if (type === 'aceite_filtro' && val > 0 && nextServiceKm === 0) {
      setNextServiceKm(val + 10000);
      const estDate = new Date();
      estDate.setMonth(estDate.getMonth() + 6);
      setNextServiceDate(estDate.toISOString().split('T')[0]);
    }
  };

  // --- Item Management & Categories ---
  const handleAddItem = (category: WorkOrderCategory = 'repuesto') => {
    setItems((prev) => [
      ...prev,
      {
        id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        description: '',
        category,
        code: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof WorkOrderItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = { ...copy[index], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(val) : it.quantity;
        const price = field === 'unitPrice' ? Number(val) : it.unitPrice;
        it.total = (Number(qty) || 0) * (Number(price) || 0);
      }
      copy[index] = it;
      return copy;
    });
  };

  const handleSelectProduct = (index: number, prod: Product) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = copy[index] || {};
      const qty = it.quantity || 1;
      const unitPrice = prod.price || 0;

      // Auto-detect category from product
      let cat: WorkOrderCategory = it.category || 'repuesto';
      const prodCatLower = (prod.category || '').toLowerCase();
      const prodNameLower = (prod.name || '').toLowerCase();

      if (
        prodCatLower.includes('aceite') ||
        prodNameLower.includes('aceite') ||
        prodNameLower.includes('motul') ||
        prodNameLower.includes('helix') ||
        prodNameLower.includes('elaion')
      ) {
        cat = 'aceite';
      } else if (
        prodCatLower.includes('filtro') ||
        prodNameLower.includes('filtro') ||
        (prod.code && (prod.code.startsWith('W') || prod.code.startsWith('C') || prod.code.startsWith('PH')))
      ) {
        cat = 'filtro';
      } else if (
        prodCatLower.includes('liquido') ||
        prodNameLower.includes('liquido') ||
        prodNameLower.includes('refrigerante') ||
        prodNameLower.includes('freno')
      ) {
        cat = 'liquido';
      } else if (
        prodCatLower.includes('mano de obra') ||
        prodCatLower.includes('servicio') ||
        prodNameLower.includes('mano de obra')
      ) {
        cat = 'mano_de_obra';
      }

      copy[index] = {
        ...it,
        id: it.id || `it-${Date.now()}`,
        description: prod.name,
        code: prod.code,
        category: cat,
        quantity: qty,
        unitPrice,
        total: qty * unitPrice,
      };
      return copy;
    });
  };

  // Sync from top tech fields (oilBrand, fluidType, filter codes) into item table
  const handleSyncFromTechFields = () => {
    const newItems: WorkOrderItem[] = [];

    if (oilBrand.trim()) {
      const matched = products.find(
        (p) =>
          p.name.toLowerCase().includes(oilBrand.toLowerCase()) ||
          p.code.toLowerCase().includes(oilBrand.toLowerCase())
      );
      newItems.push({
        id: `oil-${Date.now()}`,
        description: oilBrand.trim(),
        code: matched?.code || '',
        category: 'aceite',
        quantity: 1,
        unitPrice: matched?.price || 0,
        total: matched?.price || 0,
      });
    }

    if (fluidType.trim()) {
      const matched = products.find(
        (p) =>
          p.name.toLowerCase().includes(fluidType.toLowerCase()) ||
          p.code.toLowerCase().includes(fluidType.toLowerCase())
      );
      newItems.push({
        id: `fluid-${Date.now()}`,
        description: fluidType.trim(),
        code: matched?.code || '',
        category: 'liquido',
        quantity: 1,
        unitPrice: matched?.price || 0,
        total: matched?.price || 0,
      });
    }

    if (oilFilterCode.trim()) {
      const cleanCode = oilFilterCode.trim().toUpperCase();
      const matched = products.find(
        (p) => p.code.toUpperCase() === cleanCode || p.name.toUpperCase().includes(cleanCode)
      );
      newItems.push({
        id: `filter-oil-${Date.now()}`,
        description: matched ? matched.name : `Filtro de Aceite ${cleanCode}`,
        code: cleanCode,
        category: 'filtro',
        quantity: 1,
        unitPrice: matched?.price || 0,
        total: matched?.price || 0,
      });
    }

    if (airFilterCode.trim()) {
      const cleanCode = airFilterCode.trim().toUpperCase();
      const matched = products.find(
        (p) => p.code.toUpperCase() === cleanCode || p.name.toUpperCase().includes(cleanCode)
      );
      newItems.push({
        id: `filter-air-${Date.now()}`,
        description: matched ? matched.name : `Filtro de Aire ${cleanCode}`,
        code: cleanCode,
        category: 'filtro',
        quantity: 1,
        unitPrice: matched?.price || 0,
        total: matched?.price || 0,
      });
    }

    if (cabinFilterCode.trim()) {
      const cleanCode = cabinFilterCode.trim().toUpperCase();
      const matched = products.find(
        (p) => p.code.toUpperCase() === cleanCode || p.name.toUpperCase().includes(cleanCode)
      );
      newItems.push({
        id: `filter-cabin-${Date.now()}`,
        description: matched ? matched.name : `Filtro de Habitáculo ${cleanCode}`,
        code: cleanCode,
        category: 'filtro',
        quantity: 1,
        unitPrice: matched?.price || 0,
        total: matched?.price || 0,
      });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  // Category totals
  const categoryTotals = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {
      aceite: { count: 0, total: 0 },
      filtro: { count: 0, total: 0 },
      liquido: { count: 0, total: 0 },
      repuesto: { count: 0, total: 0 },
      mano_de_obra: { count: 0, total: 0 },
      otro: { count: 0, total: 0 },
    };

    items.forEach((item) => {
      const rawCat = item.category === 'servicio' ? 'mano_de_obra' : (item.category || 'otro');
      if (!map[rawCat]) map[rawCat] = { count: 0, total: 0 };
      map[rawCat].count += Number(item.quantity) || 1;
      map[rawCat].total += Number(item.total) || 0;
    });

    return map;
  }, [items]);

  const grandItemsTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  }, [items]);

  // Keep total input synchronized when items exist
  useEffect(() => {
    if (items.length > 0) {
      setTotal(grandItemsTotal);
    }
  }, [grandItemsTotal, items.length]);

  // Copy breakdown for WhatsApp
  const handleCopyBreakdownQuote = () => {
    const lines = [
      `📋 *PRESUPUESTO DETALLADO - ORDEN DE TRABAJO*`,
      `🚗 *Vehículo:* ${vehicleBrand || ''} ${vehicleModel || ''} (${licensePlate || 'S/D'})`,
      `👤 *Cliente:* ${clientName || 'Cliente'}`,
      `🏢 *Sucursal:* ${branchId === 'maschwitz' ? 'Ing. Maschwitz' : 'Escobar'}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ];

    WORK_ORDER_CATEGORIES.forEach((cat) => {
      const catItems = items.filter(
        (i) => (i.category === 'servicio' ? 'mano_de_obra' : i.category) === cat.id
      );
      if (catItems.length > 0) {
        const catSubtotal = categoryTotals[cat.id]?.total || 0;
        lines.push(`${cat.icon} *${cat.name.toUpperCase()}:* ${formatCurrency(catSubtotal)}`);
        catItems.forEach((it) => {
          lines.push(
            `   • ${it.description}${it.code ? ` [${it.code}]` : ''} (x${it.quantity}) - ${formatCurrency(it.total)}`
          );
        });
        lines.push(``);
      }
    });

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
    const finalTotal = grandItemsTotal > 0 ? grandItemsTotal : total;
    lines.push(`💰 *IMPORTE TOTAL GENERAL: ${formatCurrency(finalTotal)}*`);
    if (notes) lines.push(`📝 *Notas:* ${notes}`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim()) {
      setFormError('Por favor ingresa la Patente del vehículo.');
      return;
    }
    if (!clientName.trim()) {
      setFormError('Por favor ingresa el Nombre del Cliente.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const orderNumber = `OT-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();
      const finalTotal = grandItemsTotal > 0 ? grandItemsTotal : (Number(total) || 0);

      await onSave({
        orderNumber,
        type,
        status: 'pendiente',
        branchId,
        clientId: clientId || undefined,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientWhatsapp: clientWhatsapp.trim() || clientPhone.trim(),
        vehicleId: vehicleId || undefined,
        licensePlate: licensePlate.trim().toUpperCase(),
        vehicleBrand: vehicleBrand.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: Number(vehicleYear) || new Date().getFullYear(),
        currentKm: Number(currentKm) || 0,
        lastServiceKm: Number(lastServiceKm) || 0,
        servicesSelected: selectedServices,
        oilBrand: type === 'aceite_filtro' ? oilBrand.trim() || undefined : undefined,
        fluidType: type === 'aceite_filtro' ? fluidType.trim() || undefined : undefined,
        oilFilterCode: type === 'aceite_filtro' ? oilFilterCode.trim() || undefined : undefined,
        airFilterCode: type === 'aceite_filtro' ? airFilterCode.trim() || undefined : undefined,
        cabinFilterCode: type === 'aceite_filtro' ? cabinFilterCode.trim() || undefined : undefined,
        items: items.filter((i) => i.description.trim() || i.total > 0),
        total: finalTotal,
        paymentMethod,
        notes: notes.trim(),
        nextServiceKm: nextServiceKm > 0 ? Number(nextServiceKm) : undefined,
        nextServiceDate: nextServiceDate || undefined,
        statusHistory: [
          {
            status: 'pendiente',
            user: profile?.displayName || user?.displayName || 'Usuario',
            timestamp: now,
            note: 'Orden creada inicialmente',
          },
        ],
        createdBy: profile?.displayName || user?.displayName || 'Usuario',
        createdAt: now,
        updatedAt: now,
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error al guardar la orden de trabajo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableServices =
    type === 'aceite_filtro' ? defaultOilServices : defaultMecanicaServices;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {type === 'aceite_filtro' ? (
            <Fuel className="w-5 h-5 text-red-500" />
          ) : (
            <Wrench className="w-5 h-5 text-indigo-400" />
          )}
          <span>
            Nueva OT: {type === 'aceite_filtro' ? 'Cambio de Aceite & Filtro' : 'Mecánica Integral'}
          </span>
        </div>
      }
      subtitle="Registra los datos del cliente, vehículo, repuestos y servicios a realizar"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Type Selector & Branch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              Tipo de Orden de Trabajo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('aceite_filtro')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'aceite_filtro'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Fuel className="w-4 h-4" />
                <span>Aceite & Filtros</span>
              </button>
              <button
                type="button"
                onClick={() => setType('mecanica_integral')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'mecanica_integral'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Mecánica Integral</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              Sucursal Asignada
            </label>
            <select
              value={branchId}
              disabled={profile?.role === 'USUARIO_SUCURSAL'}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
            >
              <option value="escobar">Escobar</option>
              <option value="maschwitz">Ing. Maschwitz</option>
            </select>
          </div>
        </div>

        {/* Section 1: Vehículo */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-850">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Datos del Vehículo
            </h3>
            {licensePlate.trim() && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
                title="Consultar historial de services, km y presupuestos previos de esta patente"
              >
                <History className="w-3.5 h-3.5 text-red-400" />
                <span>
                  Consultar Historial {pastOrdersCount > 0 ? `(${pastOrdersCount} OTs previas)` : 'de Patente'}
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Patente with search suggestions */}
            <div className="col-span-2 sm:col-span-2 relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-400">
                  Patente *
                </label>
                {licensePlate.trim() && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pastOrdersCount > 0 ? `${pastOrdersCount} OTs anteriores` : 'Sin OTs registradas'}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={licensePlate}
                  onChange={(e) => {
                    handlePlateChange(e.target.value);
                    setShowPlateDropdown(true);
                  }}
                  onFocus={() => setShowPlateDropdown(true)}
                  placeholder="AA123BB / ABC123"
                  className="w-full px-3 py-2 pr-9 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-red-400 placeholder-slate-600 focus:outline-hidden focus:border-red-500 uppercase"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (licensePlate.trim()) setIsHistoryOpen(true);
                  }}
                  disabled={!licensePlate.trim()}
                  className="absolute right-2 top-2 p-1 text-slate-400 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                  title="Ver historial de esta patente"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>

              {/* Matching vehicles dropdown */}
              {showPlateDropdown && matchingVehicles.length > 0 && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-1 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Vehículos Registrados</span>
                    <button
                      type="button"
                      onClick={() => setShowPlateDropdown(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {matchingVehicles.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVehicle(v)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer"
                    >
                      <div>
                        <span className="font-mono font-bold text-red-400">{v.licensePlate}</span>
                        <span className="ml-2 text-slate-300 font-medium">
                          {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {v.currentKm ? `${v.currentKm.toLocaleString()} KM` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={vehicleBrand}
                onChange={(e) => setVehicleBrand(e.target.value)}
                placeholder="Ej: Volkswagen"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Ej: Gol Trend"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Año
              </label>
              <input
                type="number"
                value={vehicleYear || ''}
                onChange={(e) => setVehicleYear(Number(e.target.value))}
                placeholder="2020"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                KM Actual
              </label>
              <input
                type="number"
                value={currentKm || ''}
                onChange={(e) => handleKmChange(Number(e.target.value))}
                placeholder="85000"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500 font-mono"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 lg:col-span-6">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                KM Último Service
              </label>
              <input
                type="number"
                value={lastServiceKm || ''}
                onChange={(e) => setLastServiceKm(Number(e.target.value))}
                placeholder="75000"
                className="w-full max-w-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Cliente (Con buscador por ID / N° de Cliente / DNI / Nombre) */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-850">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Datos del Cliente
            </h3>
            {clientId && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cliente Asignado (ID: #{clientId.slice(0, 8)})</span>
                <button
                  type="button"
                  onClick={() => setClientId('')}
                  className="ml-1 text-slate-400 hover:text-red-400 p-0.5 cursor-pointer"
                  title="Desvincular ID"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Search Bar for registered client by ID, DNI, Name */}
          <div className="relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={clientSearchQuery}
                onChange={(e) => {
                  setClientSearchQuery(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Buscar y asignar cliente por N° de Cliente / ID, Nombre o DNI/CUIT..."
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
              />
              {clientSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setClientSearchQuery('');
                    setShowClientDropdown(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown of search results */}
            {showClientDropdown && filteredClients.length > 0 && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 max-h-56 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-1 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Clientes Registrados ({filteredClients.length})</span>
                  <button
                    type="button"
                    onClick={() => setShowClientDropdown(false)}
                    className="text-slate-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleAssignClient(c)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{c.fullName}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          ID: #{c.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.documentNumber ? `DNI/CUIT: ${c.documentNumber} • ` : ''}
                        Tel: {c.phone || c.whatsapp || 'Sin teléfono'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-300 text-[10px] font-bold">
                      Asignar
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick vehicle tags belonging to this client if any */}
          {clientRegisteredVehicles.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-red-400" />
                Vehículos de este cliente:
              </span>
              {clientRegisteredVehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVehicle(v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    licensePlate.toUpperCase() === v.licensePlate.toUpperCase()
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span>{v.licensePlate}</span>
                  <span className="text-[10px] font-sans text-slate-400 font-normal">
                    ({v.brand} {v.model})
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Client Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Nombre y Apellido / Razón Social *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Carlos Gómez / Transportes SRL"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="011 4455-6677"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                WhatsApp (para avisos)
              </label>
              <input
                type="text"
                value={clientWhatsapp}
                onChange={(e) => setClientWhatsapp(e.target.value)}
                placeholder="11 5566-7788"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Servicios Checkboxes */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Servicios Solicitados
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {availableServices.map((srv) => {
              const checked = selectedServices.includes(srv);
              return (
                <div
                  key={srv}
                  onClick={() => toggleService(srv)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    checked
                      ? 'bg-red-950/40 border-red-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      checked
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-xs font-semibold select-none">{srv}</span>
                </div>
              );
            })}
          </div>

          {/* Add custom service */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={customService}
              onChange={(e) => setCustomService(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
              placeholder="Otro servicio personalizado..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
            />
            <button
              type="button"
              onClick={addCustomService}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              + Agregar
            </button>
          </div>
        </div>

        {/* Section 4: Aceite y Filtros - Códigos y Marcas (If Aceite & Filtro) */}
        {type === 'aceite_filtro' && (
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Datos de Aceite & Filtros Utilizados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Marca / Tipo de Aceite
                </label>
                <input
                  type="text"
                  value={oilBrand}
                  onChange={(e) => setOilBrand(e.target.value)}
                  placeholder="Ej: Motul 8100 5W40 / Elaion F30 10W40"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Líquidos / Fluidos
                </label>
                <input
                  type="text"
                  value={fluidType}
                  onChange={(e) => setFluidType(e.target.value)}
                  placeholder="Ej: Refrigerante Orgánico + DOT4"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Código Filtro de Aceite
                </label>
                <input
                  type="text"
                  value={oilFilterCode}
                  onChange={(e) => setOilFilterCode(e.target.value)}
                  placeholder="Ej: W712/52 / PH5949"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Código Filtro de Aire
                </label>
                <input
                  type="text"
                  value={airFilterCode}
                  onChange={(e) => setAirFilterCode(e.target.value)}
                  placeholder="Ej: C29198 / CA1045"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Código Filtro de Habitáculo
                </label>
                <input
                  type="text"
                  value={cabinFilterCode}
                  onChange={(e) => setCabinFilterCode(e.target.value)}
                  placeholder="Ej: CU2545 / AKX112"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Próximo Service (KM)
                </label>
                <input
                  type="number"
                  value={nextServiceKm || ''}
                  onChange={(e) => setNextServiceKm(Number(e.target.value))}
                  placeholder="Ej: 95000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 4.5: Desglose de Ítems y Repuestos por Categoría */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <span>Desglose de Ítems & Repuestos por Categoría</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clasifica los productos, filtros y mano de obra para calcular subtotales detallados por rubro
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {type === 'aceite_filtro' &&
                (oilBrand || oilFilterCode || airFilterCode || cabinFilterCode || fluidType) && (
                  <button
                    type="button"
                    onClick={handleSyncFromTechFields}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                    title="Cargar automáticamente los filtros y aceites especificados arriba a la lista de ítems"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Autocargar desde Ficha</span>
                  </button>
                )}
            </div>
          </div>

          {/* Quick Add Buttons by Category */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Agregar ítem:</span>
            {WORK_ORDER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleAddItem(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 ${cat.badgeClass}`}
              >
                <span>{cat.icon}</span>
                <span>+ {cat.name}</span>
              </button>
            ))}
          </div>

          {/* Items Table / List */}
          {items.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
              <Calculator className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-semibold text-slate-300">
                No hay ítems cargados en el desglose de esta orden de trabajo
              </p>
              <p className="text-[11px] text-slate-500">
                Usa los botones superiores para añadir Aceites, Filtros, Repuestos o Mano de Obra, o busca productos en el catálogo por código o nombre.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, index) => {
                const currentCat =
                  WORK_ORDER_CATEGORIES.find((c) => c.id === item.category) ||
                  WORK_ORDER_CATEGORIES[3]; // default repuesto

                return (
                  <div
                    key={item.id || index}
                    className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col lg:flex-row items-center gap-2.5 hover:border-slate-700 transition-colors"
                  >
                    {/* Category Selector */}
                    <div className="w-full lg:w-44 shrink-0">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleItemChange(index, 'category', e.target.value as WorkOrderCategory)
                        }
                        className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold border focus:outline-hidden cursor-pointer ${currentCat.badgeClass}`}
                      >
                        {WORK_ORDER_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Smart Search by Code or Name */}
                    <div className="w-full lg:flex-1">
                      <ProductSearchAutocomplete
                        products={products}
                        value={item.description}
                        codeValue={item.code}
                        required
                        placeholder="Buscar por Código Mann/Fram o Nombre de Producto..."
                        onChangeText={(text) => handleItemChange(index, 'description', text)}
                        onChangeCode={(code) => handleItemChange(index, 'code', code)}
                        onSelectProduct={(prod) => handleSelectProduct(index, prod)}
                      />
                    </div>

                    {/* Code */}
                    <div className="w-full lg:w-28 shrink-0">
                      <input
                        type="text"
                        value={item.code || ''}
                        onChange={(e) => handleItemChange(index, 'code', e.target.value)}
                        placeholder="Código"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-hidden"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-24 shrink-0">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', Math.max(1, Number(e.target.value)))
                          }
                          placeholder="Cant"
                          className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-center font-bold text-white font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="w-32 shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice || ''}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', Number(e.target.value))
                        }
                        placeholder="P. Unit ($)"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-hidden"
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="w-28 shrink-0 text-right font-mono font-bold text-xs sm:text-sm text-emerald-400">
                      {formatCurrency(item.total)}
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-slate-500 hover:text-red-400 rounded-lg cursor-pointer shrink-0 transition-colors"
                      title="Quitar ítem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TOTALES PARCIALES POR CATEGORÍA BLOCK */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Totales Parciales por Categoría</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Desglose automático para informar claramente el presupuesto al cliente
                </p>
              </div>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyBreakdownQuote}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto border border-slate-700"
                >
                  {copiedQuote ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiar Desglose para WhatsApp</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Category Subtotal Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {WORK_ORDER_CATEGORIES.map((cat) => {
                const catData = categoryTotals[cat.id] || { count: 0, total: 0 };
                const hasItems = catData.count > 0;

                return (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-xl border transition-all ${
                      hasItems
                        ? `${cat.cardBg} ${cat.borderColor} shadow-sm`
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                      <span className="flex items-center gap-1 truncate">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                      {hasItems && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700 font-mono text-slate-300">
                          {catData.count}
                        </span>
                      )}
                    </div>
                    <div className={`font-mono font-black text-xs sm:text-sm ${cat.textColor}`}>
                      {formatCurrency(catData.total)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grand Total Summary Banner */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Suma de todos los ítems clasificados:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400">Total Desglosado:</span>
                <span className="font-mono font-black text-lg sm:text-xl text-emerald-400">
                  {formatCurrency(grandItemsTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Totales, Pagos, Notas y Fecha Próximo Service */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Fecha Estimada Próximo Service
            </label>
            <input
              type="date"
              value={nextServiceDate}
              onChange={(e) => setNextServiceDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Medio de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
            >
              {(settings?.paymentMethods || [
                'Efectivo',
                'Transferencia Bancaria',
                'Débito',
                'Crédito',
                'Mercado Pago',
                'Otro',
              ]).map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Importe Total ($ ARS) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={total || ''}
              onChange={(e) => setTotal(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-base sm:text-lg font-black text-emerald-400 focus:outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Observaciones / Notas del Trabajo
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles técnicos, estado de los frenos, repuestos a tener en cuenta, etc."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando OT...' : 'Crear Orden de Trabajo'}</span>
          </button>
        </div>
      </form>

      {/* Vehicle History Modal */}
      {isHistoryOpen && licensePlate.trim() && (
        <VehicleHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          licensePlate={licensePlate.trim().toUpperCase()}
          workOrders={workOrders}
          budgets={budgets}
          sales={sales}
          vehicle={vehicles.find(
            (v) => v.licensePlate.trim().toUpperCase() === licensePlate.trim().toUpperCase()
          )}
        />
      )}
    </Modal>
  );
};
