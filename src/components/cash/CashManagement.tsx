import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder, Sale, Expense, CompanySettings } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatBranchName,
} from '../../utils/formatters';
import { BranchBadge } from '../common/Badge';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Printer,
  Calendar,
  CreditCard,
  Building,
  Smartphone,
  Coins,
} from 'lucide-react';
import { NewExpenseModal } from './NewExpenseModal';

interface CashManagementProps {
  workOrders: WorkOrder[];
  sales: Sale[];
  expenses: Expense[];
  onSaveExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<string>;
  settings?: CompanySettings;
}

export const CashManagement: React.FC<CashManagementProps> = ({
  workOrders,
  sales,
  expenses,
  onSaveExpense,
  settings,
}) => {
  const { currentBranch, isAdmin } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('hoy');
  const [activeTab, setActiveTab] = useState<'todos' | 'ingresos' | 'egresos'>('todos');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Period filter date calculation
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekStr = oneWeekAgo.toISOString().split('T')[0];

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = dateStr.substring(0, 10);
    if (periodFilter === 'hoy') return date === todayStr;
    if (periodFilter === 'semana') return date >= weekStr;
    if (periodFilter === 'mes') return date >= firstDayOfMonth;
    return true;
  };

  // Filtered Income from Work Orders
  const filteredOrders = useMemo(() => {
    return workOrders.filter((o) => {
      if (currentBranch !== 'todas' && o.branchId !== currentBranch) return false;
      return isDateInRange(o.createdAt);
    });
  }, [workOrders, currentBranch, periodFilter]);

  // Filtered Income from Counter Sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (currentBranch !== 'todas' && s.branchId !== currentBranch) return false;
      return isDateInRange(s.createdAt);
    });
  }, [sales, currentBranch, periodFilter]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (currentBranch !== 'todas' && e.branchId !== currentBranch) return false;
      return isDateInRange(e.date || e.createdAt);
    });
  }, [expenses, currentBranch, periodFilter]);

  // Totals calculations
  const totalOrders = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalSales = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalIngresos = totalOrders + totalSales;
  const totalEgresos = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const saldoNeto = totalIngresos - totalEgresos;

  // Breakdown by payment methods for income
  const paymentBreakdown = useMemo(() => {
    const acc: Record<string, number> = {
      Efectivo: 0,
      'Transferencia Bancaria': 0,
      Débito: 0,
      Crédito: 0,
      'Mercado Pago': 0,
      Otro: 0,
    };

    filteredOrders.forEach((o) => {
      const pm = o.paymentMethod || 'Efectivo';
      acc[pm] = (acc[pm] || 0) + (o.total || 0);
    });

    filteredSales.forEach((s) => {
      const pm = s.paymentMethod || 'Efectivo';
      acc[pm] = (acc[pm] || 0) + (s.total || 0);
    });

    return acc;
  }, [filteredOrders, filteredSales]);

  // Combined movements list for chronological display
  interface MovementItem {
    id: string;
    type: 'ingreso_ot' | 'ingreso_venta' | 'egreso';
    title: string;
    subtitle: string;
    amount: number;
    paymentMethod: string;
    branchId: string;
    date: string;
  }

  const movements: MovementItem[] = useMemo(() => {
    const list: MovementItem[] = [];

    if (activeTab === 'todos' || activeTab === 'ingresos') {
      filteredOrders.forEach((o) => {
        list.push({
          id: o.id,
          type: 'ingreso_ot',
          title: `OT #${o.orderNumber} - ${o.vehicleBrand} ${o.vehicleModel}`,
          subtitle: `Cliente: ${o.clientName} &bull; Patente: ${o.licensePlate}`,
          amount: o.total,
          paymentMethod: o.paymentMethod,
          branchId: o.branchId,
          date: o.createdAt,
        });
      });

      filteredSales.forEach((s) => {
        list.push({
          id: s.id,
          type: 'ingreso_venta',
          title: `Venta Mostrador #${s.saleNumber}`,
          subtitle: `${s.items.length} artículos &bull; ${s.clientName || 'Consumidor Final'}`,
          amount: s.total,
          paymentMethod: s.paymentMethod,
          branchId: s.branchId,
          date: s.createdAt,
        });
      });
    }

    if (activeTab === 'todos' || activeTab === 'egresos') {
      filteredExpenses.forEach((e) => {
        list.push({
          id: e.id,
          type: 'egreso',
          title: `Egreso: ${e.concept}`,
          subtitle: `Proveedor: ${e.supplier || '-'} &bull; ${e.user || ''}`,
          amount: e.amount,
          paymentMethod: e.paymentMethod,
          branchId: e.branchId,
          date: e.date || e.createdAt,
        });
      });
    }

    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list;
  }, [filteredOrders, filteredSales, filteredExpenses, activeTab]);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Period Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Control de Caja & Egresos
          </h1>
          <p className="text-xs text-slate-400">
            Arqueo financiero en tiempo real, ingresos por OTs/ventas y gastos operativos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Egreso</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cierre</span>
          </button>
        </div>
      </div>

      {/* Period Filter Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs">
          <Calendar className="w-4 h-4 text-slate-500 mr-1.5 ml-1" />
          <button
            onClick={() => setPeriodFilter('hoy')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              periodFilter === 'hoy'
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriodFilter('semana')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              periodFilter === 'semana'
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setPeriodFilter('mes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              periodFilter === 'mes'
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setPeriodFilter('todos')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              periodFilter === 'todos'
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Histórico Completo
          </button>
        </div>

        <div className="text-xs text-slate-400 pr-2 font-medium">
          Sucursal: <strong className="text-white">{formatBranchName(currentBranch)}</strong>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Ingresos */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Ingresos
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1 block">
              {formatCurrency(totalIngresos)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              OTs ({formatCurrency(totalOrders)}) + Ventas ({formatCurrency(totalSales)})
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Egresos */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Egresos
            </span>
            <span className="text-2xl sm:text-3xl font-black text-red-400 font-mono mt-1 block">
              {formatCurrency(totalEgresos)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {filteredExpenses.length} comprobantes de gasto
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Saldo de Caja */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-750 rounded-3xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Saldo Neto
            </span>
            <span
              className={`text-2xl sm:text-3xl font-black font-mono mt-1 block ${
                saldoNeto >= 0 ? 'text-white' : 'text-red-400'
              }`}
            >
              {formatCurrency(saldoNeto)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Cierre disponible en el período
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Ingresos por Medio de Pago
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Efectivo</span>
            </div>
            <div className="font-mono font-bold text-sm text-white">
              {formatCurrency(paymentBreakdown['Efectivo'])}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              <span>Transferencia</span>
            </div>
            <div className="font-mono font-bold text-sm text-white">
              {formatCurrency(paymentBreakdown['Transferencia Bancaria'])}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Débito</span>
            </div>
            <div className="font-mono font-bold text-sm text-white">
              {formatCurrency(paymentBreakdown['Débito'])}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Crédito</span>
            </div>
            <div className="font-mono font-bold text-sm text-white">
              {formatCurrency(paymentBreakdown['Crédito'])}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>Mercado Pago</span>
            </div>
            <div className="font-mono font-bold text-sm text-white">
              {formatCurrency(paymentBreakdown['Mercado Pago'])}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Otros</span>
            </div>
            <div className="font-mono font-bold text-sm text-white">
              {formatCurrency(paymentBreakdown['Otro'])}
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Subtabs */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'todos'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos los Movimientos ({movements.length})
            </button>
            <button
              onClick={() => setActiveTab('ingresos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'ingresos'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo Ingresos
            </button>
            <button
              onClick={() => setActiveTab('egresos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'egresos'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo Egresos
            </button>
          </div>
        </div>

        {movements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Wallet className="w-10 h-10 mx-auto text-slate-700 mb-2" />
            <p className="text-sm font-semibold text-slate-400">
              No hay movimientos en este período
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {movements.map((mov) => {
              const isIncome = mov.type !== 'egreso';
              return (
                <div
                  key={mov.id}
                  className="p-4 hover:bg-slate-850/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{mov.title}</div>
                      <div
                        className="text-xs text-slate-400 mt-0.5"
                        dangerouslySetInnerHTML={{ __html: mov.subtitle }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-0 border-slate-800/40">
                    <div className="text-left sm:text-right">
                      <span
                        className={`font-mono font-bold text-sm block ${
                          isIncome ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(mov.amount)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {mov.paymentMethod} &bull; {formatDateTime(mov.date)}
                      </span>
                    </div>
                    <BranchBadge branchId={mov.branchId} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Expense Modal */}
      <NewExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSaveExpense={onSaveExpense}
        settings={settings}
      />
    </div>
  );
};
