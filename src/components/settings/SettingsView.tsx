import React, { useState, useEffect } from 'react';
import { CompanySettings, ServiceItemDef, BudgetTemplateStyle } from '../../types';
import {
  Settings,
  Building,
  Save,
  MessageCircle,
  Plus,
  Trash2,
  Check,
  CreditCard,
  Wrench,
  Fuel,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  FileSpreadsheet,
  Link,
  Download,
  ExternalLink,
  RefreshCw,
  Palette,
  Layout,
  FileText,
  Eye,
  CheckSquare,
  Square,
  RotateCcw,
  Activity,
  Cpu,
  Database,
  Wifi,
  ShieldCheck,
  Zap,
  Server,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_BUDGET_FORMAT } from '../../services/seedData';

interface SettingsViewProps {
  settings?: CompanySettings;
  onSaveSettings: (settings: Partial<CompanySettings>) => Promise<void>;
  onClearDatabase?: () => Promise<void>;
  onRestoreSampleData?: () => Promise<void>;
  clientsCount?: number;
  vehiclesCount?: number;
  workOrdersCount?: number;
  budgetsCount?: number;
  appointmentsCount?: number;
  lastSyncTime?: Date | null;
  onManualPullData?: () => Promise<{ clientsCount: number; vehiclesCount: number }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onClearDatabase,
  onRestoreSampleData,
  clientsCount = 0,
  vehiclesCount = 0,
  workOrdersCount = 0,
  budgetsCount = 0,
  appointmentsCount = 0,
  lastSyncTime,
  onManualPullData,
}) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'empresa' | 'servicios' | 'whatsapp' | 'pagos' | 'precios' | 'diseno_presupuestos' | 'sistema'
  >('empresa');
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItemDef | null>(null);

  // System Status & Manual Sync states
  const [isPulling, setIsPulling] = useState(false);
  const [pullMessage, setPullMessage] = useState<string | null>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [addressEscobar, setAddressEscobar] = useState('');
  const [addressMaschwitz, setAddressMaschwitz] = useState('');
  const [email, setEmail] = useState('');
  const [commercialInfo, setCommercialInfo] = useState('');

  // Google Drive Price List Sync
  const [googleDrivePriceListUrl, setGoogleDrivePriceListUrl] = useState('');
  const [defaultPriceMarginPercent, setDefaultPriceMarginPercent] = useState<number>(40);
  const [lastPriceListSyncDate, setLastPriceListSyncDate] = useState('');

  // WhatsApp templates
  const [waReady, setWaReady] = useState('');
  const [waBudget, setWaBudget] = useState('');
  const [waReminder, setWaReminder] = useState('');

  // Services Catalog
  const [services, setServices] = useState<ServiceItemDef[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<'aceite_filtro' | 'mecanica'>('mecanica');
  const [newServicePrice, setNewServicePrice] = useState<number>(0);

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  // Budget Format Customization States
  const [headerTitle, setHeaderTitle] = useState('PRESUPUESTO DE SERVICIO');
  const [headerSubtitle, setHeaderSubtitle] = useState('Lubricentro & Mecánica Automotor');
  const [headerCustomText, setHeaderCustomText] = useState('Atención personalizada • Trabajos garantizados');
  const [headerLogoPosition, setHeaderLogoPosition] = useState<'left' | 'center' | 'right' | 'hidden'>('left');
  const [showBranchAddresses, setShowBranchAddresses] = useState(true);
  const [accentColor, setAccentColor] = useState('#DC2626');
  const [templateStyle, setTemplateStyle] = useState<BudgetTemplateStyle>('modern_card');
  const [validityDaysText, setValidityDaysText] = useState('Presupuesto válido por 10 días a partir de la fecha de emisión.');
  const [footerNotes, setFooterNotes] = useState('Precios sujetos a variación según disponibilidad de repuestos e insumos al momento de ejecutar el trabajo.');
  const [customTerms, setCustomTerms] = useState('Trabajos de mano de obra y repuestos garantizados según especificaciones técnicas de fábrica.');
  const [showSignatureBlock, setShowSignatureBlock] = useState(true);
  const [showItemCode, setShowItemCode] = useState(true);
  const [showItemCategory, setShowItemCategory] = useState(true);
  const [showUnitPrices, setShowUnitPrices] = useState(true);
  const [showVehicleKm, setShowVehicleKm] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (settings && !isInitialized) {
      setCompanyName(settings.companyName || 'LUBRICENTRO 2.0');
      setLogoUrl(settings.logoUrl || '');
      setPhone(settings.phone || '');
      setWhatsapp(settings.whatsapp || '');
      setAddressEscobar(settings.addressEscobar || '');
      setAddressMaschwitz(settings.addressMaschwitz || '');
      setEmail(settings.email === 'contacto@lubricentro20.com' ? '' : (settings.email || ''));
      setCommercialInfo(settings.commercialInfo && settings.commercialInfo.includes('30-71829340-8') ? '' : (settings.commercialInfo || ''));

      setGoogleDrivePriceListUrl(settings.googleDrivePriceListUrl || '');
      setDefaultPriceMarginPercent(settings.defaultPriceMarginPercent ?? 40);
      setLastPriceListSyncDate(settings.lastPriceListSyncDate || '');

      setWaReady(settings.whatsappReadyTemplate || '');
      setWaBudget(settings.whatsappBudgetTemplate || '');
      setWaReminder(settings.whatsappReminderTemplate || '');

      setServices(settings.servicesCatalog || []);
      setPaymentMethods(settings.paymentMethods || []);

      // Budget Format
      const bf = settings.budgetFormat || DEFAULT_BUDGET_FORMAT;
      setHeaderTitle(bf.headerTitle || 'PRESUPUESTO DE SERVICIO');
      setHeaderSubtitle(bf.headerSubtitle || 'Lubricentro & Mecánica Automotor');
      setHeaderCustomText(bf.headerCustomText || '');
      setHeaderLogoPosition(bf.headerLogoPosition || 'left');
      setShowBranchAddresses(bf.showBranchAddresses ?? true);
      setAccentColor(bf.accentColor || '#DC2626');
      setTemplateStyle(bf.templateStyle || 'modern_card');
      setValidityDaysText(bf.validityDaysText || 'Presupuesto válido por 10 días a partir de la fecha de emisión.');
      setFooterNotes(bf.footerNotes || 'Precios sujetos a variación según disponibilidad de repuestos e insumos al momento de ejecutar el trabajo.');
      setCustomTerms(bf.customTerms || 'Trabajos de mano de obra y repuestos garantizados según especificaciones técnicas de fábrica.');
      setShowSignatureBlock(bf.showSignatureBlock ?? true);
      setShowItemCode(bf.showItemCode ?? true);
      setShowItemCategory(bf.showItemCategory ?? true);
      setShowUnitPrices(bf.showUnitPrices ?? true);
      setShowVehicleKm(bf.showVehicleKm ?? true);

      setIsInitialized(true);
    }
  }, [settings, isInitialized]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert('La imagen del logo no debe superar los 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const newLogo = reader.result;
        setLogoUrl(newLogo);
        try {
          await onSaveSettings({ logoUrl: newLogo });
        } catch (err) {
          console.error('Error auto-saving uploaded logo:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setLogoUrl('');
    try {
      await onSaveSettings({ logoUrl: '' });
    } catch (err) {
      console.error('Error removing logo:', err);
    }
  };

  const handleResetBudgetFormat = () => {
    setHeaderTitle(DEFAULT_BUDGET_FORMAT.headerTitle);
    setHeaderSubtitle(DEFAULT_BUDGET_FORMAT.headerSubtitle);
    setHeaderCustomText(DEFAULT_BUDGET_FORMAT.headerCustomText);
    setHeaderLogoPosition(DEFAULT_BUDGET_FORMAT.headerLogoPosition);
    setShowBranchAddresses(DEFAULT_BUDGET_FORMAT.showBranchAddresses);
    setAccentColor(DEFAULT_BUDGET_FORMAT.accentColor);
    setTemplateStyle(DEFAULT_BUDGET_FORMAT.templateStyle);
    setValidityDaysText(DEFAULT_BUDGET_FORMAT.validityDaysText);
    setFooterNotes(DEFAULT_BUDGET_FORMAT.footerNotes);
    setCustomTerms(DEFAULT_BUDGET_FORMAT.customTerms);
    setShowSignatureBlock(DEFAULT_BUDGET_FORMAT.showSignatureBlock);
    setShowItemCode(DEFAULT_BUDGET_FORMAT.showItemCode);
    setShowItemCategory(DEFAULT_BUDGET_FORMAT.showItemCategory);
    setShowUnitPrices(DEFAULT_BUDGET_FORMAT.showUnitPrices);
    setShowVehicleKm(DEFAULT_BUDGET_FORMAT.showVehicleKm);
  };

  const handleSave = async (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      // Auto-commit pending new service if typed
      let currentServices = [...services];
      if (newServiceName.trim()) {
        const newSrv: ServiceItemDef = {
          id: `srv-${Date.now()}`,
          name: newServiceName.trim(),
          category: newServiceCategory,
          defaultPrice: Number(newServicePrice) || 0,
          active: true,
        };
        currentServices.push(newSrv);
        setServices(currentServices);
        setNewServiceName('');
        setNewServicePrice(0);
      }

      // Auto-commit pending new payment method if typed
      let currentPaymentMethods = [...paymentMethods];
      if (newPaymentMethod.trim() && !currentPaymentMethods.includes(newPaymentMethod.trim())) {
        currentPaymentMethods.push(newPaymentMethod.trim());
        setPaymentMethods(currentPaymentMethods);
        setNewPaymentMethod('');
      }

      await onSaveSettings({
        companyName,
        logoUrl: logoUrl.trim(),
        phone,
        whatsapp,
        addressEscobar,
        addressMaschwitz,
        email,
        commercialInfo,
        whatsappReadyTemplate: waReady,
        whatsappBudgetTemplate: waBudget,
        whatsappReminderTemplate: waReminder,
        servicesCatalog: currentServices,
        paymentMethods: currentPaymentMethods,
        googleDrivePriceListUrl: googleDrivePriceListUrl.trim(),
        defaultPriceMarginPercent: Number(defaultPriceMarginPercent) || 40,
        lastPriceListSyncDate: lastPriceListSyncDate || '',
        budgetFormat: {
          headerTitle,
          headerSubtitle,
          headerCustomText,
          headerLogoPosition,
          showBranchAddresses,
          accentColor,
          templateStyle,
          validityDaysText,
          footerNotes,
          customTerms,
          showSignatureBlock,
          showItemCode,
          showItemCategory,
          showUnitPrices,
          showVehicleKm,
        },
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error al guardar configuración:', err);
      alert('Error al guardar la configuración: ' + (err?.message || 'Verifica la conexión'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    const newSrv: ServiceItemDef = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      category: newServiceCategory,
      defaultPrice: Number(newServicePrice) || 0,
      active: true,
    };
    setServices((prev) => [...prev, newSrv]);
    setNewServiceName('');
    setNewServicePrice(0);
  };

  const handleRemoveService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddPaymentMethod = () => {
    if (newPaymentMethod.trim() && !paymentMethods.includes(newPaymentMethod.trim())) {
      setPaymentMethods((prev) => [...prev, newPaymentMethod.trim()]);
      setNewPaymentMethod('');
    }
  };

  const handleRemovePaymentMethod = (pm: string) => {
    setPaymentMethods((prev) => prev.filter((p) => p !== pm));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Configuración del Sistema
          </h1>
          <p className="text-xs text-slate-400">
            Administración centralizada de datos comerciales, plantillas y catálogo de servicios
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onClearDatabase && (
            <button
              type="button"
              onClick={() => setIsConfirmClearOpen(true)}
              disabled={isClearing || isSaving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-red-950/80 text-slate-300 hover:text-red-400 text-xs font-bold transition-all border border-slate-700/60 cursor-pointer disabled:opacity-50"
              title="Vaciar todos los registros de prueba para empezar completamente en cero"
            >
              <Trash2 className="w-4 h-4" />
              <span>Poner Todo en Cero / Reiniciar DB</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isClearing}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/40 cursor-pointer disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>¡Guardado con Éxito!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('empresa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'empresa'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Datos de la Empresa & Sucursales
        </button>
        <button
          onClick={() => setActiveTab('servicios')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'servicios'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Catálogo de Servicios
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Plantillas de WhatsApp
        </button>
        <button
          onClick={() => setActiveTab('pagos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'pagos'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Medios de Pago
        </button>
        <button
          onClick={() => setActiveTab('precios')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'precios'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Lista de Precios & Drive</span>
        </button>
        <button
          onClick={() => setActiveTab('diseno_presupuestos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'diseno_presupuestos'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>Diseño de Presupuestos</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sistema')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sistema'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-emerald-400 opacity-90'
          }`}
          title="Pantalla Oculta de Diagnóstico & Sincronización Firebase"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Estado del Sistema</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        </button>
      </div>

      {/* Content Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Tab 1: Empresa & Sucursales */}
        {activeTab === 'empresa' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-red-500" />
              <span>Identidad Comercial & Sucursales</span>
            </h3>

            {/* Logo Manager Section */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-inner">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo de la Empresa"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <img
                      src="/lubricentro-original-logo.png"
                      alt="Logo Predeterminado"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Logotipo de la Empresa</span>
                    {logoUrl ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        Personalizado
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                        Predeterminado
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Este logotipo se aplicará en la barra superior, en los remitos y en los presupuestos exportados a PDF y JPEG para WhatsApp.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700 shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-red-400" />
                  <span>{logoUrl ? 'Cambiar Logo' : 'Subir Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors border border-slate-800 cursor-pointer"
                    title="Eliminar logo personalizado y volver al logotipo original"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Nombre Comercial de la Empresa
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Teléfono Fijo / Central
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  WhatsApp Oficial
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Dirección Sucursal 1 (Belén de Escobar)
                </label>
                <input
                  type="text"
                  value={addressEscobar}
                  onChange={(e) => setAddressEscobar(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Dirección Sucursal 2 (Ing. Maschwitz)
                </label>
                <input
                  type="text"
                  value={addressMaschwitz}
                  onChange={(e) => setAddressMaschwitz(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Datos Fiscales / Encabezado de Remitos y Presupuestos
                </label>
                <textarea
                  rows={2}
                  value={commercialInfo}
                  onChange={(e) => setCommercialInfo(e.target.value)}
                  placeholder="C.U.I.T., Ingresos Brutos, Leyendas legales..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Servicios */}
        {activeTab === 'servicios' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-400" />
              <span>Servicios Disponibles en Formularios de OT</span>
            </h3>

            {/* Add service inline */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Nombre del nuevo servicio..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden"
              />
              <select
                value={newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.target.value as any)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden"
              >
                <option value="mecanica">Mecánica Integral</option>
                <option value="aceite_filtro">Aceite & Filtros</option>
              </select>
              <input
                type="number"
                value={newServicePrice || ''}
                onChange={(e) => setNewServicePrice(Number(e.target.value))}
                placeholder="Precio Sugerido ($)"
                className="w-36 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddService}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Services List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    {srv.category === 'aceite_filtro' ? (
                      <Fuel className="w-4 h-4 text-red-500" />
                    ) : (
                      <Wrench className="w-4 h-4 text-indigo-400" />
                    )}
                    <div>
                      <span className="font-bold text-white block">{srv.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {srv.defaultPrice ? formatCurrency(srv.defaultPrice) : 'Precio variable'}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setServiceToDelete(srv)}
                      className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
                      title="Eliminar servicio y precio (Sólo Administrador)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: WhatsApp Templates */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Plantillas Automáticas de WhatsApp</span>
            </h3>
            <p className="text-xs text-slate-400">
              Variables disponibles: <code>{'{cliente}'}</code>, <code>{'{vehiculo}'}</code>,{' '}
              <code>{'{patente}'}</code>, <code>{'{sucursal}'}</code>, <code>{'{total}'}</code>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  1. Vehículo Listo para Retirar
                </label>
                <textarea
                  rows={3}
                  value={waReady}
                  onChange={(e) => setWaReady(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  2. Envío de Presupuesto
                </label>
                <textarea
                  rows={3}
                  value={waBudget}
                  onChange={(e) => setWaBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  3. Recordatorio de Próximo Service
                </label>
                <textarea
                  rows={3}
                  value={waReminder}
                  onChange={(e) => setWaReminder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Medios de Pago */}
        {activeTab === 'pagos' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Medios de Pago Habilitados</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                placeholder="Nuevo medio de pago (ej: Cheque 30 días, Cuenta Corriente)..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddPaymentMethod}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                + Agregar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {paymentMethods.map((pm) => (
                <div
                  key={pm}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-semibold flex items-center gap-2"
                >
                  <span>{pm}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePaymentMethod(pm)}
                    className="text-slate-500 hover:text-red-400 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Lista de Precios & Google Drive */}
        {activeTab === 'precios' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Sincronización de Precios con Google Drive & CSV</span>
              </h3>
              {lastPriceListSyncDate && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Última sincronización: {new Date(lastPriceListSyncDate).toLocaleString('es-AR')}
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  URL Predeterminada de Google Drive o Google Sheets
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={googleDrivePriceListUrl}
                    onChange={(e) => setGoogleDrivePriceListUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit?usp=sharing"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Guarda aquí el enlace compartido de tu planilla. Al abrir la ventana de sincronización en Productos, se cargará automáticamente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Margen de Ganancia Comercial Sugerido (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={defaultPriceMarginPercent}
                      onChange={(e) => setDefaultPriceMarginPercent(Number(e.target.value))}
                      className="w-24 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-emerald-500 text-center"
                    />
                    <span className="text-xs text-slate-400">% sobre el costo</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Si tu lista importada contiene solo precios de costo, el precio de venta al público se calculará sumando este porcentaje.
                  </p>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      Estructura de Columnas Recomendada:
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Codigo | Descripcion | Categoria | Costo | Precio | Stock
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step by Step Guide */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Instrucciones para Sincronizar desde Google Drive
              </h4>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Abre tu archivo o lista de repuestos en <strong>Google Sheets</strong>.
                </li>
                <li>
                  Haz clic en el botón superior derecho <strong>Compartir</strong>.
                </li>
                <li>
                  En <em>Acceso general</em>, selecciona <strong>"Cualquier persona con el enlace"</strong> con rol de <strong>Lector</strong>.
                </li>
                <li>
                  Copia el enlace generado y pégalo arriba o directamente en el módulo <strong>Productos & Precios &rarr; Sincronizar Lista</strong>.
                </li>
                <li>
                  También puedes exportar el archivo desde <em>Archivo &rarr; Descargar &rarr; Valores separados por comas (.csv)</em> y subirlo directamente sin conexión web.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 6: Personalizar Formato de Presupuestos */}
        {activeTab === 'diseno_presupuestos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-400" />
                  <span>Formato y Personalización de Presupuestos</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Modifica libremente los encabezados, lemas, colores corporativos, validez, notas y firmas de tus presupuestos (PDF / Imagen / Impresión)
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetBudgetFormat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer self-start sm:self-auto"
                title="Restablecer plantilla por defecto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Restablecer por Defecto</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Controls Column (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Encabezados y Títulos */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Encabezado y Títulos del Documento</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Título Principal del Presupuesto
                      </label>
                      <input
                        type="text"
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        placeholder="Ej: PRESUPUESTO DE SERVICIO"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Subtítulo Comercial
                      </label>
                      <input
                        type="text"
                        value={headerSubtitle}
                        onChange={(e) => setHeaderSubtitle(e.target.value)}
                        placeholder="Ej: Lubricentro & Mecánica Automotor"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Lema o Banner Superior (Opcional)
                    </label>
                    <input
                      type="text"
                      value={headerCustomText}
                      onChange={(e) => setHeaderCustomText(e.target.value)}
                      placeholder="Ej: Atención personalizada • Trabajos 100% garantizados"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Posición del Logo de la Empresa
                      </label>
                      <select
                        value={headerLogoPosition}
                        onChange={(e) => setHeaderLogoPosition(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500 cursor-pointer"
                      >
                        <option value="left">Izquierda (Estándar)</option>
                        <option value="right">Derecha</option>
                        <option value="hidden">Ocultar Logo en Presupuestos</option>
                      </select>
                    </div>

                    <div className="flex items-end pb-1">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showBranchAddresses}
                          onChange={(e) => setShowBranchAddresses(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-900"
                        />
                        <span>Mostrar direcciones físicas de Sucursales</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Color de Acento y Estilo */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4" />
                    <span>Color de Acento & Estilo Visual</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Color de Acento Principal
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                        />
                        <span className="font-mono text-xs text-white font-bold uppercase">{accentColor}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { name: 'Rojo Lubricentro', hex: '#DC2626' },
                          { name: 'Azul Profesional', hex: '#1E40AF' },
                          { name: 'Verde Esmeralda', hex: '#059669' },
                          { name: 'Ámbar Dorado', hex: '#D97706' },
                          { name: 'Oscuro Elegante', hex: '#0F172A' },
                          { name: 'Púrpura Premium', hex: '#7C3AED' },
                        ].map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => setAccentColor(preset.hex)}
                            className={`w-7 h-7 rounded-lg transition-transform cursor-pointer border ${
                              accentColor.toLowerCase() === preset.hex.toLowerCase()
                                ? 'scale-110 ring-2 ring-white border-white'
                                : 'border-slate-700 opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Términos, Validez & Firma */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" />
                    <span>Términos, Validez & Pie de Página</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Texto de Validez del Presupuesto
                    </label>
                    <input
                      type="text"
                      value={validityDaysText}
                      onChange={(e) => setValidityDaysText(e.target.value)}
                      placeholder="Ej: Presupuesto válido por 10 días a partir de la fecha de emisión."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Aclaraciones Fijas de Cotización
                    </label>
                    <textarea
                      rows={2}
                      value={footerNotes}
                      onChange={(e) => setFooterNotes(e.target.value)}
                      placeholder="Ej: Precios sujetos a variación según disponibilidad de repuestos e insumos al momento de ejecutar el trabajo."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Condiciones de Garantía / Trabajo
                    </label>
                    <textarea
                      rows={2}
                      value={customTerms}
                      onChange={(e) => setCustomTerms(e.target.value)}
                      placeholder="Ej: Trabajos de mano de obra y repuestos garantizados según especificaciones técnicas de fábrica."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showSignatureBlock}
                        onChange={(e) => setShowSignatureBlock(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-900"
                      />
                      <span>Incluir línea para Firma de Conformidad del Cliente</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showItemCode}
                        onChange={(e) => setShowItemCode(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-900"
                      />
                      <span>Mostrar columna de Código de Repuesto</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showUnitPrices}
                        onChange={(e) => setShowUnitPrices(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-900"
                      />
                      <span>Mostrar columna de Precios Unitarios</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Live Preview Column (5 Cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Vista Previa en Tiempo Real</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Así se verá tu PDF / Impresión
                  </span>
                </div>

                {/* Simulated Sheet Card */}
                <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-300 font-sans text-xs space-y-3 relative overflow-hidden">
                  {/* Accent Top Bar */}
                  <div className="h-1.5 -mx-5 -mt-5 mb-4" style={{ backgroundColor: accentColor }} />

                  {/* Header */}
                  <div className="flex justify-between items-start pb-3 border-b-2 border-slate-900 gap-2">
                    <div className={`flex items-center gap-3 ${headerLogoPosition === 'right' ? 'flex-row-reverse' : ''}`}>
                      {headerLogoPosition !== 'hidden' && (
                        <img
                          src={logoUrl || '/lubricentro-official-logo.png'}
                          alt="Logo"
                          className="h-10 w-auto max-w-[120px] object-contain"
                        />
                      )}
                      <div>
                        <h1 className="text-sm font-black text-slate-950 tracking-tight">
                          {companyName || 'LUBRICENTRO 2.0'}
                        </h1>
                        <p className="text-[10px] font-bold uppercase" style={{ color: accentColor }}>
                          {headerTitle || 'PRESUPUESTO DE SERVICIO'}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium">
                          {headerSubtitle || commercialInfo || 'Lubricentro & Mecánica Automotor'}
                        </p>
                        {showBranchAddresses && (
                          <p className="text-[9px] text-slate-500">
                            • {addressEscobar || 'Estrada 1355'} • {addressMaschwitz || 'Colectora Maschwitz'}
                          </p>
                        )}
                        {headerCustomText && (
                          <p className="text-[9px] text-slate-500 italic mt-0.5">
                            {headerCustomText}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-right shrink-0">
                      <div className="text-xs font-black text-slate-900">
                        PRESUPUESTO #1002
                      </div>
                      <div className="text-[9px] text-slate-600">
                        Fecha: <strong>{new Date().toLocaleDateString('es-AR')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Client & Vehicle Card */}
                  <div className="py-2 border-b border-slate-200 grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">Cliente:</span>
                      <span className="font-bold text-slate-900">Juan Pérez</span>
                      <span className="text-slate-600 block">Tel: 11-6488-4571</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">Vehículo:</span>
                      <span className="font-bold text-slate-900">Ford Ranger 3.2 (2022)</span>
                      <span className="font-mono font-bold block" style={{ color: accentColor }}>
                        Patente: AE 123 CD
                      </span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="text-white font-bold uppercase text-[9px]" style={{ backgroundColor: accentColor }}>
                          <th className="py-1 px-1 rounded-l">Cant.</th>
                          {showItemCode && <th className="py-1 px-1">Código</th>}
                          <th className="py-1 px-1">Descripción</th>
                          {showUnitPrices && <th className="py-1 px-1 text-right">P. Unit.</th>}
                          <th className="py-1 px-1 text-right rounded-r">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-white">
                          <td className="py-1 px-1 font-mono font-bold">4.0</td>
                          {showItemCode && <td className="py-1 px-1 font-mono text-slate-500">HEL-5W30</td>}
                          <td className="py-1 px-1 font-semibold">Aceite Shell Helix Ultra 5W-30 (Lts)</td>
                          {showUnitPrices && <td className="py-1 px-1 text-right font-mono text-slate-600">$ 14.500</td>}
                          <td className="py-1 px-1 text-right font-mono font-bold text-slate-900">$ 58.000</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="py-1 px-1 font-mono font-bold">1.0</td>
                          {showItemCode && <td className="py-1 px-1 font-mono text-slate-500">WO-120</td>}
                          <td className="py-1 px-1 font-semibold">Filtro de Aceite Wega W-120</td>
                          {showUnitPrices && <td className="py-1 px-1 text-right font-mono text-slate-600">$ 8.500</td>}
                          <td className="py-1 px-1 text-right font-mono font-bold text-slate-900">$ 8.500</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <div className="pt-2 border-t border-slate-900 flex justify-end">
                    <div className="w-48 text-right space-y-0.5">
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>Subtotal:</span>
                        <span className="font-mono">$ 66.500</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>Mano de Obra:</span>
                        <span className="font-mono">$ 12.000</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black text-slate-950 pt-1 border-t border-slate-300">
                        <span>TOTAL:</span>
                        <span className="font-mono text-sm font-black" style={{ color: accentColor }}>$ 78.500</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Terms */}
                  {(footerNotes || customTerms) && (
                    <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-600 space-y-0.5">
                      {footerNotes && <p><strong>Nota:</strong> {footerNotes}</p>}
                      {customTerms && <p><strong>Condiciones:</strong> {customTerms}</p>}
                    </div>
                  )}

                  {/* Signature */}
                  {showSignatureBlock && (
                    <div className="pt-4 flex justify-end">
                      <div className="w-36 text-center">
                        <div className="border-b border-slate-400 mb-0.5" />
                        <span className="text-[8px] text-slate-500 font-medium">Firma y Aclaración de Conformidad</span>
                      </div>
                    </div>
                  )}

                  {/* Validity Footer */}
                  <div className="pt-2 border-t border-dashed border-slate-300 text-[8px] text-slate-500 text-center font-medium">
                    {validityDaysText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Estado del Sistema & Sincronización Firebase */}
        {activeTab === 'sistema' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white tracking-tight">
                      Estado del Sistema & Sincronización Firebase
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      EN VIVO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monitor en tiempo real de la base de datos Firestore y herramientas de recuperación manual
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setIsTestingPing(true);
                  const start = performance.now();
                  try {
                    if (onManualPullData) await onManualPullData();
                    const duration = Math.round(performance.now() - start);
                    setPingMs(duration);
                  } catch {
                    setPingMs(999);
                  } finally {
                    setIsTestingPing(false);
                  }
                }}
                disabled={isTestingPing || isPulling}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                <Wifi className={`w-3.5 h-3.5 text-emerald-400 ${isTestingPing ? 'animate-spin' : ''}`} />
                <span>{isTestingPing ? 'Probando...' : 'Probar Latencia'}</span>
                {pingMs !== null && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                    {pingMs} ms
                  </span>
                )}
              </button>
            </div>

            {/* Notification message from pull action */}
            {pullMessage && (
              <div className={`p-4 rounded-2xl text-xs font-medium border flex items-center justify-between gap-3 ${
                pullMessage.includes('Error')
                  ? 'bg-red-950/60 border-red-500/40 text-red-200'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{pullMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPullMessage(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Grid 1: Diagnostic Status & Connection Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span>Conexión Firebase Firestore</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Conectado (WebSockets Active)
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Proyecto:</span>
                    <span className="font-bold text-white">ai-studio-applet-webapp-c97a3</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Región:</span>
                    <span className="text-slate-300">us-east1 (Iowa)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Modo de Listener:</span>
                    <span className="text-emerald-400 font-bold">OnSnapshot (Multi-Tab Live)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Última Sincronización Recibida</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {lastSyncTime ? lastSyncTime.toLocaleTimeString('es-AR') : 'Reciente'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">
                    {lastSyncTime
                      ? `${lastSyncTime.toLocaleDateString('es-AR')} a las ${lastSyncTime.toLocaleTimeString('es-AR')}`
                      : 'Suscripción activa recibiendo datos en vivo'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Los eventos del servidor actualizan la pantalla automáticamente cuando cualquier usuario agrega o modifica registros en otro dispositivo.
                  </p>
                </div>
              </div>
            </div>

            {/* Grid 2: Synchronized Record Counts */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>Registros Sincronizados en Memoria Local</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Clientes</span>
                  <span className="text-xl font-black text-white block">{clientsCount}</span>
                  <span className="text-[9px] text-emerald-400 font-medium block">Activos</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Vehículos</span>
                  <span className="text-xl font-black text-white block">{vehiclesCount}</span>
                  <span className="text-[9px] text-emerald-400 font-medium block">Vinculados</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Órdenes de Trabajo</span>
                  <span className="text-xl font-black text-white block">{workOrdersCount}</span>
                  <span className="text-[9px] text-blue-400 font-medium block">Registradas</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Presupuestos</span>
                  <span className="text-xl font-black text-white block">{budgetsCount}</span>
                  <span className="text-[9px] text-amber-400 font-medium block">Emitidos</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Turnos Agendados</span>
                  <span className="text-xl font-black text-white block">{appointmentsCount}</span>
                  <span className="text-[9px] text-purple-400 font-medium block">En Calendario</span>
                </div>
              </div>
            </div>

            {/* Action Card: Forzar Pull Manual */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Forzar Pull Manual de Datos (Servidor Firebase)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Si cargaste un cliente o vehículo en otra computadora o teléfono y la pantalla no lo refleja por interrupciones momentáneas de conexión, presiona este botón para forzar una consulta directa a Firebase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setIsPulling(true);
                    setPullMessage(null);
                    try {
                      if (onManualPullData) {
                        const res = await onManualPullData();
                        setPullMessage(`¡Pull manual exitoso! Se recargaron ${res.clientsCount} clientes y ${res.vehiclesCount} vehículos directamente desde Firebase.`);
                      } else {
                        setPullMessage('Sincronización manual forzada completada correctamente.');
                      }
                    } catch (err: any) {
                      setPullMessage('Error al ejecutar el pull manual: ' + (err?.message || 'Error de red'));
                    } finally {
                      setIsPulling(false);
                    }
                  }}
                  disabled={isPulling}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                  <span>{isPulling ? 'Sincronizando...' : 'Forzar Pull Manual Ahora'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Seguridad y Consistencia:</strong> El pull manual descarga los documentos directamente de la colección oficial sin borrar cambios en progreso.
                </span>
              </div>
            </div>

            {/* Card: Restablecer Clientes y Presupuestos de Muestra */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Cargar Clientes & Presupuestos Iniciales</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Carga o restaura los datos iniciales de clientes, vehículos, presupuestos y turnos de prueba en ambas sucursales.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!onRestoreSampleData) return;
                    setIsPulling(true);
                    try {
                      await onRestoreSampleData();
                      setPullMessage('¡Clientes, vehículos y presupuestos restaurados exitosamente en la base de datos!');
                    } catch (err: any) {
                      setPullMessage('Error al restaurar datos: ' + (err?.message || 'Error de red'));
                    } finally {
                      setIsPulling(false);
                    }
                  }}
                  disabled={isPulling}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-950/50 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Database className="w-4 h-4" />
                  <span>Restaurar Datos Iniciales</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Footer Save Action Bar */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            <span className="font-bold text-white block">¿Modificaste datos de la empresa, servicios o presupuestos?</span>
            <span className="text-[11px] text-slate-500">Haz clic en Guardar Cambios para aplicar la nueva configuración en todo el sistema.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving || isClearing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all shadow-xl shadow-red-950/50 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>¡Guardado con Éxito!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Todos los Cambios'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirm Service & Price Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!serviceToDelete}
        title="Eliminar Servicio y Precio"
        message={`¿Estás seguro de que deseas eliminar permanentemente el servicio "${serviceToDelete?.name}" (${serviceToDelete?.defaultPrice ? formatCurrency(serviceToDelete.defaultPrice) : 'Precio variable'}) del catálogo?`}
        confirmText="Eliminar Servicio"
        cancelText="Cancelar"
        danger={true}
        onConfirm={async () => {
          if (serviceToDelete) {
            const updated = services.filter((s) => s.id !== serviceToDelete.id);
            setServices(updated);
            await onSaveSettings({ servicesCatalog: updated });
            setServiceToDelete(null);
          }
        }}
        onCancel={() => setServiceToDelete(null)}
      />

      {/* Confirm Clear Database Dialog */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        title="¿Poner Todo en Cero y Reiniciar Base de Datos?"
        message="Esta acción eliminará de forma permanente los registros de prueba (clientes, vehículos, órdenes de trabajo, ventas, presupuestos, egresos, turnos, productos, facturas y proveedores) cargados en la base de datos, dejándolos completamente vacíos para que puedas empezar a operar de cero con datos reales. Esta operación sólo la puede realizar un Administrador."
        confirmText={isClearing ? 'Vaciando...' : 'Sí, Poner Todo en Cero'}
        cancelText="Cancelar"
        danger={true}
        onConfirm={async () => {
          if (!onClearDatabase) return;
          setIsClearing(true);
          try {
            await onClearDatabase();
          } finally {
            setIsClearing(false);
            setIsConfirmClearOpen(false);
          }
        }}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
};
