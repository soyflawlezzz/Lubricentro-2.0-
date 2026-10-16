import React, { useState, useEffect } from 'react';
import { ServiceAppointment, Client, Vehicle, CompanySettings, WorkOrder } from '../../types';
import { Modal } from '../common/Modal';
import {
  CalendarClock,
  User,
  Phone,
  Car,
  Clock,
  MapPin,
  Wrench,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatBranchName } from '../../utils/formatters';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentToEdit?: ServiceAppointment | null;
  initialDate?: string;
  clients?: Client[];
  vehicles?: Vehicle[];
  settings?: CompanySettings;
  presetWorkOrder?: WorkOrder | null;
  onSave: (data: Omit<ServiceAppointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  onUpdate?: (id: string, data: Partial<ServiceAppointment>) => Promise<void>;
}

export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  isOpen,
  onClose,
  appointmentToEdit,
  initialDate,
  clients = [],
  vehicles = [],
  settings,
  presetWorkOrder,
  onSave,
  onUpdate,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [branchId, setBranchId] = useState<'escobar' | 'maschwitz'>('escobar');
  const [serviceType, setServiceType] = useState<ServiceAppointment['serviceType']>('aceite_filtro');
  const [estimatedDuration, setEstimatedDuration] = useState('45 min');
  const [status, setStatus] = useState<ServiceAppointment['status']>('confirmado');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (appointmentToEdit) {
        setClientName(appointmentToEdit.clientName || '');
        setClientWhatsapp(appointmentToEdit.clientWhatsapp || '');
        setClientPhone(appointmentToEdit.clientPhone || '');
        setLicensePlate(appointmentToEdit.licensePlate || '');
        setVehicleBrand(appointmentToEdit.vehicleBrand || '');
        setVehicleModel(appointmentToEdit.vehicleModel || '');
        setVehicleYear(appointmentToEdit.vehicleYear || '');
        setDate(appointmentToEdit.date || new Date().toISOString().split('T')[0]);
        setTime(appointmentToEdit.time || '09:00');
        setBranchId((appointmentToEdit.branchId as 'escobar' | 'maschwitz') || 'escobar');
        setServiceType(appointmentToEdit.serviceType || 'aceite_filtro');
        setEstimatedDuration(appointmentToEdit.estimatedDuration || '45 min');
        setStatus(appointmentToEdit.status || 'confirmado');
        setNotes(appointmentToEdit.notes || '');
      } else if (presetWorkOrder) {
        setClientName(presetWorkOrder.clientName || '');
        setClientWhatsapp(presetWorkOrder.clientWhatsapp || presetWorkOrder.clientPhone || '');
        setClientPhone(presetWorkOrder.clientPhone || '');
        setLicensePlate(presetWorkOrder.licensePlate || '');
        setVehicleBrand(presetWorkOrder.vehicleBrand || '');
        setVehicleModel(presetWorkOrder.vehicleModel || '');
        setVehicleYear(presetWorkOrder.vehicleYear || '');
        setDate(initialDate || new Date().toISOString().split('T')[0]);
        setTime('09:30');
        setBranchId((presetWorkOrder.branchId === 'maschwitz' ? 'maschwitz' : 'escobar'));
        setServiceType(presetWorkOrder.type === 'aceite_filtro' ? 'aceite_filtro' : 'mecanica_integral');
        setEstimatedDuration('1 hora');
        setStatus('confirmado');
        setNotes(`Vinculado a OT #${presetWorkOrder.orderNumber}. ${presetWorkOrder.notes || ''}`.trim());
      } else {
        const todayStr = initialDate || new Date().toISOString().split('T')[0];
        setClientName('');
        setClientWhatsapp('');
        setClientPhone('');
        setLicensePlate('');
        setVehicleBrand('');
        setVehicleModel('');
        setVehicleYear('');
        setDate(todayStr);
        setTime('09:30');
        setBranchId('escobar');
        setServiceType('aceite_filtro');
        setEstimatedDuration('45 min');
        setStatus('confirmado');
        setNotes('');
      }
    }
  }, [isOpen, appointmentToEdit, presetWorkOrder, initialDate]);

  // Quick auto-complete when plate or client is chosen
  const handleClientSelect = (clientId: string) => {
    const c = clients.find((item) => item.id === clientId);
    if (c) {
      setClientName(c.fullName);
      setClientWhatsapp(c.whatsapp || c.phone || '');
      setClientPhone(c.phone || '');
      if (c.branchId && (c.branchId === 'escobar' || c.branchId === 'maschwitz')) {
        setBranchId(c.branchId);
      }
      // Check vehicle of this client
      const matchingV = vehicles.find((v) => v.clientId === c.id);
      if (matchingV) {
        setLicensePlate(matchingV.licensePlate);
        setVehicleBrand(matchingV.brand);
        setVehicleModel(matchingV.model);
        setVehicleYear(matchingV.year || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setErrorMsg('Por favor ingresa el nombre del cliente.');
      return;
    }
    if (!clientWhatsapp.trim() && !clientPhone.trim()) {
      setErrorMsg('Por favor ingresa un teléfono o WhatsApp de contacto.');
      return;
    }
    if (!licensePlate.trim()) {
      setErrorMsg('Por favor ingresa la patente del vehículo.');
      return;
    }
    if (!date) {
      setErrorMsg('Por favor selecciona la fecha del turno.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: Omit<ServiceAppointment, 'id' | 'createdAt' | 'updatedAt'> = {
        clientName: clientName.trim(),
        clientWhatsapp: clientWhatsapp.trim(),
        clientPhone: clientPhone.trim() || undefined,
        licensePlate: licensePlate.trim().toUpperCase(),
        vehicleBrand: vehicleBrand.trim() || undefined,
        vehicleModel: vehicleModel.trim() || undefined,
        vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
        date,
        time,
        branchId,
        serviceType,
        estimatedDuration,
        status,
        notes: notes.trim() || undefined,
        createdFromWorkOrderId: presetWorkOrder?.id || appointmentToEdit?.createdFromWorkOrderId || undefined,
      };

      if (appointmentToEdit && onUpdate) {
        await onUpdate(appointmentToEdit.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      setErrorMsg(err.message || 'Error al guardar el turno.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonTimeSlots = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-red-500" />
          <span>
            {appointmentToEdit
              ? 'Editar Turno de Service'
              : presetWorkOrder
              ? `Agendar Turno para OT #${presetWorkOrder.orderNumber}`
              : 'Agendar Nuevo Turno de Service'}
          </span>
        </div>
      }
      subtitle="Organización de turnos de taller para lubricación y mecánica integral"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Fecha, Horario y Sucursal */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-red-400" />
            <span>Fecha, Horario y Sucursal</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Fecha del Turno *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Horario del Turno *
              </label>
              <div className="relative">
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-hidden focus:border-red-500 cursor-pointer font-mono font-bold"
                >
                  {commonTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} hs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Sucursal del Taller *
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value as 'escobar' | 'maschwitz')}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-hidden focus:border-red-500 cursor-pointer"
              >
                <option value="escobar">Escobar (Estrada 1355)</option>
                <option value="maschwitz">Maschwitz (Colectora Oeste 1439)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Tipo de Servicio y Duración */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-red-400" />
            <span>Tipo de Servicio & Estado</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Servicio a Realizar *
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-red-500 cursor-pointer font-semibold"
              >
                <option value="aceite_filtro">🛢️ Cambio de Aceite & Filtros</option>
                <option value="mecanica_integral">🔧 Mecánica Integral</option>
                <option value="frenos">🛑 Frenos (Pastillas / Discos)</option>
                <option value="distribucion">⚙️ Correa de Distribución</option>
                <option value="suspension">🔩 Suspensión & Tren Delantero</option>
                <option value="revision_general">🔍 Revisión General Pre-Viaje</option>
                <option value="otro">🛠️ Otro Trabajo / Consulta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Duración Estimada
              </label>
              <select
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-red-500 cursor-pointer"
              >
                <option value="30 min">30 minutos</option>
                <option value="45 min">45 minutos</option>
                <option value="1 hora">1 hora</option>
                <option value="1.5 horas">1 hora y media</option>
                <option value="2 horas">2 horas</option>
                <option value="Media Jornada">Media Jornada (4 hs)</option>
                <option value="Día Completo">Día Completo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Estado del Turno
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-red-500 cursor-pointer font-bold"
              >
                <option value="confirmado">✓ Confirmado</option>
                <option value="pendiente">⏳ Pendiente de Confirmar</option>
                <option value="en_taller">🚗 En Taller Actualmente</option>
                <option value="completado">🏁 Completado / Entregado</option>
                <option value="cancelado">✕ Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Cliente y Vehículo */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-red-400" />
              <span>Datos del Cliente & Vehículo</span>
            </h4>
            {clients.length > 0 && (
              <select
                onChange={(e) => handleClientSelect(e.target.value)}
                defaultValue=""
                className="text-[11px] px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 cursor-pointer"
              >
                <option value="" disabled>
                  -- Cargar cliente registrado --
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.whatsapp || c.phone})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-hidden focus:border-red-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                WhatsApp del Cliente *
              </label>
              <input
                type="text"
                required
                value={clientWhatsapp}
                onChange={(e) => setClientWhatsapp(e.target.value)}
                placeholder="Ej: 11 6488-4571"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-hidden focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Patente del Vehículo *
              </label>
              <input
                type="text"
                required
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="Ej: AB123CD o AA123BB"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-mono font-bold focus:outline-hidden focus:border-red-500 uppercase tracking-wider"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Marca / Modelo
                </label>
                <input
                  type="text"
                  value={vehicleBrand}
                  onChange={(e) => setVehicleBrand(e.target.value)}
                  placeholder="Ej: Ford Ranger"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Año (Opcional)
                </label>
                <input
                  type="number"
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value ? Number(e.target.value) : '')}
                  placeholder="2020"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:outline-hidden focus:border-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Notas adicionales */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Notas u Observaciones del Turno
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Trae aceite Motul 5W30 propio, revisar ruidos en frenos traseros..."
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-hidden focus:border-red-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/50 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Guardando...' : appointmentToEdit ? 'Guardar Cambios' : 'Agendar Turno'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
