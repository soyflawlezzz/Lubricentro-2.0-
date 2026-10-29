import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder, WorkOrderStatus, WorkOrderType } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatPlate,
  formatBranchName,
} from '../../utils/formatters';
import { StatusBadge, TypeBadge, BranchBadge } from '../common/Badge';
import {
  Search,
  Filter,
  Plus,
  Fuel,
  Wrench,
  Clock,
  Eye,
  CheckCircle,
  ArrowUpDown,
  Car,
  CalendarClock,
  QrCode,
} from 'lucide-react';

interface WorkOrdersListProps {
  workOrders: WorkOrder[];
  onOpenOrder: (order: WorkOrder) => void;
  onNewOrder: (type: WorkOrderType) => void;
  onScheduleAppointment?: (order: WorkOrder) => void;
  onOpenSticker?: (order: WorkOrder) => void;
}

export const WorkOrdersList: React.FC<WorkOrdersListProps> = ({
  workOrders,
  onOpenOrder,
  onNewOrder,
  onScheduleAppointment,
  onOpenSticker,
}) => {
  const { currentBranch, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');

  const filteredOrders = useMemo(() => {
    return workOrders.filter((order) => {
      // Branch filter if not 'todas'
      if (currentBranch !== 'todas' && order.branchId !== currentBranch) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'todos' && order.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'todos' && order.type !== typeFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const plate = (order.licensePlate || '').toLowerCase();
        const client = (order.clientName || '').toLowerCase();
        const number = (order.orderNumber || '').toLowerCase();
        const vehicle = `${order.vehicleBrand} ${order.vehicleModel}`.toLowerCase();
        return (
          plate.includes(query) ||
          client.includes(query) ||
          number.includes(query) ||
          vehicle.includes(query)
        );
      }

      return true;
    });
  }, [workOrders, currentBranch, statusFilter, typeFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Top Header & Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Órdenes de Trabajo (OT)
          </h1>
          <p className="text-xs text-slate-400">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'} encontradas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNewOrder('aceite_filtro')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/50 cursor-pointer"
          >
            <Fuel className="w-4 h-4" />
            <span>+ OT Aceite/Filtro</span>
          </button>
          <button
            onClick={() => onNewOrder('mecanica_integral')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-indigo-400" />
            <span>+ OT Mecánica</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por patente, cliente, vehículo o # OT..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
            />
          </div>

          {/* Status Quick Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('pendiente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'pendiente'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('en_proceso')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'en_proceso'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              En proceso
            </button>
            <button
              onClick={() => setStatusFilter('a_entregar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'a_entregar'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              A entregar
            </button>
            <button
              onClick={() => setStatusFilter('entregada')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'entregada'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Entregadas
            </button>
          </div>
        </div>

        {/* Secondary filters (Type) */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-500 font-medium">Filtrar Tipo:</span>
          <button
            onClick={() => setTypeFilter('todos')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              typeFilter === 'todos'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTypeFilter('aceite_filtro')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              typeFilter === 'aceite_filtro'
                ? 'bg-red-950 text-red-300 border border-red-800/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Aceite & Filtros
          </button>
          <button
            onClick={() => setTypeFilter('mecanica_integral')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              typeFilter === 'mecanica_integral'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mecánica Integral
          </button>
        </div>
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Car className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No se encontraron órdenes de trabajo
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Intenta cambiar los filtros o registra una nueva orden.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">OT #</th>
                  <th className="py-3.5 px-4">Vehículo / Patente</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Sucursal</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => onOpenOrder(order)}
                    className="hover:bg-slate-850/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                      #{order.orderNumber}
                      <span className="block text-[10px] text-slate-500 font-sans">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {formatPlate(order.licensePlate)}
                        </span>
                        <div>
                          <span className="font-bold text-white group-hover:text-red-400 transition-colors">
                            {order.vehicleBrand} {order.vehicleModel}
                          </span>
                          {order.currentKm ? (
                            <span className="block text-[10px] text-slate-400">
                              {order.currentKm.toLocaleString()} KM
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white block">
                        {order.clientName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {order.clientPhone || order.clientWhatsapp || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <TypeBadge type={order.type} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <BranchBadge branchId={order.branchId} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onScheduleAppointment && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleAppointment(order);
                            }}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 transition-colors"
                            title="Agendar en Calendario de Turnos"
                          >
                            <CalendarClock className="w-4 h-4" />
                          </button>
                        )}
                        {onOpenSticker && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSticker(order);
                            }}
                            className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 transition-colors"
                            title="Generar Sticker QR para parabrisas"
                          >
                            <QrCode className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenOrder(order);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden divide-y divide-slate-800">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => onOpenOrder(order)}
                className="p-4 hover:bg-slate-850/50 transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {formatPlate(order.licensePlate)}
                    </span>
                    <span className="font-bold text-sm text-white">
                      {order.vehicleBrand} {order.vehicleModel}
                    </span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{order.clientName}</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <TypeBadge type={order.type} />
                    <span>#{order.orderNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenSticker && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSticker(order);
                        }}
                        className="px-2 py-0.5 rounded bg-red-600/20 text-red-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Sticker QR"
                      >
                        <QrCode className="w-3 h-3 text-red-400" />
                        <span>Sticker</span>
                      </button>
                    )}
                    {onScheduleAppointment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleAppointment(order);
                        }}
                        className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Agendar turno"
                      >
                        <CalendarClock className="w-3 h-3" />
                        <span>Agendar</span>
                      </button>
                    )}
                    <BranchBadge branchId={order.branchId} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
