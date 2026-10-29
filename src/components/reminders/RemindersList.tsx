import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Reminder, CompanySettings } from '../../types';
import {
  formatDate,
  formatPlate,
  formatBranchName,
  buildWhatsAppLink,
} from '../../utils/formatters';
import { BranchBadge } from '../common/Badge';
import {
  BellRing,
  MessageCircle,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  Check,
} from 'lucide-react';

interface RemindersListProps {
  reminders: Reminder[];
  onUpdateStatus: (id: string, status: Reminder['status']) => Promise<void>;
  settings?: CompanySettings;
}

export const RemindersList: React.FC<RemindersListProps> = ({
  reminders,
  onUpdateStatus,
  settings,
}) => {
  const { currentBranch } = useAuth();
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'notificado'>('pendiente');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return reminders.filter((r) => {
      if (filter !== 'todos' && r.status !== filter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          r.clientName.toLowerCase().includes(q) ||
          r.licensePlate.toLowerCase().includes(q) ||
          r.vehicleInfo.toLowerCase().includes(q)
        );
      }
      if (currentBranch !== 'todas' && r.branchId && r.branchId !== currentBranch) return false;
      return true;
    });
  }, [reminders, currentBranch, filter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Recordatorios de Mantenimiento
          </h1>
          <p className="text-xs text-slate-400">
            Avisos de cambio de aceite y services programados para fidelización de clientes
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, patente o vehículo..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto">
          <button
            onClick={() => setFilter('pendiente')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'pendiente'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('notificado')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'notificado'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Notificados
          </button>
          <button
            onClick={() => setFilter('todos')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'todos'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <BellRing className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No hay recordatorios pendientes
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Los recordatorios se generan automáticamente a partir de las órdenes de trabajo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const defaultMsg =
              settings?.whatsappReminderTemplate
                ?.replace('{cliente}', item.clientName)
                ?.replace('{vehiculo}', item.vehicleInfo)
                ?.replace('{patente}', item.licensePlate) ||
              `Hola ${item.clientName}, te recordamos desde Lubricentro 2.0 que próximamente corresponde realizar el service de tu ${item.vehicleInfo} patente ${item.licensePlate}. Podés comunicarte con nosotros para coordinar tu turno en Escobar o Maschwitz.`;

            const waLink = buildWhatsAppLink(
              item.clientWhatsapp || item.clientPhone || '',
              item.message || defaultMsg
            );

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {formatPlate(item.licensePlate)}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5">
                        {item.clientName}
                      </h3>
                      <p className="text-xs text-slate-400">{item.vehicleInfo}</p>
                    </div>
                    <BranchBadge branchId={item.branchId} />
                  </div>

                  <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
                    {item.estimatedDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fecha Estimada:</span>
                        <span className="font-bold text-amber-400 font-mono">
                          {formatDate(item.estimatedDate)}
                        </span>
                      </div>
                    )}
                    {item.estimatedKm ? (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kilometraje Objetivo:</span>
                        <span className="font-bold text-white font-mono">
                          {item.estimatedKm.toLocaleString()} KM
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  {item.clientWhatsapp ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onUpdateStatus(item.id, 'notificado')}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Enviar Recordatorio WhatsApp</span>
                    </a>
                  ) : null}

                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'notificado'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.status === 'notificado' ? 'Notificado' : 'Pendiente'}
                    </span>

                    {item.status !== 'notificado' && (
                      <button
                        onClick={() => onUpdateStatus(item.id, 'notificado')}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Marcar Notificado</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
