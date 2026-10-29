import React, { useState, useEffect } from 'react';
import { Client, Vehicle } from '../../types';
import { Modal } from '../common/Modal';
import { Car, Check } from 'lucide-react';

interface ClientVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  vehicle?: Vehicle | null;
  onSave: (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (id: string, vehicleData: Partial<Vehicle>) => Promise<void>;
}

export const ClientVehicleModal: React.FC<ClientVehicleModalProps> = ({
  isOpen,
  onClose,
  client,
  vehicle,
  onSave,
  onUpdate,
}) => {
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [lastServiceKm, setLastServiceKm] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (vehicle) {
        setLicensePlate(vehicle.licensePlate || '');
        setBrand(vehicle.brand || '');
        setModel(vehicle.model || '');
        setYear(vehicle.year || new Date().getFullYear());
        setCurrentKm(vehicle.currentKm || 0);
        setLastServiceKm(vehicle.lastServiceKm);
      } else {
        setLicensePlate('');
        setBrand('');
        setModel('');
        setYear(new Date().getFullYear());
        setCurrentKm(0);
        setLastServiceKm(undefined);
      }
    }
  }, [isOpen, vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim()) {
      setError('Por favor ingresa la patente del vehículo.');
      return;
    }
    if (!brand.trim() || !model.trim()) {
      setError('Por favor ingresa la marca y modelo del vehículo.');
      return;
    }
    if (!client && !vehicle) {
      setError('Cliente no especificado.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const cleanPlate = licensePlate.trim().toUpperCase();
      const payload: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> = {
        licensePlate: cleanPlate,
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year) || new Date().getFullYear(),
        currentKm: Number(currentKm) || 0,
        lastServiceKm: lastServiceKm ? Number(lastServiceKm) : undefined,
        clientId: vehicle?.clientId || client?.id || '',
        clientName: vehicle?.clientName || client?.fullName || 'Cliente Sin Nombre',
        branchId: vehicle?.branchId || client?.branchId || 'escobar',
        active: true,
      };

      if (vehicle?.id && onUpdate) {
        await onUpdate(vehicle.id, payload);
      } else {
        await onSave(payload);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar el vehículo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-red-500" />
          <span>
            {vehicle ? `Editar Vehículo (${vehicle.licensePlate})` : `Agregar Vehículo a ${client?.fullName || 'Cliente'}`}
          </span>
        </div>
      }
      subtitle="Registro de automóviles asociados a este cliente"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        {client && !vehicle && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Propietario asignado:</span>
            <span className="font-bold text-white">{client.fullName}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Patente / Dominio *
            </label>
            <input
              type="text"
              required
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              placeholder="Ej: AA123BB / AF456CD"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-red-400 tracking-wider focus:outline-hidden focus:border-red-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Marca *
            </label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ej: Toyota, Volkswagen, Ford"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Modelo *
            </label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ej: Hilux, Gol Trend, Ranger"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Año del Vehículo
            </label>
            <input
              type="number"
              min="1950"
              max={new Date().getFullYear() + 1}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              placeholder="Ej: 2021"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Kilometraje Actual (KM)
            </label>
            <input
              type="number"
              min="0"
              value={currentKm || ''}
              onChange={(e) => setCurrentKm(Number(e.target.value))}
              placeholder="Ej: 45000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              KM del Último Service (Opcional)
            </label>
            <input
              type="number"
              min="0"
              value={lastServiceKm ?? ''}
              onChange={(e) => setLastServiceKm(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Ej: 35000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-hidden focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando...' : vehicle ? 'Guardar Cambios' : 'Registrar Vehículo'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
