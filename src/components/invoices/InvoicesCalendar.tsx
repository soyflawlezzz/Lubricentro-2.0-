import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, Supplier } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Plus,
  Building2,
  FileText,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { InvoiceFormModal } from './InvoiceFormModal';
import {
  initGoogleCalendarAuth,
  signInGoogleCalendar,
  getGoogleCalendarAccessToken,
  syncInvoiceToGoogleCalendar,
} from '../../services/googleCalendar';

interface InvoicesCalendarProps {
  invoices: Invoice[];
  suppliers: Supplier[];
  onSaveInvoice: (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | void>;
  onUpdateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onNavigateToInvoices?: () => void;
}

type CalendarViewMode = 'mes' | 'semana' | 'dia';

export const InvoicesCalendar: React.FC<InvoicesCalendarProps> = ({
  invoices,
  suppliers,
  onSaveInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onNavigateToInvoices,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Google Calendar Integration
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [calendarUserEmail, setCalendarUserEmail] = useState<string | null>(null);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  useEffect(() => {
    const unsubscribe = initGoogleCalendarAuth(
      (user) => {
        setIsCalendarConnected(true);
        setCalendarUserEmail(user.email || 'Conectado');
      },
      () => {
        setIsCalendarConnected(false);
        setCalendarUserEmail(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleConnectGoogleCalendar = async () => {
    try {
      const res = await signInGoogleCalendar();
      if (res) {
        setIsCalendarConnected(true);
        setCalendarUserEmail(res.user.email || 'Conectado');
        alert('¡Conectado exitosamente con Google Calendar!');
      }
    } catch (err: any) {
      console.error('Google Calendar login failed:', err);
      alert('No se pudo conectar con Google Calendar.');
    }
  };

  const handleSyncAllInvoicesToCalendar = async () => {
    if (!isCalendarConnected) {
      await handleConnectGoogleCalendar();
      return;
    }
    const token = await getGoogleCalendarAccessToken();
    if (!token) {
      alert('Sesión de Google Calendar expirada. Por favor reconecte.');
      setIsCalendarConnected(false);
      return;
    }

    const confirmed = window.confirm(`¿Deseas exportar los ${invoices.length} vencimientos de facturas a tu Google Calendar principal?`);
    if (!confirmed) return;

    setIsSyncingCalendar(true);
    try {
      let count = 0;
      for (const inv of invoices) {
        if (inv.dueDate) {
          await syncInvoiceToGoogleCalendar(inv, token);
          count++;
        }
      }
      alert(`¡Sincronización exitosa! Se exportaron ${count} vencimientos a tu Google Calendar.`);
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`Error al sincronizar vencimientos: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to categorize
  const getCategory = (inv: Invoice) => {
    if (inv.status === 'pagada') return 'pagada';
    const dueTime = new Date(inv.dueDate + 'T00:00:00').getTime();
    const todayTime = new Date(todayStr + 'T00:00:00').getTime();
    const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'vencida';
    if (diffDays <= 7) return 'proxima';
    return 'pendiente';
  };

  // Navigate dates
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'mes') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'semana') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'mes') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'semana') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group invoices by due date string (YYYY-MM-DD)
  const invoicesByDate = useMemo(() => {
    const map: Record<string, Invoice[]> = {};
    invoices.forEach((inv) => {
      if (!inv.dueDate) return;
      if (!map[inv.dueDate]) {
        map[inv.dueDate] = [];
      }
      map[inv.dueDate].push(inv);
    });
    return map;
  }, [invoices]);

  // MONTH VIEW CALCULATION
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Days from prev month to align Monday (0 = Sunday, 1 = Monday ... in JS)
    let startDayOfWeek = firstDayOfMonth.getDay();
    // Argentine week starts on Monday
    const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        date: prevDate,
        dateStr: prevDate.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const cur = new Date(year, month, d);
      days.push({
        date: cur,
        dateStr: cur.toISOString().split('T')[0],
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete weeks (up to multiple of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextDate = new Date(year, month + 1, d);
        days.push({
          date: nextDate,
          dateStr: nextDate.toISOString().split('T')[0],
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [currentDate]);

  // WEEK VIEW CALCULATION
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      days.push({
        date: current,
        dateStr: current.toISOString().split('T')[0],
      });
    }
    return days;
  }, [currentDate]);

  // DAY VIEW CALCULATION
  const currentDayStr = currentDate.toISOString().split('T')[0];
  const currentDayInvoices = invoicesByDate[currentDayStr] || [];

  const monthName = currentDate.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-red-500" />
            <span>Calendario de Vencimientos</span>
          </h1>
          <p className="text-xs text-slate-400">
            Control cronológico de pagos a proveedores y alertas anticipadas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncAllInvoicesToCalendar}
            disabled={isSyncingCalendar}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer border ${
              isCalendarConnected
                ? 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-blue-400 border-blue-500/30'
            }`}
            title="Sincroniza los vencimientos de facturas con tu aplicación Google Calendar"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
            <span>
              {isSyncingCalendar
                ? 'Sincronizando...'
                : isCalendarConnected
                ? 'Google Calendar Activo'
                : 'Conectar Google Calendar'}
            </span>
          </button>

          {onNavigateToInvoices && (
            <button
              onClick={onNavigateToInvoices}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Ver Listado</span>
            </button>
          )}
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* Legend & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-300">Estados de Vencimiento:</span>
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Próxima a vencer (7 días)</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span>Vencida</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Pagada</span>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setViewMode('mes')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'mes' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setViewMode('semana')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'semana' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('dia')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'dia' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Día
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold cursor-pointer"
          >
            Hoy
          </button>
        </div>

        <h2 className="text-base sm:text-lg font-black text-white capitalize">
          {viewMode === 'dia'
            ? currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : monthName}
        </h2>
      </div>

      {/* VIEW: MES (Month Grid) */}
      {viewMode === 'mes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-3">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase py-2 border-b border-slate-800">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {monthDays.map((d, idx) => {
              const dayInvoices = invoicesByDate[d.dateStr] || [];
              const isToday = d.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(d.date);
                    if (dayInvoices.length > 0) {
                      setViewMode('dia');
                    }
                  }}
                  className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isToday
                      ? 'bg-red-950/20 border-red-500/60 shadow-inner'
                      : d.isCurrentMonth
                      ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      : 'bg-slate-950/20 border-transparent opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold rounded-lg px-1.5 py-0.5 ${
                        isToday
                          ? 'bg-red-600 text-white'
                          : d.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {d.date.getDate()}
                    </span>
                    {dayInvoices.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {dayInvoices.length}
                      </span>
                    )}
                  </div>

                  {/* Badges for day invoices */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayInvoices.slice(0, 2).map((inv) => {
                      const cat = getCategory(inv);
                      return (
                        <div
                          key={inv.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(inv);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center justify-between gap-1 cursor-pointer transition-transform hover:scale-[1.02] ${
                            cat === 'pagada'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                              : cat === 'vencida'
                              ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                              : cat === 'proxima'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                          title={`${inv.supplierName} - ${inv.voucherType} ${inv.invoiceNumber} - ${formatCurrency(inv.amount)}`}
                        >
                          <span className="truncate">{inv.supplierName}</span>
                          <span className="font-mono shrink-0">${(inv.amount / 1000).toFixed(0)}k</span>
                        </div>
                      );
                    })}
                    {dayInvoices.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-500 text-center">
                        +{dayInvoices.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: SEMANA (Week View) */}
      {viewMode === 'semana' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((d, idx) => {
            const dayInvoices = invoicesByDate[d.dateStr] || [];
            const isToday = d.dateStr === todayStr;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[300px] ${
                  isToday
                    ? 'bg-slate-900 border-red-500/50'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      {d.date.toLocaleDateString('es-AR', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                        isToday ? 'bg-red-600 text-white' : 'text-slate-200'
                      }`}
                    >
                      {d.date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayInvoices.map((inv) => {
                      const cat = getCategory(inv);
                      return (
                        <div
                          key={inv.id}
                          onClick={() => setSelectedInvoice(inv)}
                          className={`p-2 rounded-xl border text-xs cursor-pointer hover:border-slate-500 transition-colors space-y-1 ${
                            cat === 'pagada'
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                              : cat === 'vencida'
                              ? 'bg-red-950/30 border-red-500/40 text-red-200'
                              : cat === 'proxima'
                              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                              : 'bg-slate-950 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="font-bold truncate">{inv.supplierName}</div>
                          <div className="font-mono text-[11px] text-slate-400">{inv.invoiceNumber}</div>
                          <div className="font-mono font-black text-sm text-white pt-1 border-t border-slate-800">
                            {formatCurrency(inv.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {dayInvoices.length === 0 && (
                  <span className="text-[11px] text-slate-600 italic text-center py-8">
                    Sin vencimientos
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: DIA (Day View) */}
      {viewMode === 'dia' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">
                Vencimientos del día {formatDate(currentDayStr)}
              </h3>
              <p className="text-xs text-slate-400">
                {currentDayInvoices.length} factura(s) programadas para esta fecha
              </p>
            </div>
            <div className="font-mono font-black text-lg text-white">
              Total: {formatCurrency(currentDayInvoices.reduce((s, i) => s + (i.amount || 0), 0))}
            </div>
          </div>

          {currentDayInvoices.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No hay facturas con fecha de vencimiento en este día.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {currentDayInvoices.map((inv) => {
                const cat = getCategory(inv);
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/50 p-2 rounded-xl cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            cat === 'pagada'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : cat === 'vencida'
                              ? 'bg-red-500/10 text-red-400'
                              : cat === 'proxima'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cat}
                        </span>
                        <h4 className="font-bold text-sm text-white">{inv.supplierName}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {inv.voucherType} #{inv.invoiceNumber} • {inv.concept}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono font-black text-lg text-white">
                        {formatCurrency(inv.amount)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700"
                      >
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New Invoice Modal */}
      {isFormOpen && (
        <InvoiceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          suppliers={suppliers}
          onSave={async (data) => {
            const res = await onSaveInvoice(data);
            if (isCalendarConnected && data.dueDate) {
              const token = await getGoogleCalendarAccessToken();
              if (token) {
                try {
                  await syncInvoiceToGoogleCalendar(
                    {
                      ...data,
                      id: (res as string) || 'new-inv',
                      status: data.status || 'pendiente',
                    } as Invoice,
                    token
                  );
                } catch (e) {
                  console.warn('Auto-sync invoice to Google Calendar error:', e);
                }
              }
            }
            return res;
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          onEdit={() => {}}
          onDelete={onDeleteInvoice}
          onTogglePaid={async (inv) => {
            const nextStatus = inv.status === 'pagada' ? 'pendiente' : 'pagada';
            await onUpdateInvoice(inv.id, {
              status: nextStatus,
              paymentDate: nextStatus === 'pagada' ? new Date().toISOString().split('T')[0] : undefined,
            });
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
};
