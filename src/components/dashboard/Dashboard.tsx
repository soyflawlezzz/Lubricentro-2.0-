import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  WorkOrder,
  Sale,
  Expense,
  Reminder,
  BranchId,
  Invoice,
} from '../../types';
import { formatCurrency, formatDate, buildWhatsAppLink } from '../../utils/formatters';
import {
  Fuel,
  Wrench,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Calendar,
  AlertCircle,
  MessageCircle,
  ArrowRight,
  ClipboardList,
  BellRing,
  Car,
  Cog,
  ShieldCheck,
  Receipt,
  CalendarDays,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { TabId } from '../layout/Sidebar';

interface DashboardProps {
  workOrders: WorkOrder[];
  sales: Sale[];
  expenses: Expense[];
  reminders: Reminder[];
  invoices?: Invoice[];
  onNavigate: (tab: TabId) => void;
  onOpenNewWorkOrder: (type: 'aceite_filtro' | 'mecanica_integral') => void;
  onOpenNewSale: () => void;
  onOpenNewExpense: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  workOrders,
  sales,
  expenses,
  reminders,
  invoices = [],
  onNavigate,
  onOpenNewWorkOrder,
  onOpenNewSale,
  onOpenNewExpense,
}) => {
  const { currentBranch, isAdmin, canAccessSupplierModules, setCurrentBranch } = useAuth();

  // Filter items for today
  const todayStr = new Date().toISOString().split('T')[0];

  // Invoices alerts (Next 7 days & Overdue) - Exclusive to Lubricentro, Fede & Google Owner Account
  const { upcomingInvoices, overdueInvoices } = useMemo(() => {
    if (!canAccessSupplierModules || !invoices) return { upcomingInvoices: [], overdueInvoices: [] };

    const upcoming: { invoice: Invoice; daysLeft: number }[] = [];
    const overdue: { invoice: Invoice; daysOverdue: number }[] = [];

    const todayTime = new Date(todayStr + 'T00:00:00').getTime();

    invoices.forEach((inv) => {
      if (inv.status === 'pagada' || !inv.dueDate) return;
      const dueTime = new Date(inv.dueDate + 'T00:00:00').getTime();
      const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        overdue.push({ invoice: inv, daysOverdue: Math.abs(diffDays) });
      } else if (diffDays <= 7) {
        upcoming.push({ invoice: inv, daysLeft: diffDays });
      }
    });

    // Sort overdue by days overdue desc
    overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
    // Sort upcoming by days left asc
    upcoming.sort((a, b) => a.daysLeft - b.daysLeft);

    return { upcomingInvoices: upcoming, overdueInvoices: overdue };
  }, [invoices, isAdmin, todayStr]);

  const todayStats = useMemo(() => {
    // Today's Work Orders delivered/charged
    const todayOrders = workOrders.filter((o) =>
      (o.createdAt || '').startsWith(todayStr)
    );
    const todayOrdersTotal = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Today's Sales
    const todaySales = sales.filter((s) => (s.createdAt || '').startsWith(todayStr));
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);

    // Today's Expenses
    const todayExpenses = expenses.filter(
      (e) => (e.date || e.createdAt || '').startsWith(todayStr)
    );
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalIngresosHoy = todayOrdersTotal + todaySalesTotal;
    const saldoHoy = totalIngresosHoy - todayExpensesTotal;

    // Counts by status
    const pendientes = workOrders.filter((o) => o.status === 'pendiente').length;
    const enProceso = workOrders.filter((o) => o.status === 'en_proceso').length;
    const aEntregar = workOrders.filter((o) => o.status === 'a_entregar').length;
    const entregadas = workOrders.filter((o) => o.status === 'entregada').length;

    // Counts by type
    const aceiteCount = workOrders.filter((o) => o.type === 'aceite_filtro').length;
    const mecanicaCount = workOrders.filter((o) => o.type === 'mecanica_integral').length;

    return {
      todayOrdersCount: todayOrders.length,
      todayOrdersTotal,
      todaySalesCount: todaySales.length,
      todaySalesTotal,
      todayExpensesTotal,
      totalIngresosHoy,
      saldoHoy,
      pendientes,
      enProceso,
      aEntregar,
      entregadas,
      aceiteCount,
      mecanicaCount,
      salesCount: sales.length,
    };
  }, [workOrders, sales, expenses, todayStr]);

  // Urgent / pending reminders
  const pendingReminders = useMemo(() => {
    return reminders
      .filter((r) => r.status === 'pendiente')
      .slice(0, 5);
  }, [reminders]);

  // Recent active orders
  const activeOrders = useMemo(() => {
    return workOrders
      .filter((o) => o.status !== 'entregada')
      .slice(0, 6);
  }, [workOrders]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                Operaciones en Vivo
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Panel de Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Gestión centralizada de taller, lubricación, mostrador y caja.
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            <button
              onClick={() => onOpenNewWorkOrder('aceite_filtro')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/50 cursor-pointer"
            >
              <Fuel className="w-4 h-4" />
              <span>+ OT Aceite/Filtro</span>
            </button>
            <button
              onClick={() => onOpenNewWorkOrder('mecanica_integral')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-indigo-400" />
              <span>+ OT Mecánica</span>
            </button>
            <button
              onClick={onOpenNewSale}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>+ Venta Mostrador</span>
            </button>
            <button
              onClick={onOpenNewExpense}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>+ Egreso</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Day Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Ingresado Hoy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ingresos Hoy</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {formatCurrency(todayStats.totalIngresosHoy)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              OTs + Ventas del día
            </p>
          </div>
        </div>

        {/* Ventas Hoy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ventas Mostrador</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {formatCurrency(todayStats.todaySalesTotal)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {todayStats.todaySalesCount} operaciones
            </p>
          </div>
        </div>

        {/* OTs Cobradas Hoy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">OTs del Día</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {formatCurrency(todayStats.todayOrdersTotal)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {todayStats.todayOrdersCount} servicios registrados
            </p>
          </div>
        </div>

        {/* Egresos Hoy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Egresos Hoy</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {formatCurrency(todayStats.todayExpensesTotal)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gastos del día
            </p>
          </div>
        </div>

        {/* Saldo Caja */}
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Neto Hoy</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-lg sm:text-2xl font-black tracking-tight ${
                todayStats.saldoHoy >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(todayStats.saldoHoy)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ingresos - Egresos
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN ALERTAS DE VENCIMIENTOS PRÓXIMOS (LUBRICENTRO, FEDE & CUENTA GOOGLE PROPIETARIA) */}
      {canAccessSupplierModules && (overdueInvoices.length > 0 || upcomingInvoices.length > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>VENCIMIENTOS PRÓXIMOS DE FACTURAS</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Control preventivo de facturas de proveedores a vencer en los próximos 7 días y vencidas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('invoices')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Ver Facturas</span>
              </button>
              <button
                onClick={() => onNavigate('calendar')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Calendario</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Facturas Vencidas (Alerta Roja) */}
            {overdueInvoices.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                    <span>🔴 FACTURAS VENCIDAS ({overdueInvoices.length})</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-red-300">
                    {formatCurrency(overdueInvoices.reduce((s, o) => s + (o.invoice.amount || 0), 0))}
                  </span>
                </div>

                <div className="space-y-2">
                  {overdueInvoices.slice(0, 3).map(({ invoice: inv, daysOverdue }) => (
                    <div
                      key={inv.id}
                      onClick={() => onNavigate('invoices')}
                      className="p-3 rounded-xl bg-slate-900/90 border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{inv.supplierName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            #{inv.invoiceNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-red-400 mt-0.5">
                          Venció: <strong>{formatDate(inv.dueDate)}</strong> (hace {daysOverdue} días)
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-xs text-white block">
                          {formatCurrency(inv.amount)}
                        </span>
                        <span className="text-[10px] font-bold text-red-400 uppercase">
                          Vencida
                        </span>
                      </div>
                    </div>
                  ))}
                  {overdueInvoices.length > 3 && (
                    <button
                      onClick={() => onNavigate('invoices')}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 w-full text-center py-1 cursor-pointer"
                    >
                      Ver {overdueInvoices.length - 3} factura(s) vencida(s) más →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Facturas Próximas a Vencer (Alerta Amarilla en 7 días) */}
            {upcomingInvoices.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span>🟡 PRÓXIMAS A VENCER (7 DÍAS) ({upcomingInvoices.length})</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {formatCurrency(upcomingInvoices.reduce((s, u) => s + (u.invoice.amount || 0), 0))}
                  </span>
                </div>

                <div className="space-y-2">
                  {upcomingInvoices.slice(0, 3).map(({ invoice: inv, daysLeft }) => (
                    <div
                      key={inv.id}
                      onClick={() => onNavigate('invoices')}
                      className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{inv.supplierName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            #{inv.invoiceNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-400 mt-0.5">
                          Vence: <strong>{formatDate(inv.dueDate)}</strong> ({daysLeft === 0 ? '¡Vence Hoy!' : `en ${daysLeft} días`})
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-xs text-white block">
                          {formatCurrency(inv.amount)}
                        </span>
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          Próxima
                        </span>
                      </div>
                    </div>
                  ))}
                  {upcomingInvoices.length > 3 && (
                    <button
                      onClick={() => onNavigate('invoices')}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 w-full text-center py-1 cursor-pointer"
                    >
                      Ver {upcomingInvoices.length - 3} factura(s) más →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Status Matrix & Type Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onNavigate('workOrders')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-lg font-black">{todayStats.pendientes}</span>
          </div>
          <span className="text-xs font-bold text-slate-300">Pendientes</span>
        </div>

        <div
          onClick={() => onNavigate('workOrders')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all hover:border-blue-500/40"
        >
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <Cog className="w-4 h-4" />
            <span className="text-lg font-black">{todayStats.enProceso}</span>
          </div>
          <span className="text-xs font-bold text-slate-300">En proceso</span>
        </div>

        <div
          onClick={() => onNavigate('workOrders')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all hover:border-purple-500/40"
        >
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <Wrench className="w-4 h-4" />
            <span className="text-lg font-black">{todayStats.aEntregar}</span>
          </div>
          <span className="text-xs font-bold text-slate-300">A entregar</span>
        </div>

        <div
          onClick={() => onNavigate('workOrders')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-lg font-black">{todayStats.entregadas}</span>
          </div>
          <span className="text-xs font-bold text-slate-300">Entregadas</span>
        </div>

        <div
          onClick={() => onNavigate('workOrders')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all hover:border-red-500/40"
        >
          <div className="flex items-center justify-between text-red-400 mb-1">
            <Fuel className="w-4 h-4" />
            <span className="text-lg font-black">{todayStats.aceiteCount}</span>
          </div>
          <span className="text-xs font-bold text-slate-300">Aceite & Filtro</span>
        </div>

        <div
          onClick={() => onNavigate('workOrders')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all hover:border-indigo-500/40"
        >
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <Wrench className="w-4 h-4" />
            <span className="text-lg font-black">{todayStats.mecanicaCount}</span>
          </div>
          <span className="text-xs font-bold text-slate-300">Mecánica General</span>
        </div>
      </div>

      {/* Main Grid: Active Orders & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Work Orders (2/3) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Órdenes en Taller</h2>
                  <p className="text-xs text-slate-400">Trabajos activos pendientes o en proceso</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('workOrders')}
                className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle className="w-10 h-10 mx-auto text-emerald-500/40 mb-2" />
                <p className="text-sm font-semibold text-slate-400">No hay órdenes activas en este momento</p>
                <p className="text-xs text-slate-500">Todos los vehículos han sido entregados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => onNavigate('workOrders')}
                    className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-white tracking-widest font-mono">
                          {order.licensePlate.substring(0, 3)}
                        </span>
                        <span className="text-[9px] font-bold text-red-400 font-mono">
                          {order.licensePlate.substring(3)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                            {order.vehicleBrand} {order.vehicleModel}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            #{order.orderNumber}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{order.clientName}</span>
                          <span>&bull;</span>
                          <span className="capitalize text-slate-500">
                            {order.type === 'aceite_filtro' ? 'Aceite & Filtro' : 'Mecánica'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/50">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          order.status === 'pendiente'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : order.status === 'en_proceso'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {order.status === 'pendiente'
                          ? 'Pendiente'
                          : order.status === 'en_proceso'
                          ? 'En proceso'
                          : 'A entregar'}
                      </span>
                      <span className="text-sm font-black text-white">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recordatorios de Services (1/3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Próximos Services</h2>
                  <p className="text-xs text-slate-400">Recordatorios para contactar</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('reminders')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingReminders.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">
                  No hay recordatorios pendientes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReminders.map((rem) => {
                  const defaultMsg = `Hola ${rem.clientName}, te recordamos desde Lubricentro 2.0 que corresponde realizar el service de tu ${rem.vehicleInfo} patente ${rem.licensePlate}. Podés contactarnos para coordinar tu turno.`;
                  const waLink = buildWhatsAppLink(rem.clientWhatsapp, rem.message || defaultMsg);

                  return (
                    <div
                      key={rem.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">
                            {rem.clientName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {rem.vehicleInfo} &bull;{' '}
                            <span className="font-mono text-red-400 font-bold">{rem.licensePlate}</span>
                          </div>
                        </div>
                        {rem.estimatedDate && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            {formatDate(rem.estimatedDate)}
                          </span>
                        )}
                      </div>

                      {rem.clientWhatsapp && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full mt-1 py-1.5 px-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar WhatsApp</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
