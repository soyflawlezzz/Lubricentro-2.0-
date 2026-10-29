import React, { useState } from 'react';
import { Vehicle, WorkOrder, CompanySettings } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPlate,
  formatBranchName,
  buildWhatsAppLink,
} from '../../utils/formatters';
import {
  ShieldCheck,
  Calendar,
  Gauge,
  Fuel,
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  ExternalLink,
  Car,
  QrCode,
  FileCheck,
  ChevronRight,
  Share2,
  AlertTriangle,
  Sparkles,
  PhoneCall,
  Printer,
  Award,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface DigitalPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  licensePlate: string;
  vehicle?: Vehicle;
  workOrders: WorkOrder[];
  settings?: CompanySettings;
  onOpenSticker?: () => void;
}

export const DigitalPassportModal: React.FC<DigitalPassportModalProps> = ({
  isOpen,
  onClose,
  licensePlate,
  vehicle,
  workOrders,
  settings,
  onOpenSticker,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const normalizedPlate = (licensePlate || '').trim().toUpperCase();

  // Filter orders for this plate and sort newest first
  const vehicleOrders = workOrders
    .filter((o) => (o.licensePlate || '').trim().toUpperCase() === normalizedPlate)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const lastOrder = vehicleOrders[0];
  const vehicleName = vehicle
    ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})`
    : lastOrder
    ? `${lastOrder.vehicleBrand} ${lastOrder.vehicleModel} (${lastOrder.vehicleYear})`
    : 'Vehículo Verificado';

  const currentKm = vehicle?.currentKm || lastOrder?.currentKm || 0;
  const nextKm = lastOrder?.nextServiceKm || (currentKm > 0 ? currentKm + 10000 : 0);
  const nextDate = lastOrder?.nextServiceDate;

  // Calculation for service status
  const isKmExceeded = nextKm > 0 && currentKm >= nextKm;
  const kmRemaining = nextKm > 0 ? nextKm - currentKm : 0;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pasaporte Digital de Service - ${normalizedPlate}`,
          text: `Historial verificado de mantenimiento para ${vehicleName} (${formatPlate(normalizedPlate)}) en Lubricentro 2.0`,
          url: url,
        });
        return;
      } catch {
        // user cancelled or not supported
      }
    }
    // Fallback: clipboard
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrintPassport = () => {
    window.print();
  };

  // WhatsApp contact button (Lubricentro 2.0: 1164884571 / 5491164884571)
  const branchWhatsapp =
    lastOrder?.branchId === 'maschwitz'
      ? settings?.whatsappMaschwitz || settings?.whatsapp || '5491164884571'
      : settings?.whatsappEscobar || settings?.whatsapp || '5491164884571';

  const appointmentMessage = `Hola Lubricentro 2.0! Quisiera agendar turno para mi vehículo ${vehicleName} (Patente ${formatPlate(
    normalizedPlate
  )}). Vengo siguiendo el mantenimiento por el Pasaporte QR.`;

  const waAppointmentUrl = buildWhatsAppLink(branchWhatsapp, appointmentMessage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950/40">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white tracking-wide">
                Pasaporte Digital de Service
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verificado Oficial
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Historial técnico y control de kilometraje certificado
            </p>
          </div>
        </div>
      }
      maxWidth="4xl"
    >
      <div className="space-y-6 text-slate-100 printable-passport">
        {/* Printable Official Certificate Header (hidden on screen, visible on print) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 text-slate-950">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                {settings?.companyName || 'LUBRICENTRO 2.0'}
              </h1>
              <p className="text-xs font-semibold text-slate-600">
                Libreta y Pasaporte Digital de Mantenimiento Automotor Certificado
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-black border-2 border-slate-900 px-3 py-1 rounded">
                {formatPlate(normalizedPlate)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Generado: {new Date().toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>
        </div>

        {/* Top Hero: Vehicle Plate & Status */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/30 border border-slate-800 p-6 shadow-2xl">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Left: Plate Badge & Details */}
            <div className="space-y-3">
              {/* Argentine Plate Replica Card */}
              <div className="inline-flex flex-col items-center bg-white rounded-xl shadow-lg border-2 border-slate-300 overflow-hidden min-w-[220px]">
                {/* Mercosur blue band */}
                <div className="w-full bg-[#004b93] px-3 py-0.5 flex items-center justify-between text-white text-[10px] font-bold tracking-widest uppercase">
                  <span>REPÚBLICA ARGENTINA</span>
                  <span className="text-[10px]">🇦🇷</span>
                </div>
                {/* Plate text */}
                <div className="px-5 py-2.5 text-center">
                  <span className="font-mono font-black text-2xl tracking-[0.25em] text-slate-950">
                    {formatPlate(normalizedPlate)}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-red-500" />
                  <span>{vehicleName}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Titular registrado:{' '}
                  <strong className="text-slate-200">
                    {vehicle?.clientName || lastOrder?.clientName || 'Cliente Particular'}
                  </strong>
                </p>
              </div>
            </div>

            {/* Right: Quick KM Counter & Next Service */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Kilometraje Actual
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Gauge className="w-4 h-4 text-indigo-400" />
                  <span className="text-lg sm:text-xl font-mono font-black text-white">
                    {currentKm ? `${currentKm.toLocaleString()} KM` : 'Sin registro'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Próximo Service
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="text-lg sm:text-xl font-mono font-black text-amber-400">
                    {nextKm ? `${nextKm.toLocaleString()} KM` : 'A definir'}
                  </span>
                </div>
              </div>

              {nextDate && (
                <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Fecha límite sugerida:</span>
                  <span className="font-semibold text-slate-200">{formatDate(nextDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={waAppointmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Solicitar Turno WhatsApp</span>
              </a>

              {onOpenSticker && (
                <button
                  type="button"
                  onClick={onOpenSticker}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold text-xs transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-red-400" />
                  <span>Ver / Imprimir Sticker Parabrisas</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
                title="Compartir enlace del pasaporte digital"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? '¡Enlace Copiado!' : 'Compartir'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPassport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
                title="Imprimir libreta de mantenimiento"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Libreta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Advisory Card */}
        {nextKm > 0 && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-4 ${
              isKmExceeded
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : kmRemaining <= 1500
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-current">
              {isKmExceeded ? (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              ) : kmRemaining <= 1500 ? (
                <Clock className="w-6 h-6 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">
                {isKmExceeded
                  ? '⚠️ Service Excedido por Kilometraje'
                  : kmRemaining <= 1500
                  ? '🔔 Próximo al Vencimiento del Service'
                  : '✅ Mantenimiento Preventivo al Día'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {isKmExceeded
                  ? `El vehículo ha superado el kilometraje recomendado de ${nextKm.toLocaleString()} KM. Recomendamos renovar aceite y filtros para proteger el motor.`
                  : kmRemaining <= 1500
                  ? `Quedan aproximadamente ${kmRemaining.toLocaleString()} KM para el próximo cambio de fluidos y filtros.`
                  : `Todo en orden. Próxima inspección programada para los ${nextKm.toLocaleString()} KM.`}
              </p>
            </div>
          </div>
        )}

        {/* Technical Timeline of Completed Services */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-red-500" />
              <span>Historial Certificado de Intervenciones ({vehicleOrders.length})</span>
            </h3>
            <span className="text-xs text-slate-400">
              Registrado y certificado por mecánicos de Lubricentro 2.0
            </span>
          </div>

          {vehicleOrders.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
              <Car className="w-10 h-10 mx-auto text-slate-700 mb-2" />
              <p className="text-sm font-bold text-slate-300">
                Aún no hay órdenes de trabajo cerradas para esta patente
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Al finalizar el primer servicio en el taller, aparecerá aquí detallado con fecha, aceite utilizado y firma técnica.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicleOrders.map((order, idx) => {
                const isLatest = idx === 0;

                // Extract oil and filter products from items
                const oilItem = order.items?.find(
                  (i) => i.category === 'aceite' || i.description.toLowerCase().includes('aceite')
                );
                const filterItems = order.items?.filter(
                  (i) => i.category === 'filtro' || i.description.toLowerCase().includes('filtro')
                );

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isLatest
                        ? 'bg-slate-900 border-red-500/40 shadow-lg shadow-red-950/20'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Date, OT # and Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-red-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          OT #{order.orderNumber}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>Sucursal {formatBranchName(order.branchId)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isLatest && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase">
                            <Sparkles className="w-3 h-3" />
                            Último Service
                          </span>
                        )}
                        <span className="font-mono font-black text-sm text-indigo-300 bg-slate-950 px-3 py-0.5 rounded-lg border border-slate-800">
                          {order.currentKm ? `${order.currentKm.toLocaleString()} KM` : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Oil & Filters Tech Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 text-xs">
                      {/* Fluid / Oil Details */}
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5 text-amber-500" />
                          <span>Aceite / Lubricante Aplicado</span>
                        </div>
                        <div className="font-bold text-sm text-white">
                          {order.oilBrand || oilItem?.description || 'Aceite homologado de alta gama'}
                        </div>
                        {order.fluidType && (
                          <div className="text-[11px] text-slate-400">
                            Viscosidad / Tipo:{' '}
                            <span className="font-mono font-bold text-amber-400">
                              {order.fluidType}
                            </span>
                          </div>
                        )}
                        {oilItem && (
                          <div className="text-[11px] text-slate-400">
                            Volumen despachado:{' '}
                            <span className="font-bold text-slate-200">
                              {oilItem.quantity} {oilItem.quantity === 1 ? 'Litro' : 'Litros'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Filters */}
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-red-500" />
                          <span>Filtros Reemplazados</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">F. Aceite:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {order.oilFilterCode || 'Instalado'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">F. Aire:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {order.airFilterCode || (filterItems?.some((f) => f.description.toLowerCase().includes('aire')) ? 'Instalado' : 'No requirió')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">F. Habitáculo:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {order.cabinFilterCode || 'Revisado'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">F. Combustible:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {filterItems?.some((f) => f.description.toLowerCase().includes('combustible')) ? 'Instalado' : 'Verificado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Courtesy inspection summary if present */}
                    {order.courtesyChecks && (
                      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300">Puntos de Cortesía:</span>
                        <span>Frenos: {order.courtesyChecks.brakePadsCheck ? '✅ OK' : '⚠️ Revisar'}</span>
                        <span>Líquido Refrigerante: {order.courtesyChecks.coolant ? '✅ OK' : '⚠️ Nivel'}</span>
                        <span>Neumáticos: {order.courtesyChecks.tirePressure ? '✅ OK' : 'Normal'}</span>
                        <span>Líquido de Frenos: {order.courtesyChecks.brakeFluid ? '✅ OK' : 'Verificar'}</span>
                      </div>
                    )}

                    {/* Bottom notes and mechanic */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        {order.assignedMechanic ? (
                          <span>Mecánico responsable: <strong className="text-slate-300">{order.assignedMechanic}</strong></span>
                        ) : (
                          <span>Técnico: <strong className="text-slate-300">Equipo Técnico Oficial</strong></span>
                        )}
                        {order.assignedBay && (
                          <span className="ml-2">• {order.assignedBay.replace('_', ' ').toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-400">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Guarantee / Quality Seal */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">
                Garantía de Servicio & Calidad Certificada
              </span>
              <p className="text-slate-400 text-[11px]">
                Lubricentro 2.0 utiliza únicamente lubricantes de marcas líderes y filtros homologados bajo normas OEM.
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="font-mono text-[11px] text-slate-500 block">ID Pasaporte</span>
            <span className="font-mono font-bold text-slate-300 text-xs">{normalizedPlate}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
