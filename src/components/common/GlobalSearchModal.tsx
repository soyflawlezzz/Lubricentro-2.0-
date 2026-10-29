import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, Client, WorkOrder } from '../../types';
import { formatBranchName, formatCurrency, buildWhatsAppLink } from '../../utils/formatters';
import {
  Search,
  Car,
  User,
  Wrench,
  Clock,
  ArrowRight,
  MessageCircle,
  X,
  FileText,
  Calendar,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  clients: Client[];
  workOrders: WorkOrder[];
  onOpenOrder: (order: WorkOrder) => void;
  onNewOrderForVehicle?: (vehicle: Vehicle) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  clients,
  workOrders,
  onOpenOrder,
  onNewOrderForVehicle,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toUpperCase();

  // Filter vehicles matching plate or model
  const matchedVehicles = cleanQuery
    ? vehicles.filter(
        (v) =>
          v.licensePlate.replace(/\s+/g, '').includes(cleanQuery.replace(/\s+/g, '')) ||
          `${v.brand} ${v.model}`.toUpperCase().includes(cleanQuery) ||
          v.clientName.toUpperCase().includes(cleanQuery)
      ).slice(0, 5)
    : [];

  // Filter active work orders
  const matchedOrders = cleanQuery
    ? workOrders.filter(
        (o) =>
          o.orderNumber.toUpperCase().includes(cleanQuery) ||
          o.licensePlate.replace(/\s+/g, '').includes(cleanQuery.replace(/\s+/g, '')) ||
          o.clientName.toUpperCase().includes(cleanQuery)
      ).slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por Patente (ej: AF 234, OPM 789), Cliente u Orden #..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!cleanQuery ? (
            <div className="py-8 text-center text-slate-500">
              <Car className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
              <p className="text-xs font-semibold">
                Ingresá una patente para consultar su historial de servicios o cliente
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Atajo rápido: presioná <span className="text-amber-400 font-mono">Ctrl + K</span> en cualquier pantalla
              </p>
            </div>
          ) : (
            <>
              {/* Matched Orders */}
              {matchedOrders.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Órdenes de Trabajo Coincidentes ({matchedOrders.length})
                  </div>
                  <div className="space-y-2">
                    {matchedOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => {
                          onOpenOrder(order);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-400 shrink-0">
                            #{order.orderNumber}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                              {order.vehicleBrand} {order.vehicleModel} &bull; Patente: {order.licensePlate}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              Cliente: {order.clientName} &bull; Sucursal {formatBranchName(order.branchId)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-200">
                            {formatCurrency(order.total)}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              order.status === 'entregada'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : order.status === 'en_proceso'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Vehicles */}
              {matchedVehicles.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                    Vehículos Registrados ({matchedVehicles.length})
                  </div>
                  <div className="space-y-2">
                    {matchedVehicles.map((veh) => {
                      const matchedClient = clients.find((c) => c.id === veh.clientId);
                      const waLink = buildWhatsAppLink(
                        matchedClient?.whatsapp || matchedClient?.phone || '',
                        `Hola ${veh.clientName}, te contactamos desde Lubricentro 2.0.`
                      );

                      return (
                        <div
                          key={veh.id}
                          className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {/* License plate badge */}
                            <div className="px-2.5 py-1 rounded bg-white border border-slate-300 flex items-center gap-1 shadow-xs shrink-0 select-none">
                              <span className="w-2.5 h-1.5 bg-blue-600 rounded-2xs inline-block" />
                              <span className="font-mono font-black text-slate-950 text-xs">
                                {veh.licensePlate}
                              </span>
                            </div>

                            <div>
                              <p className="font-bold text-white text-xs">
                                {veh.brand} {veh.model} ({veh.year})
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Cliente: {veh.clientName} &bull; Odómetro: {veh.currentKm.toLocaleString()} km
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 transition-all"
                                title="Enviar mensaje de WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            {onNewOrderForVehicle && (
                              <button
                                type="button"
                                onClick={() => {
                                  onNewOrderForVehicle(veh);
                                  onClose();
                                }}
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>Nueva OT</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No results */}
              {matchedOrders.length === 0 && matchedVehicles.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  <p className="text-xs">No se encontraron órdenes ni vehículos con &quot;{query}&quot;</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
