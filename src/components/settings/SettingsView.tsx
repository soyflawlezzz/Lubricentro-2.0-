import React, { useState, useEffect } from 'react';
import { CompanySettings, ServiceItemDef } from '../../types';
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
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

interface SettingsViewProps {
  settings?: CompanySettings;
  onSaveSettings: (settings: Partial<CompanySettings>) => Promise<void>;
  onClearDatabase?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onClearDatabase,
}) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'empresa' | 'servicios' | 'whatsapp' | 'pagos' | 'precios'>('empresa');
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItemDef | null>(null);

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

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || 'LUBRICENTRO 2.0');
      setLogoUrl(settings.logoUrl || '');
      setPhone(settings.phone || '');
      setWhatsapp(settings.whatsapp || '');
      setAddressEscobar(settings.addressEscobar || '');
      setAddressMaschwitz(settings.addressMaschwitz || '');
      setEmail(settings.email || '');
      setCommercialInfo(settings.commercialInfo || '');

      setGoogleDrivePriceListUrl(settings.googleDrivePriceListUrl || '');
      setDefaultPriceMarginPercent(settings.defaultPriceMarginPercent ?? 40);
      setLastPriceListSyncDate(settings.lastPriceListSyncDate || '');

      setWaReady(settings.whatsappReadyTemplate || '');
      setWaBudget(settings.whatsappBudgetTemplate || '');
      setWaReminder(settings.whatsappReminderTemplate || '');

      setServices(settings.servicesCatalog || []);
      setPaymentMethods(settings.paymentMethods || []);
    }
  }, [settings]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        companyName,
        logoUrl: logoUrl.trim() || undefined,
        phone,
        whatsapp,
        addressEscobar,
        addressMaschwitz,
        email,
        commercialInfo,
        whatsappReadyTemplate: waReady,
        whatsappBudgetTemplate: waBudget,
        whatsappReminderTemplate: waReminder,
        servicesCatalog: services,
        paymentMethods,
        googleDrivePriceListUrl: googleDrivePriceListUrl.trim() || undefined,
        defaultPriceMarginPercent: Number(defaultPriceMarginPercent) || 40,
        lastPriceListSyncDate: lastPriceListSyncDate || undefined,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar configuración:', err);
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
              title="Vaciar productos, facturas y proveedores para arrancar desde cero"
            >
              <Trash2 className="w-4 h-4" />
              <span>Vaciar Catálogo / Empezar de Cero</span>
            </button>
          )}

          <button
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
                      src="/lubricentro-logo.svg"
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
        title="¿Vaciar Base de Datos para Empezar de Cero?"
        message="Esta acción eliminará de forma permanente los productos, proveedores, facturas y registros de prueba cargados en la base de datos, dejándolos completamente vacíos para que puedas empezar a cargar los tuyos desde cero hoy mismo. Esta operación sólo la puede realizar un Administrador."
        confirmText={isClearing ? 'Vaciando...' : 'Sí, Vaciar Todo'}
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
