import React from 'react';
import { OilDrum, Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Fuel,
  AlertTriangle,
  ArrowRight,
  Truck,
  Package,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface OilDrumsMonitorProps {
  products: Product[];
  onNavigateToSuppliers?: () => void;
  onNavigateToInvoices?: () => void;
  canAccessSupplierModules?: boolean;
}

// Preset drums representing workshop bulk tanks (Tambores 208 Litros)
const SAMPLE_DRUMS: OilDrum[] = [
  {
    id: 'drum-1',
    name: 'Shell Helix Ultra 5W-40 ECT C3',
    viscosity: '5W-40 Sintético',
    capacityLiters: 200,
    currentLiters: 18, // 9% -> Critical
    branchId: 'escobar',
    location: 'Pañol Central Fosa 1',
    minLitersAlert: 35,
    pricePerLiter: 14200,
  },
  {
    id: 'drum-2',
    name: 'Castrol Magnatec 10W-40 Semisint.',
    viscosity: '10W-40',
    capacityLiters: 200,
    currentLiters: 85, // 42% -> OK
    branchId: 'escobar',
    location: 'Pañol Central Fosa 2',
    minLitersAlert: 30,
    pricePerLiter: 11500,
  },
  {
    id: 'drum-3',
    name: 'Elaion F50 5W-30 d1 Sintético',
    viscosity: '5W-30 Sintético',
    capacityLiters: 200,
    currentLiters: 154, // 77% -> OK
    branchId: 'escobar',
    location: 'Pañol Rápido Fosa 1',
    minLitersAlert: 30,
    pricePerLiter: 13500,
  },
];

export const OilDrumsMonitor: React.FC<OilDrumsMonitorProps> = ({
  products,
  onNavigateToSuppliers,
  onNavigateToInvoices,
  canAccessSupplierModules = false,
}) => {
  // Low stock products from catalog
  const criticalProducts = products.filter(
    (p) => p.status === 'activo' && p.stock <= (p.minStock || 3)
  ).slice(0, 3);

  const criticalDrums = SAMPLE_DRUMS.filter(
    (d) => d.currentLiters <= d.minLitersAlert
  );

  const totalCriticalCount = criticalDrums.length + (criticalProducts.length > 0 ? criticalProducts.length : 2);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Insumos Críticos & Tambores
              </h3>
              <p className="text-[11px] text-slate-400">Control de stock de lubricante a granel</p>
            </div>
          </div>

          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-red-500/15 border border-red-500/30 text-red-400">
            {totalCriticalCount} Críticos
          </span>
        </div>

        {/* Drums List */}
        <div className="space-y-3.5">
          {SAMPLE_DRUMS.map((drum) => {
            const percent = Math.round((drum.currentLiters / drum.capacityLiters) * 100);
            const isCritical = drum.currentLiters <= drum.minLitersAlert;

            return (
              <div
                key={drum.id}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="truncate">
                    <p className="font-bold text-slate-200 truncate">{drum.name}</p>
                    <p className="text-[10px] text-slate-500">{drum.location}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-extrabold text-sm text-white">
                      {drum.currentLiters} L
                    </span>
                    <span className="text-[10px] text-slate-400"> / {drum.capacityLiters}L</span>
                  </div>
                </div>

                {/* Progress Bar Gauge */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden my-2 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percent <= 15
                        ? 'bg-red-500'
                        : percent <= 35
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span
                    className={
                      percent <= 15
                        ? 'text-red-400'
                        : percent <= 35
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }
                  >
                    {percent <= 15 ? (
                      'Alerta Roja (Quiebre Inminente)'
                    ) : percent <= 35 ? (
                      `Alerta Amarilla (Queda ${percent}%)`
                    ) : (
                      `Nivel Óptimo (${percent}%)`
                    )}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {formatCurrency(drum.pricePerLiter)} / L
                  </span>
                </div>
              </div>
            );
          })}

          {/* Critical Filter Preview */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="truncate">
                <p className="font-bold text-slate-200 truncate">Filtro de Aceite Mann W712/52</p>
                <p className="text-[10px] text-slate-500">Estante B-04 &bull; Alta rotación VW / Fiat</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-extrabold text-sm text-red-400">2 unid.</span>
                <span className="text-[10px] text-slate-500"> (mín: 6)</span>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-red-400 mt-1">
              Alerta Roja (Reponer con Distribuidora Sur)
            </p>
          </div>
        </div>
      </div>

      {/* Action to Generate Supplier Order */}
      <div className="mt-5 pt-3.5 border-t border-slate-800">
        <button
          type="button"
          onClick={() => {
            if (canAccessSupplierModules && onNavigateToInvoices) {
              onNavigateToInvoices();
            } else if (onNavigateToSuppliers) {
              onNavigateToSuppliers();
            }
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          <span>Generar Pedido a Proveedor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          Próxima entrega pactada: Hoy 15:30 hs (Distribuidora Sur)
        </p>
      </div>
    </div>
  );
};
