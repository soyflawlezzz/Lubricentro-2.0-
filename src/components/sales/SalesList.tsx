import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sale } from '../../types';
import {
  formatCurrency,
  formatDateTime,
  formatBranchName,
} from '../../utils/formatters';
import { BranchBadge } from '../common/Badge';
import { Search, ShoppingCart, Plus, Printer, FileText } from 'lucide-react';

interface SalesListProps {
  sales: Sale[];
  onNewSale: () => void;
  onViewRemito: (sale: Sale) => void;
}

export const SalesList: React.FC<SalesListProps> = ({
  sales,
  onNewSale,
  onViewRemito,
}) => {
  const { currentBranch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (currentBranch !== 'todas' && sale.branchId !== currentBranch) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const num = (sale.saleNumber || '').toLowerCase();
        const client = (sale.clientName || '').toLowerCase();
        const itemsStr = sale.items
          .map((i) => `${i.name} ${i.code}`)
          .join(' ')
          .toLowerCase();
        return num.includes(query) || client.includes(query) || itemsStr.includes(query);
      }
      return true;
    });
  }, [sales, currentBranch, searchTerm]);

  const totalAccumulated = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Ventas de Mostrador & Remitos
          </h1>
          <p className="text-xs text-slate-400">
            {filteredSales.length} comprobantes &bull; Total acumulado:{' '}
            <strong className="text-emerald-400">{formatCurrency(totalAccumulated)}</strong>
          </p>
        </div>

        <button
          onClick={onNewSale}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer self-start sm:self-auto"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>+ Nueva Venta</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por # de Remito, cliente o producto..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
          />
        </div>
      </div>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <ShoppingCart className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No hay ventas registradas
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Realiza tu primera venta con el botón "+ Nueva Venta".
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Remito #</th>
                  <th className="py-3.5 px-4">Fecha / Hora</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Productos</th>
                  <th className="py-3.5 px-4">Medio Pago</th>
                  <th className="py-3.5 px-4">Sucursal</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => onViewRemito(sale)}
                    className="hover:bg-slate-850/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-white group-hover:text-red-400">
                      #{sale.saleNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {sale.clientName || 'Consumidor Final'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="font-medium">
                        {sale.items.length} {sale.items.length === 1 ? 'artículo' : 'artículos'}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                        {sale.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {sale.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4">
                      <BranchBadge branchId={sale.branchId} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewRemito(sale);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-400" />
                        <span>Ver Remito</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-800">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                onClick={() => onViewRemito(sale)}
                className="p-4 hover:bg-slate-850/50 transition-colors cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-white">
                      #{sale.saleNumber}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {sale.clientName || 'Consumidor Final'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {formatCurrency(sale.total)}
                  </span>
                </div>

                <div className="text-xs text-slate-400 truncate">
                  {sale.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{formatDateTime(sale.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <span>{sale.paymentMethod}</span>
                    <BranchBadge branchId={sale.branchId} />
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
