import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Vehicle, WorkOrder, Budget, Sale } from '../../types';
import { formatPlate, formatBranchName } from '../../utils/formatters';
import { BranchBadge } from '../common/Badge';
import { Search, Car, History, Wrench, Plus, QrCode } from 'lucide-react';
import { VehicleHistoryModal } from './VehicleHistoryModal';

interface VehiclesListProps {
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  budgets: Budget[];
  sales: Sale[];
  onOpenWorkOrder?: (order: WorkOrder) => void;
  onOpenSticker?: (vehicle: Vehicle) => void;
  onOpenPassport?: (plate: string) => void;
}

export const VehiclesList: React.FC<VehiclesListProps> = ({
  vehicles,
  workOrders,
  budgets,
  sales,
  onOpenWorkOrder,
  onOpenSticker,
  onOpenPassport,
}) => {
  const { currentBranch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const plate = (v.licensePlate || '').toLowerCase();
        const brand = (v.brand || '').toLowerCase();
        const model = (v.model || '').toLowerCase();
        const client = (v.clientName || '').toLowerCase();
        return (
          plate.includes(query) ||
          brand.includes(query) ||
          model.includes(query) ||
          client.includes(query)
        );
      }
      if (currentBranch !== 'todas' && v.branchId && v.branchId !== currentBranch) {
        return false;
      }
      return true;
    });
  }, [vehicles, currentBranch, searchTerm]);

  // Find vehicle object for the selected plate modal
  const activeVehicle = vehicles.find(
    (v) => (v.licensePlate || '').trim().toUpperCase() === selectedPlate
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Vehículos & Historial por Patente
          </h1>
          <p className="text-xs text-slate-400">
            {filteredVehicles.length} vehículos registrados con historial completo de servicios
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por patente (ej: AA123BB), modelo, marca o cliente..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
          />
        </div>
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Car className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No se encontraron vehículos
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Los vehículos se registran automáticamente al crear su primera orden de trabajo o cliente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const normalizedPlate = (vehicle.licensePlate || '').trim().toUpperCase();
            const orderCount = workOrders.filter(
              (o) => (o.licensePlate || '').trim().toUpperCase() === normalizedPlate
            ).length;

            return (
              <div
                key={vehicle.id}
                onClick={() => setSelectedPlate(normalizedPlate)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono font-black text-base text-red-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 shadow-inner tracking-wider">
                      {formatPlate(vehicle.licensePlate)}
                    </span>
                    <BranchBadge branchId={vehicle.branchId} />
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Año: <strong>{vehicle.year}</strong> &bull; Cliente:{' '}
                      <strong className="text-slate-300">{vehicle.clientName}</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Kilometraje actual</span>
                    <span className="font-mono font-bold text-white">
                      {vehicle.currentKm ? `${vehicle.currentKm.toLocaleString()} KM` : '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenSticker && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSticker(vehicle);
                        }}
                        className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 transition-colors"
                        title="Generar Sticker QR para parabrisas"
                      >
                        <QrCode className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 text-red-400 font-bold">
                      <History className="w-4 h-4" />
                      <span>{orderCount} OTs</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {selectedPlate && (
        <VehicleHistoryModal
          isOpen={!!selectedPlate}
          onClose={() => setSelectedPlate(null)}
          licensePlate={selectedPlate}
          vehicle={activeVehicle}
          workOrders={workOrders}
          budgets={budgets}
          sales={sales}
          onOpenWorkOrder={onOpenWorkOrder}
          onOpenSticker={(veh, latestOrder) => {
            if (onOpenSticker) {
              onOpenSticker(veh || activeVehicle || ({ licensePlate: selectedPlate } as any));
            }
          }}
          onOpenPassport={onOpenPassport}
        />
      )}
    </div>
  );
};
