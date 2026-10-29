import React, { useState } from 'react';
import { WorkOrder, ServiceBay, BranchId } from '../../types';
import { formatBranchName } from '../../utils/formatters';
import {
  Wrench,
  Fuel,
  Clock,
  CheckCircle,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  Car,
  User,
} from 'lucide-react';

interface LiveBaysOverviewProps {
  workOrders: WorkOrder[];
  currentBranch: BranchId;
  onOpenOrder: (order: WorkOrder) => void;
  onNewOrderForBay?: (bayName: string) => void;
}

// Initial default bay configuration
const DEFAULT_BAYS: ServiceBay[] = [
  {
    id: 'bay-fosa-1',
    name: 'FOSA 1',
    branchId: 'escobar',
    type: 'fosa',
    status: 'en_servicio',
    mechanicName: 'Juan P.',
    taskDescription: 'Service 10.000km + Filtros',
    progressPercent: 65,
    estimatedMinutesLeft: 20,
  },
  {
    id: 'bay-fosa-2',
    name: 'FOSA 2',
    branchId: 'escobar',
    type: 'fosa',
    status: 'drenando',
    mechanicName: 'Lucas R.',
    taskDescription: 'Aceite Sintético 5W-30 + Filtro',
    progressPercent: 40,
    estimatedMinutesLeft: 12,
  },
  {
    id: 'bay-elevador-1',
    name: 'ELEVADOR 1',
    branchId: 'escobar',
    type: 'elevador',
    status: 'en_proceso',
    mechanicName: 'Martín S.',
    taskDescription: 'Pastillas freno + Tren delantero',
    progressPercent: 75,
    estimatedMinutesLeft: 30,
  },
  {
    id: 'bay-elevador-2',
    name: 'ELEVADOR 2',
    branchId: 'escobar',
    type: 'elevador',
    status: 'libre',
  },
  {
    id: 'bay-fluidos',
    name: 'ZONA FLUIDOS',
    branchId: 'escobar',
    type: 'zona_fluidos',
    status: 'en_servicio',
    mechanicName: 'Darío M.',
    taskDescription: 'Refrigerante + Purga circuito',
    progressPercent: 85,
    estimatedMinutesLeft: 8,
  },
];

export const LiveBaysOverview: React.FC<LiveBaysOverviewProps> = ({
  workOrders,
  currentBranch,
  onOpenOrder,
  onNewOrderForBay,
}) => {
  const [bays, setBays] = useState<ServiceBay[]>(DEFAULT_BAYS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active orders in progress
  const activeOrders = workOrders.filter(
    (o) => o.status === 'en_proceso' || o.status === 'pendiente'
  );

  // Match bays with real active orders if available
  const mappedBays = bays.map((bay, idx) => {
    // If order is explicitly assigned or pick an active order
    const matchedOrder =
      workOrders.find((o) => o.assignedBay === bay.name && o.status === 'en_proceso') ||
      (bay.status !== 'libre' && activeOrders[idx % activeOrders.length]
        ? activeOrders[idx % activeOrders.length]
        : null);

    if (matchedOrder && bay.status !== 'libre') {
      return {
        ...bay,
        orderId: matchedOrder.id,
        orderNumber: matchedOrder.orderNumber,
        licensePlate: matchedOrder.licensePlate,
        vehicleModel: `${matchedOrder.vehicleBrand} ${matchedOrder.vehicleModel}`,
        mechanicName: bay.mechanicName || matchedOrder.assignedMechanic || 'Técnico Especialista',
        taskDescription: matchedOrder.items?.[0]?.description || matchedOrder.oilBrand || bay.taskDescription,
      };
    }
    return bay;
  });

  const occupiedCount = mappedBays.filter((b) => b.status !== 'libre').length;
  const freeCount = mappedBays.length - occupiedCount;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Puestos de Servicio & Bahías en Vivo
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-800 border border-slate-700 text-slate-300">
                {occupiedCount} Ocupados / {freeCount} Disponible{freeCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoreo operativo de fosas, elevadores y mecánicos asignados en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            title="Refrescar estado de las bahías"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar (Auto 15s)</span>
          </button>
        </div>
      </div>

      {/* Grid of 5 Bays (Horizontal scroll on mobile, 5 cols on lg desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {mappedBays.map((bay) => {
          const isFree = bay.status === 'libre';
          const matchedOrder = bay.orderId ? workOrders.find((o) => o.id === bay.orderId) : null;

          return (
            <div
              key={bay.id}
              onClick={() => {
                if (matchedOrder) onOpenOrder(matchedOrder);
                else if (isFree && onNewOrderForBay) onNewOrderForBay(bay.name);
              }}
              className={`rounded-2xl p-4 flex flex-col justify-between border transition-all cursor-pointer group relative overflow-hidden ${
                isFree
                  ? 'bg-slate-950/40 border-slate-800/70 hover:border-emerald-500/50 hover:bg-slate-900/60'
                  : 'bg-slate-950/90 border-slate-800 hover:border-amber-500/60 shadow-lg'
              }`}
            >
              {/* Bay top tag & status badge */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    {bay.name}
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${
                      isFree
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : bay.status === 'drenando'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : bay.status === 'en_proceso'
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {isFree ? 'Disponible' : bay.status.replace('_', ' ')}
                  </span>
                </div>

                {isFree ? (
                  /* Free State */
                  <div className="py-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-slate-500 mx-auto flex items-center justify-center mb-2 group-hover:scale-110 group-hover:text-emerald-400 transition-all">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-300">Bahía Libre</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Lista para asignación</p>

                    <div className="mt-4 px-3 py-1.5 rounded-xl bg-slate-900 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white text-[11px] font-bold border border-slate-800 group-hover:border-emerald-500 transition-all">
                      Asignar en Espera
                    </div>
                  </div>
                ) : (
                  /* Active Vehicle in Bay */
                  <div className="space-y-2.5">
                    {/* License Plate Banner (Chapa Argentina) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="px-2.5 py-1 rounded-md bg-white border border-slate-300 shadow-xs flex items-center gap-1.5 select-none">
                        <span className="w-2.5 h-1.5 bg-blue-600 rounded-2xs inline-block" />
                        <span className="font-mono font-black text-slate-950 text-xs tracking-wider">
                          {bay.licensePlate || 'AF 234 BC'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium text-right truncate">
                        <span className="text-slate-500">Mec:</span>{' '}
                        <span className="text-slate-200 font-semibold">{bay.mechanicName}</span>
                      </div>
                    </div>

                    {/* Vehicle Model & Task */}
                    <div>
                      <p className="text-xs font-bold text-white truncate">
                        {bay.vehicleModel || 'Toyota Hilux 2.8 D-4D'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {bay.taskDescription || 'Service 10.000km + Filtro'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress and Remaining Time (Bottom) */}
              {!isFree && (
                <div className="mt-4 pt-3 border-t border-slate-900/80">
                  <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                    <span className="text-slate-400">Progreso: {bay.progressPercent || 50}%</span>
                    <span className="text-amber-400 font-mono">
                      {bay.estimatedMinutesLeft || 15} min rest.
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${bay.progressPercent || 50}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
