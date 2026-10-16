import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Budget } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatPlate,
  formatBranchName,
} from '../../utils/formatters';
import { BranchBadge } from '../common/Badge';
import {
  Search,
  FileSpreadsheet,
  Plus,
  ArrowRightCircle,
  Eye,
  CheckCircle,
  MessageCircle,
  Download,
} from 'lucide-react';
import { downloadBudgetPdf, sendBudgetWhatsApp } from '../../utils/pdfGenerator';

interface BudgetsListProps {
  budgets: Budget[];
  onNewBudget: () => void;
  onViewBudget: (budget: Budget) => void;
  onConvertToWorkOrder: (budget: Budget) => void;
}

export const BudgetsList: React.FC<BudgetsListProps> = ({
  budgets,
  onNewBudget,
  onViewBudget,
  onConvertToWorkOrder,
}) => {
  const { currentBranch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDirectDownload = (e: React.MouseEvent, budget: Budget) => {
    e.stopPropagation();
    downloadBudgetPdf(budget);
  };

  const handleDirectWhatsApp = async (e: React.MouseEvent, budget: Budget) => {
    e.stopPropagation();
    await sendBudgetWhatsApp(budget);
  };

  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      if (currentBranch !== 'todas' && b.branchId !== currentBranch) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const num = (b.budgetNumber || '').toLowerCase();
        const client = (b.clientName || '').toLowerCase();
        const plate = (b.licensePlate || '').toLowerCase();
        return num.includes(query) || client.includes(query) || plate.includes(query);
      }
      return true;
    });
  }, [budgets, currentBranch, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Presupuestos
          </h1>
          <p className="text-xs text-slate-400">
            {filteredBudgets.length} cotizaciones registradas
          </p>
        </div>

        <button
          onClick={onNewBudget}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>+ Nuevo Presupuesto</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por # de presupuesto, cliente o patente..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
          />
        </div>
      </div>

      {/* Budgets List / Table */}
      {filteredBudgets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No hay presupuestos creados
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Crea tu primer presupuesto para un cliente o vehículo.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Presupuesto #</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Vehículo / Patente</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Sucursal</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBudgets.map((budget) => (
                  <tr
                    key={budget.id}
                    onClick={() => onViewBudget(budget)}
                    className="hover:bg-slate-850/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-white group-hover:text-red-400">
                      #{budget.budgetNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {formatDate(budget.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 mr-2">
                        {formatPlate(budget.licensePlate)}
                      </span>
                      <span className="font-semibold text-white">
                        {budget.vehicleBrand} {budget.vehicleModel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {budget.clientName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          budget.status === 'convertido_ot'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {budget.status === 'convertido_ot' ? '✓ Convertido en OT' : '● Pendiente'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <BranchBadge branchId={budget.branchId} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(budget.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleDirectWhatsApp(e, budget)}
                          className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Descargar PDF y abrir chat de WhatsApp con el cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={(e) => handleDirectDownload(e, budget)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Descargar archivo PDF independiente al dispositivo"
                        >
                          <Download className="w-3.5 h-3.5 text-red-400" />
                        </button>
                        {budget.status !== 'convertido_ot' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onConvertToWorkOrder(budget);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Convertir a Orden de Trabajo"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                            <span>A OT</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewBudget(budget);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                          title="Ver detalle completo e imprimir"
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

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-800">
            {filteredBudgets.map((budget) => (
              <div
                key={budget.id}
                onClick={() => onViewBudget(budget)}
                className="p-4 hover:bg-slate-850/50 transition-colors cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 mr-2">
                      {formatPlate(budget.licensePlate)}
                    </span>
                    <span className="font-bold text-sm text-white">
                      {budget.vehicleBrand} {budget.vehicleModel}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {formatCurrency(budget.total)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{budget.clientName}</span>
                  <span>#{budget.budgetNumber}</span>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>{formatDate(budget.createdAt)}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDirectWhatsApp(e, budget)}
                      className="px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="Enviar PDF por WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={(e) => handleDirectDownload(e, budget)}
                      className="p-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[10px] flex items-center cursor-pointer"
                      title="Descargar PDF"
                    >
                      <Download className="w-3 h-3 text-red-400" />
                    </button>
                    {budget.status !== 'convertido_ot' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConvertToWorkOrder(budget);
                        }}
                        className="px-2 py-1 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowRightCircle className="w-3 h-3" />
                        <span>A OT</span>
                      </button>
                    )}
                    <BranchBadge branchId={budget.branchId} />
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
