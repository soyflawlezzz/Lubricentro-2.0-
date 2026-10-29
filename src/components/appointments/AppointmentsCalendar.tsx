import React, { useState, useMemo, useEffect } from 'react';
import {
  ServiceAppointment,
  Client,
  Vehicle,
  CompanySettings,
  AppointmentStatus,
} from '../../types';
import {
  CalendarClock,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Car,
  User,
  Wrench,
  MessageCircle,
  ArrowRightCircle,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Check,
  Fuel,
  Info,
} from 'lucide-react';
import {
  formatDate,
  formatBranchName,
  buildWhatsAppLink,
} from '../../utils/formatters';
import { AppointmentFormModal } from './AppointmentFormModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import {
  initGoogleCalendarAuth,
  signInGoogleCalendar,
  getGoogleCalendarAccessToken,
  syncAppointmentToGoogleCalendar,
} from '../../services/googleCalendar';


interface AppointmentsCalendarProps {
  appointments: ServiceAppointment[];
  clients?: Client[];
  vehicles?: Vehicle[];
  settings?: CompanySettings;
  onSaveAppointment: (data: Omit<ServiceAppointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  onUpdateAppointment: (id: string, data: Partial<ServiceAppointment>) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onConvertToWorkOrder?: (appointment: ServiceAppointment) => void;
}

export const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({
  appointments,
  clients = [],
  vehicles = [],
  settings,
  onSaveAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onConvertToWorkOrder,
}) => {
  const { isAdmin, currentBranch } = useAuth();

  // Navigation & View states
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'mes' | 'dia' | 'lista'>('mes');
  const [selectedBranch, setSelectedBranch] = useState<'todas' | 'escobar' | 'maschwitz'>('todas');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | AppointmentStatus>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<ServiceAppointment | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | undefined>();
  const [appointmentToDelete, setAppointmentToDelete] = useState<ServiceAppointment | null>(null);

  // Google Calendar Integration states
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

  const handleSyncAllToCalendar = async () => {
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

    const confirmed = window.confirm(`¿Deseas sincronizar los ${appointments.length} turnos actuales con tu Google Calendar principal?`);
    if (!confirmed) return;

    setIsSyncingCalendar(true);
    try {
      let count = 0;
      for (const app of appointments) {
        await syncAppointmentToGoogleCalendar(app, token);
        count++;
      }
      alert(`¡Sincronización exitosa! Se exportaron ${count} turnos a Google Calendar.`);
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`Error al sincronizar turnos: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month name in Spanish
  const monthName = currentDate.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  const todayIso = new Date().toISOString().split('T')[0];
  const selectedDayIso = currentDate.toISOString().split('T')[0];

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Branch filter
      if (selectedBranch !== 'todas' && app.branchId !== selectedBranch && app.branchId !== 'ambas') {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'todos' && app.status !== selectedStatus) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPlate = app.licensePlate.toLowerCase().includes(q);
        const matchesClient = app.clientName.toLowerCase().includes(q);
        const matchesVehicle = (app.vehicleBrand || '').toLowerCase().includes(q) || (app.vehicleModel || '').toLowerCase().includes(q);
        if (!matchesPlate && !matchesClient && !matchesVehicle) return false;
      }
      return true;
    });
  }, [appointments, selectedBranch, selectedStatus, searchQuery]);

  // Calendar matrix for current month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDayOfMonth.getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Prev month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const str = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr: str, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const str = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr: str, isCurrentMonth: true });
    }

    // Next month days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const str = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr: str, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, ServiceAppointment[]>();
    filteredAppointments.forEach((app) => {
      const list = map.get(app.date) || [];
      list.push(app);
      map.set(app.date, list);
    });
    // Sort each day by time
    map.forEach((list) => {
      list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    });
    return map;
  }, [filteredAppointments]);

  // Stats
  const stats = useMemo(() => {
    const todayList = appointments.filter((a) => a.date === todayIso);
    const confirmedCount = appointments.filter((a) => a.status === 'confirmado').length;
    const pendingCount = appointments.filter((a) => a.status === 'pendiente').length;
    const inShopCount = appointments.filter((a) => a.status === 'en_taller').length;
    return {
      today: todayList.length,
      confirmed: confirmedCount,
      pending: pendingCount,
      inShop: inShopCount,
    };
  }, [appointments, todayIso]);

  const serviceLabels: Record<ServiceAppointment['serviceType'], string> = {
    aceite_filtro: 'Cambio de Aceite & Filtros',
    mecanica_integral: 'Mecánica Integral',
    frenos: 'Frenos (Pastillas/Discos)',
    distribucion: 'Correa de Distribución',
    suspension: 'Suspensión & Tren Delantero',
    revision_general: 'Revisión General Pre-Viaje',
    otro: 'Trabajo General',
  };

  const statusBadge = (st: AppointmentStatus) => {
    switch (st) {
      case 'confirmado':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pendiente':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'en_taller':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completado':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'cancelado':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  const getBranchAddress = (branchId: string) => {
    if (branchId === 'escobar') {
      return settings?.addressEscobar || 'Estrada 1355, Belén de Escobar';
    }
    return settings?.addressMaschwitz || 'Colectora Oeste 1439, Ing. Maschwitz';
  };

  const generateWhatsAppReminderLink = (app: ServiceAppointment) => {
    const branchName = app.branchId === 'escobar' ? 'Belén de Escobar' : 'Ing. Maschwitz';
    const address = getBranchAddress(app.branchId);
    const serviceName = serviceLabels[app.serviceType] || 'Service de Mantenimiento';
    const vehicleText = `${app.vehicleBrand || ''} ${app.vehicleModel || ''}`.trim() || 'tu vehículo';

    const text = `¡Hola ${app.clientName}! Te confirmamos tu turno de service en *${settings?.companyName || 'Lubricentro 2.0'}*:\n\n📅 *Fecha:* ${formatDate(app.date)}\n⏰ *Horario:* ${app.time} hs\n📍 *Sucursal:* ${branchName} (${address})\n🚗 *Vehículo:* ${vehicleText} (Patente: ${app.licensePlate})\n🔧 *Trabajo:* ${serviceName}\n\n¡Te esperamos puntual! Ante cualquier consulta o cambio de horario avisanos por este medio.`;

    return buildWhatsAppLink(app.clientWhatsapp || app.clientPhone || '', text);
  };

  const handleOpenNewAppointment = (dateStr?: string) => {
    setSelectedDateForNew(dateStr || todayIso);
    setAppointmentToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditAppointment = (app: ServiceAppointment) => {
    setAppointmentToEdit(app);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-red-500" />
            <span>Turnos de Service & Taller</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Agenda y control de turnos para cambios de aceite, mecánica y revisiones en Escobar y Maschwitz
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isCalendarConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Calendar ({calendarUserEmail})</span>
              <button
                onClick={handleSyncAllToCalendar}
                disabled={isSyncingCalendar}
                className="ml-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSyncingCalendar ? 'Sincronizando...' : 'Sincronizar con Google Calendar'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogleCalendar}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-xs sm:text-sm text-white font-bold transition-all cursor-pointer shadow-sm"
            >
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>Conectar Google Calendar</span>
            </button>
          )}

          <button
            onClick={() => handleOpenNewAppointment()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Turno</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Turnos Hoy
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {stats.today}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Programados para hoy</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            Confirmados
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {stats.confirmed}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Listos para recibir</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
            Pendientes
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {stats.pending}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">A confirmar por WhatsApp</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">
            En Taller Ahora
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
            {stats.inShop}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Vehículos en atención</div>
        </div>
      </div>

      {/* Filter and View Mode Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar patente o cliente..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
            />
          </div>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium focus:outline-hidden cursor-pointer"
          >
            <option value="todas">Todas las Sucursales</option>
            <option value="escobar">Sucursal Escobar</option>
            <option value="maschwitz">Sucursal Maschwitz</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium focus:outline-hidden cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="confirmado">Confirmados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_taller">En Taller</option>
            <option value="completado">Completados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-center">
          <button
            onClick={() => setViewMode('mes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'mes'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setViewMode('dia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'dia'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setViewMode('lista')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'lista'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lista de Turnos ({filteredAppointments.length})
          </button>
        </div>
      </div>

      {/* VIEW: MES (Monthly Grid) */}
      {viewMode === 'mes' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          {/* Month Header & Prev/Next */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white capitalize">
                {monthName}
              </h3>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 py-1">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span className="text-red-400">Sáb</span>
            <span className="text-slate-600">Dom</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              const dayAppointments = appointmentsByDate.get(cell.dateStr) || [];
              const isToday = cell.dateStr === todayIso;
              const hasAppointments = dayAppointments.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(cell.date);
                    if (hasAppointments) {
                      setViewMode('dia');
                    }
                  }}
                  className={`min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isToday
                      ? 'bg-red-950/20 border-red-500 shadow-md shadow-red-950/30'
                      : cell.isCurrentMonth
                      ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                      : 'bg-slate-950/20 border-slate-900/50 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center'
                          : cell.isCurrentMonth
                          ? 'text-white'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {cell.isCurrentMonth && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenNewAppointment(cell.dateStr);
                        }}
                        className="opacity-0 hover:opacity-100 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-0.5 rounded cursor-pointer"
                        title="Agendar turno en este día"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Appointments indicators */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayAppointments.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAppointment(app);
                        }}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate border ${statusBadge(
                          app.status
                        )}`}
                        title={`${app.time} hs - ${app.clientName} (${app.licensePlate}) - ${serviceLabels[app.serviceType]}`}
                      >
                        <span className="font-mono font-bold">{app.time}</span> {app.licensePlate}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-[9px] text-slate-400 font-bold pl-1">
                        +{dayAppointments.length - 3} más...
                      </div>
                    )}
                  </div>

                  {/* Branch indicator dots */}
                  {hasAppointments && (
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                      <span>{dayAppointments.length} turno(s)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: DIA (Daily Focused View) */}
      {viewMode === 'dia' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold uppercase font-mono">
                  {selectedDayIso === todayIso ? 'Hoy' : 'Día Seleccionado'}
                </span>
                <h3 className="text-lg font-black text-white capitalize">
                  {currentDate.toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {(appointmentsByDate.get(selectedDayIso) || []).length} turno(s) programados para esta fecha
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prev = new Date(currentDate);
                  prev.setDate(prev.getDate() - 1);
                  setCurrentDate(prev);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Hoy
              </button>
              <button
                onClick={() => {
                  const next = new Date(currentDate);
                  next.setDate(next.getDate() + 1);
                  setCurrentDate(next);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenNewAppointment(selectedDayIso)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer ml-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Turno este día</span>
              </button>
            </div>
          </div>

          {/* List of appointments for the day */}
          {(() => {
            const dayList = appointmentsByDate.get(selectedDayIso) || [];
            if (dayList.length === 0) {
              return (
                <div className="py-12 text-center text-slate-500">
                  <CalendarClock className="w-12 h-12 mx-auto mb-3 text-slate-700 opacity-60" />
                  <p className="text-sm font-semibold text-slate-400">
                    No hay turnos agendados para este día.
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Puedes agendar un nuevo turno haciendo clic en "Nuevo Turno este día".
                  </p>
                </div>
              );
            }

            return (
              <div className="divide-y divide-slate-800">
                {dayList.map((app) => (
                  <div
                    key={app.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/40 p-3 rounded-2xl transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shrink-0 shadow-inner">
                        <span className="text-sm font-mono font-black text-white">{app.time}</span>
                        <span className="text-[10px] text-slate-500 font-mono">hs</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusBadge(
                              app.status
                            )}`}
                          >
                            {app.status === 'en_taller' ? 'En Taller' : app.status}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                            <MapPin className="w-3 h-3 inline mr-1 text-red-500" />
                            {formatBranchName(app.branchId)}
                          </span>
                          <span className="text-xs text-red-400 font-bold">
                            {serviceLabels[app.serviceType]}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">{app.clientName}</h4>
                          <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                            {app.licensePlate}
                          </span>
                          {app.vehicleBrand && (
                            <span className="text-xs text-slate-400">
                              • {app.vehicleBrand} {app.vehicleModel}
                            </span>
                          )}
                        </div>

                        {app.notes && (
                          <p className="text-xs text-slate-400 italic">
                            Nota: {app.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions on this appointment */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                      {/* WhatsApp reminder */}
                      <a
                        href={generateWhatsAppReminderLink(app)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                        title="Enviar recordatorio o confirmación por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Convert to Work Order */}
                      {onConvertToWorkOrder && app.status !== 'completado' && (
                        <button
                          onClick={() => onConvertToWorkOrder(app)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
                          title="Convertir este turno en Orden de Trabajo en el taller"
                        >
                          <ArrowRightCircle className="w-3.5 h-3.5" />
                          <span>Pasar a OT</span>
                        </button>
                      )}

                      {/* Quick status toggle */}
                      <select
                        value={app.status}
                        onChange={async (e) => {
                          await onUpdateAppointment(app.id, {
                            status: e.target.value as AppointmentStatus,
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-semibold cursor-pointer"
                      >
                        <option value="confirmado">Confirmado</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_taller">En Taller</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>

                      {/* Edit */}
                      <button
                        onClick={() => handleEditAppointment(app)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                        title="Editar turno"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      {isAdmin && (
                        <button
                          onClick={() => setAppointmentToDelete(app)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                          title="Eliminar turno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW: LISTA (Full Chronological List) */}
      {viewMode === 'lista' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">
              Próximos Turnos Agendados ({filteredAppointments.length})
            </h3>
            <button
              onClick={() => handleOpenNewAppointment()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Turno</span>
            </button>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No se encontraron turnos con los filtros actuales.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredAppointments.map((app) => (
                <div
                  key={app.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/40 p-2 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center shrink-0">
                      <div className="text-xs font-bold text-white font-mono">{formatDate(app.date)}</div>
                      <div className="text-[11px] font-mono font-bold text-red-400">{app.time} hs</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusBadge(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                        <h4 className="font-bold text-sm text-white">{app.clientName}</h4>
                        <span className="font-mono text-xs font-bold text-red-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {app.licensePlate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {serviceLabels[app.serviceType]} • Sucursal {formatBranchName(app.branchId)}
                        {app.vehicleBrand ? ` • ${app.vehicleBrand} ${app.vehicleModel || ''}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={generateWhatsAppReminderLink(app)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold border border-emerald-500/30"
                    >
                      <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
                      WhatsApp
                    </a>

                    {onConvertToWorkOrder && app.status !== 'completado' && (
                      <button
                        onClick={() => onConvertToWorkOrder(app)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                      >
                        Pasar a OT
                      </button>
                    )}

                    <button
                      onClick={() => handleEditAppointment(app)}
                      className="p-1.5 text-slate-400 hover:text-white"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => setAppointmentToDelete(app)}
                        className="p-1.5 text-slate-400 hover:text-red-400"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointment Form Modal */}
      {isFormOpen && (
        <AppointmentFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setAppointmentToEdit(null);
          }}
          appointmentToEdit={appointmentToEdit}
          initialDate={selectedDateForNew}
          clients={clients}
          vehicles={vehicles}
          settings={settings}
          onSave={async (data) => {
            const id = await onSaveAppointment(data);
            if (isCalendarConnected) {
              const token = await getGoogleCalendarAccessToken();
              if (token) {
                try {
                  await syncAppointmentToGoogleCalendar(
                    { ...data, id: id || 'new-app' } as ServiceAppointment,
                    token
                  );
                } catch (e) {
                  console.warn('Auto-sync appointment error:', e);
                }
              }
            }
            return id;
          }}
          onUpdate={async (id, data) => {
            await onUpdateAppointment(id, data);
            if (isCalendarConnected) {
              const token = await getGoogleCalendarAccessToken();
              if (token) {
                try {
                  const updatedFull = appointments.find((a) => a.id === id);
                  if (updatedFull) {
                    await syncAppointmentToGoogleCalendar(
                      { ...updatedFull, ...data } as ServiceAppointment,
                      token
                    );
                  }
                } catch (e) {
                  console.warn('Auto-sync appointment update error:', e);
                }
              }
            }
          }}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!appointmentToDelete}
        title="Eliminar Turno de Service"
        message={`¿Estás seguro de que deseas eliminar el turno de "${appointmentToDelete?.clientName}" (${appointmentToDelete?.licensePlate}) programado para el ${formatDate(
          appointmentToDelete?.date
        )} a las ${appointmentToDelete?.time} hs?`}
        confirmText="Eliminar Turno"
        cancelText="Cancelar"
        danger={true}
        onConfirm={async () => {
          if (appointmentToDelete) {
            await onDeleteAppointment(appointmentToDelete.id);
            setAppointmentToDelete(null);
          }
        }}
        onCancel={() => setAppointmentToDelete(null)}
      />
    </div>
  );
};
