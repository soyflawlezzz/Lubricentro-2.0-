import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder, WorkOrderStatus, CompanySettings } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatBranchName,
  buildWhatsAppLink,
} from '../../utils/formatters';
import {
  Printer,
  MessageCircle,
  Clock,
  CheckCircle,
  Wrench,
  Fuel,
  MapPin,
  Calendar,
  AlertCircle,
  User,
  CalendarClock,
  Layers,
  Calculator,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { StatusBadge, TypeBadge } from '../common/Badge';
import { WORK_ORDER_CATEGORIES } from './WorkOrderForm';

interface WorkOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WorkOrder | null;
  onUpdateStatus: (orderId: string, newStatus: WorkOrderStatus, note?: string) => Promise<void>;
  settings?: CompanySettings;
  onScheduleAppointment?: (order: WorkOrder) => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  settings,
  onScheduleAppointment,
}) => {
  const { profile, user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [copiedBreakdown, setCopiedBreakdown] = useState(false);

  if (!order) return null;

  const categoryTotals = useMemo(() => {
    if (!order.items || order.items.length === 0) return {};
    const map: Record<string, { count: number; total: number }> = {};
    order.items.forEach((item) => {
      const rawCat = item.category === 'servicio' ? 'mano_de_obra' : (item.category || 'otro');
      if (!map[rawCat]) map[rawCat] = { count: 0, total: 0 };
      map[rawCat].count += Number(item.quantity) || 1;
      map[rawCat].total += Number(item.total) || 0;
    });
    return map;
  }, [order.items]);

  const handleCopyBreakdown = () => {
    const lines = [
      `📋 *ORDEN DE TRABAJO #${order.orderNumber}*`,
      `🚗 *Vehículo:* ${order.vehicleBrand} ${order.vehicleModel} (${order.licensePlate})`,
      `👤 *Cliente:* ${order.clientName}`,
      `🏢 *Sucursal:* ${formatBranchName(order.branchId)}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ];

    if (order.items && order.items.length > 0) {
      WORK_ORDER_CATEGORIES.forEach((cat) => {
        const catItems = (order.items || []).filter(
          (i) => (i.category === 'servicio' ? 'mano_de_obra' : i.category) === cat.id
        );
        if (catItems.length > 0) {
          const subtotal = categoryTotals[cat.id]?.total || 0;
          lines.push(`${cat.icon} *${cat.name.toUpperCase()}:* ${formatCurrency(subtotal)}`);
          catItems.forEach((it) => {
            lines.push(
              `   • ${it.description}${it.code ? ` [${it.code}]` : ''} (x${it.quantity}) - ${formatCurrency(it.total)}`
            );
          });
          lines.push(``);
        }
      });
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💰 *TOTAL GENERAL: ${formatCurrency(order.total)}*`);
    if (order.notes) lines.push(`📝 *Notas:* ${order.notes}`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedBreakdown(true);
    setTimeout(() => setCopiedBreakdown(false), 3000);
  };

  const handleStatusChange = async (nextStatus: WorkOrderStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(
        order.id,
        nextStatus,
        statusNote || `Cambio de estado a ${nextStatus}`
      );
      setStatusNote('');
    } catch (err) {
      console.error(err);
      alert('Error al actualizar estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp messages
  const readyMessage =
    settings?.whatsappReadyTemplate
      ?.replace('{cliente}', order.clientName)
      ?.replace('{vehiculo}', `${order.vehicleBrand} ${order.vehicleModel}`)
      ?.replace('{patente}', order.licensePlate)
      ?.replace('{sucursal}', formatBranchName(order.branchId))
      ?.replace('{total}', formatCurrency(order.total)) ||
    `Hola ${order.clientName}, tu ${order.vehicleBrand} ${order.vehicleModel} (${order.licensePlate}) ya está listo en Lubricentro 2.0 (${formatBranchName(order.branchId)}). Total: ${formatCurrency(order.total)}.`;

  const waReadyLink = buildWhatsAppLink(order.clientWhatsapp || order.clientPhone, readyMessage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-mono text-red-400 font-extrabold">#{order.orderNumber}</span>
          <span className="text-slate-400">&bull;</span>
          <span>{order.vehicleBrand} {order.vehicleModel}</span>
        </div>
      }
      subtitle={`Registrada el ${formatDateTime(order.createdAt)} en Sucursal ${formatBranchName(order.branchId)}`}
      maxWidth="3xl"
    >
      <div className="space-y-6 printable-area">
        {/* Printable Workshop Header */}
        <div className="hidden print:flex items-center justify-between pb-4 border-b-2 border-slate-900 text-slate-950">
          <div className="flex items-center gap-3">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto max-w-[150px] object-contain" />
            ) : (
              <img src="/lubricentro-logo.svg" alt="Logo" className="h-12 w-auto max-w-[150px] object-contain" />
            )}
            <div>
              <h2 className="text-xl font-black text-slate-950">{settings?.companyName || 'LUBRICENTRO 2.0'}</h2>
              <p className="text-xs text-slate-600">
                Orden de Trabajo #{order.orderNumber} • Sucursal {formatBranchName(order.branchId)}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600 font-mono">
            {formatDateTime(order.createdAt)}
          </div>
        </div>

        {/* Top Badges & Print / WhatsApp Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <TypeBadge type={order.type} />
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              <MapPin className="w-3 h-3 inline mr-1 text-red-500" />
              {formatBranchName(order.branchId)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {order.clientWhatsapp && (
              <a
                href={waReadyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp "Listo"</span>
              </a>
            )}
            {onScheduleAppointment && (
              <button
                type="button"
                onClick={() => onScheduleAppointment(order)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-colors cursor-pointer"
                title="Agendar turno en el Calendario de Service"
              >
                <CalendarClock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Agendar en Calendario</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ficha</span>
            </button>
          </div>
        </div>

        {/* Client & Vehicle Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehículo */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Datos del Vehículo
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Patente:</span>
                <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {order.licensePlate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehículo:</span>
                <span className="font-semibold text-white">
                  {order.vehicleBrand} {order.vehicleModel} ({order.vehicleYear})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">KM Actual:</span>
                <span className="font-mono font-medium text-slate-200">
                  {order.currentKm ? `${order.currentKm.toLocaleString()} KM` : '-'}
                </span>
              </div>
              {order.lastServiceKm ? (
                <div className="flex justify-between">
                  <span className="text-slate-400">KM Último Service:</span>
                  <span className="font-mono font-medium text-slate-400">
                    {order.lastServiceKm.toLocaleString()} KM
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Cliente */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Datos del Cliente
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Nombre / Razón Social:</span>
                <span className="font-bold text-white">{order.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teléfono:</span>
                <span className="font-medium text-slate-200">{order.clientPhone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="font-medium text-emerald-400">{order.clientWhatsapp || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services & Technical Details */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Trabajos y Repuestos
          </div>

          {/* Selected Services */}
          <div>
            <span className="text-xs text-slate-400 block mb-1.5">Servicios ejecutados:</span>
            <div className="flex flex-wrap gap-1.5">
              {order.servicesSelected && order.servicesSelected.length > 0 ? (
                order.servicesSelected.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-950/30 text-red-300 border border-red-800/40"
                  >
                    ✓ {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">Ningún servicio específico marcado</span>
              )}
            </div>
          </div>

          {/* Aceite y Filtros Especificaciones */}
          {order.type === 'aceite_filtro' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block">Marca/Tipo Aceite:</span>
                <span className="font-bold text-white">{order.oilBrand || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Líquidos / Fluidos:</span>
                <span className="font-bold text-white">{order.fluidType || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Filtro de Aceite:</span>
                <span className="font-mono font-bold text-red-400">{order.oilFilterCode || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Filtro de Aire:</span>
                <span className="font-mono font-bold text-red-400">{order.airFilterCode || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Filtro Habitáculo:</span>
                <span className="font-mono font-bold text-red-400">{order.cabinFilterCode || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Próximo Service:</span>
                <span className="font-bold text-amber-400">
                  {order.nextServiceKm ? `${order.nextServiceKm.toLocaleString()} KM` : ''}{' '}
                  {order.nextServiceDate ? `(${formatDate(order.nextServiceDate)})` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Notas / Observaciones:</span>
              <p className="text-xs sm:text-sm text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                {order.notes}
              </p>
            </div>
          )}

          {/* Categorized Items Breakdown */}
          {order.items && order.items.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Desglose de Ítems & Repuestos ({order.items.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyBreakdown}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  {copiedBreakdown ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Detalle para WhatsApp</span>
                    </>
                  )}
                </button>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Rubro</th>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 text-center">Cant</th>
                      <th className="py-2.5 px-3 text-right">P. Unit</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {order.items.map((it, idx) => {
                      const catDef =
                        WORK_ORDER_CATEGORIES.find(
                          (c) => c.id === (it.category === 'servicio' ? 'mano_de_obra' : it.category)
                        ) || WORK_ORDER_CATEGORIES[3];

                      return (
                        <tr key={idx} className="hover:bg-slate-850/40">
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${catDef.badgeClass}`}
                            >
                              <span>{catDef.icon}</span>
                              <span>{catDef.name}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-red-400">
                            {it.code || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {it.description}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            {it.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {formatCurrency(it.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            {formatCurrency(it.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totales Parciales por Categoría Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                {WORK_ORDER_CATEGORIES.map((cat) => {
                  const catData = categoryTotals[cat.id] || { count: 0, total: 0 };
                  if (catData.count === 0) return null;

                  return (
                    <div
                      key={cat.id}
                      className={`p-2.5 rounded-xl border ${cat.cardBg} ${cat.borderColor}`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                        <span className="flex items-center gap-1">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                        <span className="font-mono text-slate-300">x{catData.count}</span>
                      </div>
                      <div className={`font-mono font-black text-xs ${cat.textColor}`}>
                        {formatCurrency(catData.total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Totales y Medio de Pago */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <span className="text-xs text-slate-400">Medio de Pago:</span>
              <span className="text-xs font-bold text-slate-200 ml-2">
                {order.paymentMethod || 'Efectivo'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total de la Orden</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Transition Control */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Actualizar Estado de la Orden
            </span>
            <span className="text-xs text-slate-400">
              Estado actual: <strong className="text-white capitalize">{order.status}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={isUpdating || order.status === 'pendiente'}
              onClick={() => handleStatusChange('pendiente')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                order.status === 'pendiente'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendiente</span>
            </button>

            <button
              type="button"
              disabled={isUpdating || order.status === 'en_proceso'}
              onClick={() => handleStatusChange('en_proceso')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                order.status === 'en_proceso'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>En Proceso</span>
            </button>

            <button
              type="button"
              disabled={isUpdating || order.status === 'a_entregar'}
              onClick={() => handleStatusChange('a_entregar')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                order.status === 'a_entregar'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>A Entregar</span>
            </button>

            <button
              type="button"
              disabled={isUpdating || order.status === 'entregada'}
              onClick={() => handleStatusChange('entregada')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                order.status === 'entregada'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Entregada</span>
            </button>
          </div>
        </div>

        {/* Status History Audit Trail */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Historial de Auditoría y Cambios de Estado
            </div>
            <div className="space-y-2 text-xs">
              {order.statusHistory.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 capitalize">
                      {h.status}
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-slate-400">{h.user}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatDateTime(h.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
