import React from 'react';
import { Vehicle, WorkOrder, Budget, Sale } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPlate,
  formatBranchName,
} from '../../utils/formatters';
import { StatusBadge, TypeBadge, BranchBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Car, Clock, Fuel, Wrench, CheckCircle, FileSpreadsheet, ShoppingCart } from 'lucide-react';

interface VehicleHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  licensePlate: string;
  vehicle?: Vehicle;
  workOrders: WorkOrder[];
  budgets: Budget[];
  sales: Sale[];
  onOpenWorkOrder?: (order: WorkOrder) => void;
}

export const VehicleHistoryModal: React.FC<VehicleHistoryModalProps> = ({
  isOpen,
  onClose,
  licensePlate,
  vehicle,
  workOrders,
  budgets,
  sales,
  onOpenWorkOrder,
}) => {
  if (!isOpen) return null;

  const normalizedPlate = licensePlate.trim().toUpperCase();

  // Find all work orders for this plate
  const vehicleOrders = workOrders.filter(
    (o) => (o.licensePlate || '').trim().toUpperCase() === normalizedPlate
  );

  // Find all budgets for this plate
  const vehicleBudgets = budgets.filter(
    (b) => (b.licensePlate || '').trim().toUpperCase() === normalizedPlate
  );

  const totalSpent = vehicleOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-red-500" />
          <span>Historial del Vehículo:</span>
          <span className="font-mono text-red-400 font-black bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
            {formatPlate(licensePlate)}
          </span>
        </div>
      }
      subtitle={
        vehicle
          ? `${vehicle.brand} ${vehicle.model} (${vehicle.year}) &bull; Cliente: ${vehicle.clientName}`
          : 'Historial completo de servicios, kilometrajes y reparaciones'
      }
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase block">
              Servicios / OTs Realizadas
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {vehicleOrders.length}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase block">
              Último Kilometraje Registrado
            </span>
            <span className="text-2xl font-black text-indigo-400 font-mono mt-1 block">
              {vehicle?.currentKm
                ? `${vehicle.currentKm.toLocaleString()} KM`
                : vehicleOrders[0]?.currentKm
                ? `${vehicleOrders[0].currentKm.toLocaleString()} KM`
                : '-'}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase block">
              Total Invertido en el Taller
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {formatCurrency(totalSpent)}
            </span>
          </div>
        </div>

        {/* Timeline of Work Orders */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Órdenes de Trabajo y Mantenimiento ({vehicleOrders.length})
          </h3>

          {vehicleOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800">
              <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">
                No hay órdenes de trabajo registradas para esta patente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicleOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onOpenWorkOrder && onOpenWorkOrder(order)}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">
                        #{order.orderNumber}
                      </span>
                      <span className="text-slate-500">&bull;</span>
                      <TypeBadge type={order.type} />
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-mono">
                        {formatDateTime(order.createdAt)}
                      </span>
                      <BranchBadge branchId={order.branchId} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500">Kilometraje:</span>{' '}
                      <strong className="font-mono text-white">
                        {order.currentKm ? `${order.currentKm.toLocaleString()} KM` : '-'}
                      </strong>
                    </div>
                    {order.nextServiceKm ? (
                      <div>
                        <span className="text-slate-500">Próximo service:</span>{' '}
                        <strong className="font-mono text-amber-400">
                          {order.nextServiceKm.toLocaleString()} KM{' '}
                          {order.nextServiceDate ? `(${formatDate(order.nextServiceDate)})` : ''}
                        </strong>
                      </div>
                    ) : null}
                  </div>

                  {/* Services and oil specs */}
                  <div className="text-xs space-y-1">
                    {order.servicesSelected && order.servicesSelected.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {order.servicesSelected.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {order.type === 'aceite_filtro' && (
                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-2 pt-1 font-mono">
                        {order.oilBrand && <span>Aceite: {order.oilBrand}</span>}
                        {order.oilFilterCode && <span>Filtro Aceite: {order.oilFilterCode}</span>}
                        {order.airFilterCode && <span>Filtro Aire: {order.airFilterCode}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400">
                      Medio de Pago: <strong className="text-white">{order.paymentMethod}</strong>
                    </span>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budgets for this vehicle */}
        {vehicleBudgets.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Presupuestos Relacionados ({vehicleBudgets.length})
            </h3>
            <div className="space-y-2">
              {vehicleBudgets.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-white">#{b.budgetNumber}</span>
                    <span className="text-slate-400 ml-2">{formatDate(b.createdAt)}</span>
                    <span className="text-slate-500 ml-2">
                      ({b.status === 'convertido_ot' ? 'Convertido en OT' : 'Borrador/Pendiente'})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCurrency(b.total)}
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
