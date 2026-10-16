import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder, Sale, Expense, Budget } from '../../types';
import { formatCurrency, formatBranchName } from '../../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Fuel,
  Wrench,
  Download,
  Calendar,
  Layers,
  MapPin,
  CreditCard,
  ShoppingCart,
} from 'lucide-react';

interface ReportsViewProps {
  workOrders: WorkOrder[];
  sales: Sale[];
  expenses: Expense[];
  budgets: Budget[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  workOrders,
  sales,
  expenses,
  budgets,
}) => {
  const { currentBranch, isAdmin } = useAuth();
  const [period, setPeriod] = useState<'mes' | 'ano' | 'todos'>('mes');
  const [branchFilter, setBranchFilter] = useState<'todas' | 'escobar' | 'maschwitz'>('todas');

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = `${now.getFullYear()}`;

  // Filter function
  const filterRecord = (dateStr?: string, bId?: string) => {
    if (!dateStr) return false;
    if (branchFilter !== 'todas' && bId !== branchFilter) return false;
    if (period === 'mes') return dateStr.startsWith(currentMonthStr);
    if (period === 'ano') return dateStr.startsWith(currentYearStr);
    return true;
  };

  const filteredOrders = useMemo(
    () => workOrders.filter((o) => filterRecord(o.createdAt, o.branchId)),
    [workOrders, period, branchFilter]
  );

  const filteredSales = useMemo(
    () => sales.filter((s) => filterRecord(s.createdAt, s.branchId)),
    [sales, period, branchFilter]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => filterRecord(e.date || e.createdAt, e.branchId)),
    [expenses, period, branchFilter]
  );

  // Financial aggregates
  const totalOrdersAmount = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalIngresos = totalOrdersAmount + totalSalesAmount;
  const totalEgresos = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const resultadoNeto = totalIngresos - totalEgresos;

  // Breakdown by branch
  const branchStats = useMemo(() => {
    const escOrders = filteredOrders.filter((o) => o.branchId === 'escobar');
    const escSales = filteredSales.filter((s) => s.branchId === 'escobar');
    const escExpenses = filteredExpenses.filter((e) => e.branchId === 'escobar');
    const escIncome =
      escOrders.reduce((s, o) => s + o.total, 0) + escSales.reduce((s, o) => s + o.total, 0);
    const escExp = escExpenses.reduce((s, e) => s + e.amount, 0);

    const masOrders = filteredOrders.filter((o) => o.branchId === 'maschwitz');
    const masSales = filteredSales.filter((s) => s.branchId === 'maschwitz');
    const masExpenses = filteredExpenses.filter((e) => e.branchId === 'maschwitz');
    const masIncome =
      masOrders.reduce((s, o) => s + o.total, 0) + masSales.reduce((s, o) => s + o.total, 0);
    const masExp = masExpenses.reduce((s, e) => s + e.amount, 0);

    return {
      escobar: {
        ordersCount: escOrders.length,
        salesCount: escSales.length,
        income: escIncome,
        expenses: escExp,
        net: escIncome - escExp,
      },
      maschwitz: {
        ordersCount: masOrders.length,
        salesCount: masSales.length,
        income: masIncome,
        expenses: masExp,
        net: masIncome - masExp,
      },
    };
  }, [filteredOrders, filteredSales, filteredExpenses]);

  // Breakdown by work order type
  const typeStats = useMemo(() => {
    const oilOrders = filteredOrders.filter((o) => o.type === 'aceite_filtro');
    const mecOrders = filteredOrders.filter((o) => o.type === 'mecanica_integral');
    return {
      oilCount: oilOrders.length,
      oilTotal: oilOrders.reduce((sum, o) => sum + o.total, 0),
      mecCount: mecOrders.length,
      mecTotal: mecOrders.reduce((sum, o) => sum + o.total, 0),
    };
  }, [filteredOrders]);

  // CSV Export utility
  const handleExportCSV = () => {
    const rows = [
      ['Tipo', 'Numero/Concepto', 'Fecha', 'Sucursal', 'Cliente/Proveedor', 'Total'],
      ...filteredOrders.map((o) => [
        'Orden de Trabajo',
        o.orderNumber,
        o.createdAt,
        o.branchId,
        o.clientName,
        o.total,
      ]),
      ...filteredSales.map((s) => [
        'Venta Mostrador',
        s.saleNumber,
        s.createdAt,
        s.branchId,
        s.clientName || 'Consumidor Final',
        s.total,
      ]),
      ...filteredExpenses.map((e) => [
        'Egreso',
        e.concept,
        e.date || e.createdAt,
        e.branchId,
        e.supplier || '-',
        -e.amount,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_lubricentro_${period}_${branchFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Reportes & Métricas
          </h1>
          <p className="text-xs text-slate-400">
            Análisis consolidado de rentabilidad, ventas por sucursal y servicios
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Exportar a CSV / Excel</span>
        </button>
      </div>

      {/* Filter Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-4 h-4 text-slate-500 mr-1" />
          <button
            onClick={() => setPeriod('mes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              period === 'mes' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setPeriod('ano')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              period === 'ano' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Este Año
          </button>
          <button
            onClick={() => setPeriod('todos')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              period === 'todos' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todo el Histórico
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Sucursal:</span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-hidden"
          >
            <option value="todas">Todas las Sucursales</option>
            <option value="escobar">Escobar</option>
            <option value="maschwitz">Ing. Maschwitz</option>
          </select>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ingresos Totales
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
            {formatCurrency(totalIngresos)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {filteredOrders.length} OTs + {filteredSales.length} ventas
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Egresos Totales
          </span>
          <span className="text-xl sm:text-2xl font-black text-red-400 font-mono mt-1 block">
            {formatCurrency(totalEgresos)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {filteredExpenses.length} comprobantes
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Resultado Neto
          </span>
          <span
            className={`text-xl sm:text-2xl font-black font-mono mt-1 block ${
              resultadoNeto >= 0 ? 'text-white' : 'text-red-400'
            }`}
          >
            {formatCurrency(resultadoNeto)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Margen operativo período
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Ticket Promedio OT
          </span>
          <span className="text-xl sm:text-2xl font-black text-indigo-400 font-mono mt-1 block">
            {filteredOrders.length > 0
              ? formatCurrency(totalOrdersAmount / filteredOrders.length)
              : '$ 0'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Por vehículo atendido
          </span>
        </div>
      </div>

      {/* Comparisons: Sucursal Escobar vs Maschwitz */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branch Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-white">Rendimiento por Sucursal</h2>
            </div>
            <span className="text-xs text-slate-500">Comparativa directa</span>
          </div>

          <div className="space-y-4">
            {/* Escobar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Sucursal Escobar</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(branchStats.escobar.income)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 pt-1">
                <div>
                  <span className="block text-[10px] text-slate-500">OTs / Ventas</span>
                  <span className="font-bold text-slate-200">
                    {branchStats.escobar.ordersCount} / {branchStats.escobar.salesCount}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Egresos</span>
                  <span className="font-bold text-red-400 font-mono">
                    {formatCurrency(branchStats.escobar.expenses)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Neto</span>
                  <span className="font-bold text-white font-mono">
                    {formatCurrency(branchStats.escobar.net)}
                  </span>
                </div>
              </div>
            </div>

            {/* Maschwitz */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Sucursal Ing. Maschwitz</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(branchStats.maschwitz.income)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 pt-1">
                <div>
                  <span className="block text-[10px] text-slate-500">OTs / Ventas</span>
                  <span className="font-bold text-slate-200">
                    {branchStats.maschwitz.ordersCount} / {branchStats.maschwitz.salesCount}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Egresos</span>
                  <span className="font-bold text-red-400 font-mono">
                    {formatCurrency(branchStats.maschwitz.expenses)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">Neto</span>
                  <span className="font-bold text-white font-mono">
                    {formatCurrency(branchStats.maschwitz.net)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Type Breakdown: Aceite vs Mecánica */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Distribución por Servicio</h2>
            </div>
            <span className="text-xs text-slate-500">Volumen vs Facturación</span>
          </div>

          <div className="space-y-4">
            {/* Aceite & Filtros */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-white text-sm">Cambio de Aceite & Filtros</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(typeStats.oilTotal)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {typeStats.oilCount} órdenes realizadas en el período
              </p>
            </div>

            {/* Mecánica Integral */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white text-sm">Mecánica Integral</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(typeStats.mecTotal)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {typeStats.mecCount} órdenes realizadas en el período
              </p>
            </div>

            {/* Mostrador */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-sm">Ventas Mostrador (Fluidos/Filtros)</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(totalSalesAmount)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {filteredSales.length} ventas con remito emitido
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
