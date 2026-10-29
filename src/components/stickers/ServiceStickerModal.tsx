import React, { useState, useEffect, useRef } from 'react';
import { WorkOrder, Vehicle, CompanySettings } from '../../types';
import {
  formatDate,
  formatPlate,
  formatBranchName,
} from '../../utils/formatters';
import { generateQrDataUrl, getVehiclePassportUrl } from '../../utils/qrGenerator';
import {
  Printer,
  Download,
  Share2,
  QrCode,
  Sparkles,
  Settings2,
  Calendar,
  Gauge,
  Fuel,
  CheckSquare,
  Square,
  Car,
  ShieldCheck,
  Eye,
  RefreshCw,
  Layers,
  FileText,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import html2canvas from 'html2canvas-pro';

export type StickerFormat = 'windshield' | 'thermal' | 'a4_sheet';

interface ServiceStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: WorkOrder | null;
  vehicle?: Vehicle | null;
  settings?: CompanySettings;
  onOpenPassport?: (plate: string) => void;
}

export const ServiceStickerModal: React.FC<ServiceStickerModalProps> = ({
  isOpen,
  onClose,
  order,
  vehicle,
  settings,
  onOpenPassport,
}) => {
  // Determine base data from order or vehicle
  const licensePlate = (order?.licensePlate || vehicle?.licensePlate || '').trim().toUpperCase();
  const vehicleName = order
    ? `${order.vehicleBrand} ${order.vehicleModel} (${order.vehicleYear})`
    : vehicle
    ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})`
    : 'Vehículo';

  const defaultCurrentKm = order?.currentKm || vehicle?.currentKm || 0;

  // Configuration States
  const [format, setFormat] = useState<StickerFormat>('windshield');
  const [currentKm, setCurrentKm] = useState<number>(defaultCurrentKm);
  const [intervalKm, setIntervalKm] = useState<number>(10000);
  const [customNextKm, setCustomNextKm] = useState<number>(
    defaultCurrentKm > 0 ? defaultCurrentKm + 10000 : 10000
  );
  const [serviceDate, setServiceDate] = useState<string>(
    order?.createdAt ? order.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [monthsValid, setMonthsValid] = useState<number>(12);
  const [oilBrand, setOilBrand] = useState<string>(
    order?.oilBrand || order?.fluidType || 'Total Quartz 10W-40'
  );
  const [oilFilter, setOilFilter] = useState<boolean>(true);
  const [airFilter, setAirFilter] = useState<boolean>(
    Boolean(order?.airFilterCode || order?.servicesSelected?.includes('filtro_aire'))
  );
  const [fuelFilter, setFuelFilter] = useState<boolean>(false);
  const [cabinFilter, setCabinFilter] = useState<boolean>(Boolean(order?.cabinFilterCode));
  const [branchId, setBranchId] = useState<string>(order?.branchId || vehicle?.branchId || 'escobar');
  const [customNote, setCustomNote] = useState<string>(
    'Conserve este sticker para la garantía de motor'
  );
  const [stickerDesign, setStickerDesign] = useState<'official_qr' | 'technical_card'>('official_qr');
  const [showVehicleDetailsTag, setShowVehicleDetailsTag] = useState<boolean>(true);

  // QR Code base64
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Sticker container ref for screenshot / download
  const stickerRef = useRef<HTMLDivElement>(null);

  // Sync props when opening
  useEffect(() => {
    if (order) {
      const baseKm = order.currentKm || 0;
      setCurrentKm(baseKm);
      const nextK = order.nextServiceKm || (baseKm > 0 ? baseKm + 10000 : 10000);
      setCustomNextKm(nextK);
      setOilBrand(
        order.oilBrand
          ? `${order.oilBrand} ${order.fluidType || ''}`.trim()
          : order.fluidType || 'Total Quartz 10W-40'
      );
      setAirFilter(Boolean(order.airFilterCode || order.servicesSelected?.includes('filtro_aire')));
      setCabinFilter(Boolean(order.cabinFilterCode));
      setBranchId(order.branchId || 'escobar');
      if (order.createdAt) {
        setServiceDate(order.createdAt.split('T')[0]);
      }
    } else if (vehicle) {
      const baseKm = vehicle.currentKm || 0;
      setCurrentKm(baseKm);
      setCustomNextKm(baseKm > 0 ? baseKm + 10000 : 10000);
      setBranchId(vehicle.branchId || 'escobar');
    }
  }, [order, vehicle]);

  // Recalculate next km when intervalKm or currentKm changes
  const handleIntervalChange = (km: number) => {
    setIntervalKm(km);
    setCustomNextKm((currentKm || 0) + km);
  };

  // Compute next service date based on monthsValid
  const computedNextDate = (() => {
    try {
      const d = new Date(serviceDate);
      d.setMonth(d.getMonth() + monthsValid);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  })();

  // Generate QR code data URL whenever plate changes
  useEffect(() => {
    if (!licensePlate) return;
    const passportUrl = getVehiclePassportUrl(licensePlate);
    generateQrDataUrl(passportUrl, {
      width: 280,
      margin: 1,
    }).then((url) => {
      setQrDataUrl(url);
    });
  }, [licensePlate]);

  if (!isOpen) return null;

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Download High-Res PNG
  const handleDownloadPng = async () => {
    if (!stickerRef.current) return;
    try {
      setIsGeneratingImage(true);
      const canvas = await html2canvas(stickerRef.current, {
        scale: 3, // crisp high resolution for printing
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const dataUri = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `Sticker_Service_${licensePlate || 'Auto'}.png`;
      a.click();
    } catch (err) {
      console.error('Error al exportar sticker:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const branchPhone =
    branchId === 'maschwitz'
      ? settings?.whatsappMaschwitz || '11 2233-4455'
      : settings?.whatsappEscobar || '11 3344-5566';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-950/40">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white tracking-wide">
                Generador de Sticker QR para Parabrisas
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Calcomanía Oficial
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Recordatorio adhesivo con QR conectado al Pasaporte Digital del Auto
            </p>
          </div>
        </div>
      }
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Top Controls: Format Selector & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 print:hidden">
          {/* Format & Style Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFormat('windshield')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  format === 'windshield'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Calcomanía Parabrisas</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  format === 'thermal'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Térmico POS 80mm</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('a4_sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  format === 'a4_sheet'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Plancha A4</span>
              </button>
            </div>

            {/* Design Style Sub-selector for Windshield */}
            {format === 'windshield' && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setStickerDesign('official_qr')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stickerDesign === 'official_qr'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Diseño QR Oficial (Limpio)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStickerDesign('technical_card')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stickerDesign === 'technical_card'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ficha Técnica Completa</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onOpenPassport && (
              <button
                type="button"
                onClick={() => onOpenPassport(licensePlate)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="Probar destino del código QR"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ver Pasaporte QR</span>
              </button>
            )}

            <button
              type="button"
              disabled={isGeneratingImage}
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Descargar imagen PNG en alta definición"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isGeneratingImage ? 'Generando...' : 'Descargar PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all shadow-md shadow-red-950/50 cursor-pointer"
              title="Imprimir en impresora de etiquetas o convencional"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Sticker</span>
            </button>
          </div>
        </div>

        {/* Two-Column Workspace: Left Configurator / Right Visual Realistic Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Parameters & Customization (5 columns) */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-red-500" />
                  Datos del Servicio
                </span>
                <span className="font-mono text-xs font-bold text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {formatPlate(licensePlate)}
                </span>
              </div>

              {/* Oil Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Aceite / Lubricante Aplicado
                </label>
                <input
                  type="text"
                  value={oilBrand}
                  onChange={(e) => setOilBrand(e.target.value)}
                  placeholder="Ej: Total Quartz 7000 10W-40"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 font-semibold"
                />
              </div>

              {/* Current KM & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    KM Actual (Service)
                  </label>
                  <input
                    type="number"
                    value={currentKm || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setCurrentKm(v);
                      setCustomNextKm(v + intervalKm);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Fecha Realizado
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>

              {/* Next Service Interval */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    Intervalo Próximo Service
                  </label>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">
                    +{intervalKm.toLocaleString()} KM
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5000, 8000, 10000, 15000].map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => handleIntervalChange(km)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        intervalKm === km
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {km / 1000}k KM
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Next KM & Months */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Próximo KM Exacto
                  </label>
                  <input
                    type="number"
                    value={customNextKm || ''}
                    onChange={(e) => setCustomNextKm(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Vigencia Límite
                  </label>
                  <select
                    value={monthsValid}
                    onChange={(e) => setMonthsValid(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-red-500"
                  >
                    <option value={6}>6 Meses</option>
                    <option value={12}>12 Meses (1 Año)</option>
                    <option value={18}>18 Meses</option>
                  </select>
                </div>
              </div>

              {/* Filters Checked */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">
                  Filtros Reemplazados (Checklist en Sticker)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => setOilFilter(!oilFilter)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer select-none"
                  >
                    {oilFilter ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                    <span className={oilFilter ? 'text-white font-bold' : 'text-slate-400'}>
                      Filtro Aceite
                    </span>
                  </label>

                  <label
                    onClick={() => setAirFilter(!airFilter)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer select-none"
                  >
                    {airFilter ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                    <span className={airFilter ? 'text-white font-bold' : 'text-slate-400'}>
                      Filtro Aire
                    </span>
                  </label>

                  <label
                    onClick={() => setFuelFilter(!fuelFilter)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer select-none"
                  >
                    {fuelFilter ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                    <span className={fuelFilter ? 'text-white font-bold' : 'text-slate-400'}>
                      F. Combustible
                    </span>
                  </label>

                  <label
                    onClick={() => setCabinFilter(!cabinFilter)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer select-none"
                  >
                    {cabinFilter ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                    <span className={cabinFilter ? 'text-white font-bold' : 'text-slate-400'}>
                      F. Habitáculo
                    </span>
                  </label>
                </div>
              </div>

              {/* Branch */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Sucursal Taller
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-red-500"
                  >
                    <option value="escobar">Escobar</option>
                    <option value="maschwitz">Maschwitz</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Leyenda Inferior
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Visual Realistic Windshield & Printable Preview (7 columns) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            {/* Visual Glass / Realistic Mockup Frame for Windshield Preview */}
            <div className="w-full rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              {/* Background Windshield Tint and Reflection */}
              <div className="absolute inset-0 bg-radial from-slate-800/20 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/5 rotate-12 blur-2xl pointer-events-none" />

              <div className="text-center mb-4 print:hidden">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  {format === 'windshield'
                    ? 'Vista Previa: Calcomanía Parabrisas (70 x 50 mm)'
                    : format === 'thermal'
                    ? 'Vista Previa: Tique Térmico Continuo 80mm'
                    : 'Vista Previa: Plancha Adhesiva A4'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {format === 'windshield'
                    ? 'Colocación sugerida: Esquina superior izquierda del parabrisas'
                    : 'Impresión rápida y nítida en blanco y negro'}
                </p>
              </div>

              {/* ACTUAL STICKER CONTAINER FOR HTML2CANVAS & PRINT */}
              <div
                id="printable-service-sticker"
                ref={stickerRef}
                className={`transition-all shadow-2xl ${
                  format === 'windshield'
                    ? 'w-[360px] sm:w-[400px] bg-white text-slate-950 rounded-2xl p-4 border-2 border-slate-400 relative overflow-hidden'
                    : format === 'thermal'
                    ? 'w-[320px] bg-white text-slate-950 p-4 border border-slate-300 font-mono text-xs'
                    : 'w-[420px] bg-white text-slate-950 rounded-xl p-4 border border-slate-400 shadow-md'
                }`}
                style={{
                  // High contrast crisp rendering
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {/* WINDSHIELD ADHESIVE STICKER LAYOUT */}
                {format === 'windshield' && (
                  stickerDesign === 'official_qr' ? (
                    <div className="flex flex-col items-center justify-between text-center bg-white text-black p-4 sm:p-5 rounded-3xl border-4 border-black relative overflow-hidden space-y-3">
                      {/* Top Logo Image - Spans almost edge-to-edge proportionally */}
                      <div className="flex flex-col items-center pt-1 pb-1 w-full px-1">
                        <img
                          src={settings?.logoUrl || "/lubricentro-logo-official.png"}
                          alt="Lubricentro 2.0"
                          className="w-[94%] h-auto max-h-40 sm:max-h-48 object-contain mx-auto transition-all my-0.5"
                        />
                      </div>

                      {/* Header: TU SERVICE */}
                      <div className="font-black text-2xl sm:text-3xl tracking-tight text-black uppercase -mt-1 font-sans">
                        TU SERVICE
                      </div>

                      {/* Center QR Box */}
                      <div className="p-2.5 bg-white border-3 border-black rounded-2xl shadow-sm my-0.5 inline-block">
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt="QR Service"
                            className="w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto"
                          />
                        ) : (
                          <div className="w-48 h-48 sm:w-56 sm:h-56 bg-slate-100 flex items-center justify-center rounded-xl">
                            <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                          </div>
                        )}
                      </div>

                      {/* Footer Text */}
                      <div className="font-black text-xs sm:text-sm tracking-tight text-black uppercase leading-tight max-w-[280px]">
                        ESCANEÁ Y AGENDÁ TU PRÓXIMO SERVICE
                      </div>

                      {/* Vehicle Info Badge */}
                      {showVehicleDetailsTag && licensePlate && (
                        <div className="w-full mt-1 pt-1.5 border-t-2 border-black/10 flex items-center justify-between font-mono text-[10px] sm:text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                          <span>PATENTE: {formatPlate(licensePlate)}</span>
                          <span>PRÓX: {customNextKm ? `${customNextKm.toLocaleString()} KM` : '10.000 KM'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between space-y-2.5">
                      {/* Header: Shop Brand + Argentina Flag Band */}
                      <div className="border-b-2 border-red-600 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                              2.0
                            </div>
                            <div>
                              <span className="font-black text-sm tracking-tight text-slate-950 block leading-tight">
                                LUBRICENTRO 2.0
                              </span>
                              <span className="text-[9px] font-bold text-red-600 tracking-wider uppercase block">
                                Service Oficial &bull; {formatBranchName(branchId)}
                              </span>
                            </div>
                          </div>

                          {/* Argentine flag emblem */}
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <span className="text-xs">🇦🇷</span>
                            <span className="text-[9px] font-black text-slate-700 tracking-wider">
                              SERVICE
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Plate & Model Bar */}
                      <div className="flex items-center justify-between bg-slate-100 rounded-lg px-2.5 py-1 border border-slate-300">
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block">
                            Patente
                          </span>
                          <span className="font-mono font-black text-sm text-slate-950 tracking-wider">
                            {formatPlate(licensePlate)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-bold text-slate-500 uppercase block">
                            Vehículo
                          </span>
                          <span className="font-bold text-[11px] text-slate-800 line-clamp-1 max-w-[140px]">
                            {vehicleName}
                          </span>
                        </div>
                      </div>

                      {/* Middle Section: Technical Service Data & QR Code side-by-side */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Left: Service Data (7 cols) */}
                        <div className="col-span-7 space-y-1.5 text-[10px]">
                          {/* Oil Used */}
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">
                              Lubricante / Viscosidad:
                            </span>
                            <span className="font-bold text-[11px] text-slate-950 block leading-tight">
                              {oilBrand}
                            </span>
                          </div>

                          {/* Realized Date & KM */}
                          <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-200 text-[9px]">
                            <div>
                              <span className="text-slate-500 block">Fecha:</span>
                              <span className="font-bold text-slate-900">
                                {formatDate(serviceDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">KM Hecho:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {currentKm ? `${currentKm.toLocaleString()}k` : '-'}
                              </span>
                            </div>
                          </div>

                          {/* Filters Replaced Checklist */}
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">
                              Filtros:
                            </span>
                            <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[9px]">
                              <span className={oilFilter ? 'font-bold text-red-600' : 'text-slate-400'}>
                                {oilFilter ? '☑' : '☐'} Aceite
                              </span>
                              <span className={airFilter ? 'font-bold text-red-600' : 'text-slate-400'}>
                                {airFilter ? '☑' : '☐'} Aire
                              </span>
                              <span className={fuelFilter ? 'font-bold text-red-600' : 'text-slate-400'}>
                                {fuelFilter ? '☑' : '☐'} Comb.
                              </span>
                              <span className={cabinFilter ? 'font-bold text-red-600' : 'text-slate-400'}>
                                {cabinFilter ? '☑' : '☐'} Habit.
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: QR Code (5 cols) */}
                        <div className="col-span-5 flex flex-col items-center justify-center p-1.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          {qrDataUrl ? (
                            <img
                              src={qrDataUrl}
                              alt="QR Pasaporte"
                              className="w-24 h-24 object-contain"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-slate-200 flex items-center justify-center">
                              <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
                            </div>
                          )}
                          <span className="text-[8px] font-black text-slate-900 tracking-tight mt-0.5 block leading-tight">
                            ESCANEÁ CON CELULAR
                          </span>
                          <span className="text-[7px] text-slate-500 block leading-tight">
                            Pasaporte Digital
                          </span>
                        </div>
                      </div>

                      {/* PRÓXIMO CAMBIO: Eye-catching Yellow / Black Warning Box */}
                      <div className="bg-amber-400 border-2 border-amber-600 rounded-xl p-2 text-slate-950 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider block leading-tight text-amber-950">
                            PRÓXIMO SERVICE SUGERIDO
                          </span>
                          <span className="font-mono font-black text-lg tracking-tight block leading-tight">
                            {customNextKm ? `${customNextKm.toLocaleString()} KM` : 'A DEFINIR'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-bold text-amber-950 uppercase block">
                            O VENCE EN
                          </span>
                          <span className="font-bold text-xs text-slate-950 block">
                            {computedNextDate ? formatDate(computedNextDate) : '1 Año'}
                          </span>
                        </div>
                      </div>

                      {/* Footer Contact */}
                      <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-600">
                        <span>WhatsApp Turnos: <strong>{branchPhone}</strong></span>
                        <span className="font-medium italic">{customNote}</span>
                      </div>
                    </div>
                  )
                )}

                {/* THERMAL RECEIPT (80mm) LAYOUT */}
                {format === 'thermal' && (
                  <div className="space-y-3 text-center border-t border-b border-dashed border-slate-900 py-3">
                    <div className="text-center">
                      <h2 className="text-base font-black uppercase tracking-tight">
                        LUBRICENTRO 2.0
                      </h2>
                      <p className="text-[10px] uppercase font-bold">
                        Comprobante de Service & Adhesivo
                      </p>
                      <p className="text-[9px] text-slate-600">
                        Sucursal {formatBranchName(branchId)} &bull; Tel: {branchPhone}
                      </p>
                    </div>

                    <div className="border-t border-b border-slate-900 py-1.5 text-left text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span>PATENTE:</span>
                        <strong className="font-mono text-sm">{formatPlate(licensePlate)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>VEHÍCULO:</span>
                        <strong className="truncate max-w-[170px]">{vehicleName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>FECHA SERVICE:</span>
                        <strong>{formatDate(serviceDate)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>KM SERVICE:</span>
                        <strong className="font-mono">{currentKm.toLocaleString()} KM</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>ACEITE:</span>
                        <strong className="truncate max-w-[170px]">{oilBrand}</strong>
                      </div>
                    </div>

                    {/* Filters list */}
                    <div className="text-left text-[10px] space-y-0.5">
                      <span className="font-bold block">FILTROS:</span>
                      <div className="grid grid-cols-2 gap-1 font-mono">
                        <span>{oilFilter ? '[X]' : '[ ]'} Aceite</span>
                        <span>{airFilter ? '[X]' : '[ ]'} Aire</span>
                        <span>{fuelFilter ? '[X]' : '[ ]'} Combustible</span>
                        <span>{cabinFilter ? '[X]' : '[ ]'} Habitáculo</span>
                      </div>
                    </div>

                    {/* Next service box */}
                    <div className="border-2 border-slate-950 p-2 my-2 text-center">
                      <span className="text-[10px] font-black uppercase block">
                        PRÓXIMO SERVICE A LOS:
                      </span>
                      <span className="text-xl font-black font-mono block">
                        {customNextKm.toLocaleString()} KM
                      </span>
                      <span className="text-[9px] text-slate-700 block">
                        O límite: {computedNextDate ? formatDate(computedNextDate) : '12 Meses'}
                      </span>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center my-2">
                      {qrDataUrl && (
                        <img
                          src={qrDataUrl}
                          alt="QR Pasaporte"
                          className="w-28 h-28 object-contain"
                        />
                      )}
                      <span className="text-[9px] font-black mt-1 block">
                        ESCANEÁ PARA VER HISTORIAL DIGITAL
                      </span>
                      <span className="text-[8px] text-slate-600 block">
                        www.lubricentro20.com
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-600 pt-1 border-t border-dotted border-slate-800">
                      *** CONSERVE ESTE RECORDATORIO ***
                    </div>
                  </div>
                )}

                {/* A4 SHEET (Multi-sticker layout) */}
                {format === 'a4_sheet' && (
                  <div className="space-y-4">
                    <div className="text-center pb-2 border-b border-slate-300">
                      <span className="text-xs font-bold text-slate-700">
                        Plancha de Stickers para Recortar (Formato Hoja A4)
                      </span>
                    </div>
                    {/* Render 2 preview stickers for layout */}
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="border-2 border-dashed border-slate-400 p-3 rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <span className="font-black text-red-600 text-xs block">
                              LUBRICENTRO 2.0 &bull; {formatBranchName(branchId)}
                            </span>
                            <div className="font-mono font-black text-sm">
                              {formatPlate(licensePlate)} &bull; {vehicleName}
                            </div>
                            <div className="text-[10px] text-slate-700">
                              Aceite: <strong>{oilBrand}</strong> | KM: <strong>{currentKm.toLocaleString()}</strong>
                            </div>
                            <div className="text-amber-800 font-black text-xs">
                              Próximo: {customNextKm.toLocaleString()} KM ({computedNextDate ? formatDate(computedNextDate) : '1 Año'})
                            </div>
                          </div>
                          {qrDataUrl && (
                            <img src={qrDataUrl} alt="QR" className="w-16 h-16 object-contain" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tips for shop manager below preview */}
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 print:hidden">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  El código QR es permanente y único por patente. Al escanearlo, el cliente ve su historial completo sin necesidad de instalar apps.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
