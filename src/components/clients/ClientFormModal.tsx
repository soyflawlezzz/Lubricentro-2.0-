import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Client, Vehicle } from '../../types';
import { Modal } from '../common/Modal';
import { Users, Check, Car, Plus, Trash2 } from 'lucide-react';

export interface VehicleDraft {
  id?: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  currentKm: number;
  lastServiceKm?: number;
}

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  existingVehicles?: Vehicle[];
  onSave: (
    clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>,
    vehiclesData?: Array<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  onUpdate?: (
    id: string,
    clientData: Partial<Client>,
    vehiclesData?: Array<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  client,
  existingVehicles = [],
  onSave,
  onUpdate,
}) => {
  const { currentBranch, profile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [branchId, setBranchId] = useState('escobar');

  // Multi-vehicle list in form
  const [vehiclesList, setVehiclesList] = useState<VehicleDraft[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      if (client) {
        setFullName(client.fullName || '');
        setDocumentNumber(client.documentNumber || '');
        setPhone(client.phone || '');
        setWhatsapp(client.whatsapp || '');
        setEmail(client.email || '');
        setAddress(client.address || '');
        setNotes(client.notes || '');
        setBranchId(client.branchId || 'escobar');

        // Populate existing vehicles owned by this client
        const matched = existingVehicles.filter((v) => v.clientId === client.id);
        if (matched.length > 0) {
          setVehiclesList(
            matched.map((v) => ({
              id: v.id,
              licensePlate: v.licensePlate,
              brand: v.brand,
              model: v.model,
              year: v.year,
              currentKm: v.currentKm,
              lastServiceKm: v.lastServiceKm,
            }))
          );
        } else {
          setVehiclesList([]);
        }
      } else {
        const activeBranch =
          profile?.branchId !== 'todas'
            ? profile?.branchId || 'escobar'
            : currentBranch !== 'todas'
            ? currentBranch
            : 'escobar';
        setFullName('');
        setDocumentNumber('');
        setPhone('');
        setWhatsapp('');
        setEmail('');
        setAddress('');
        setNotes('');
        setBranchId(activeBranch);
        // Default with 1 empty vehicle slot for convenience
        setVehiclesList([
          {
            licensePlate: '',
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            currentKm: 0,
          },
        ]);
      }
    }
  }, [isOpen, client, existingVehicles, profile, currentBranch]);

  const handleAddVehicleRow = () => {
    setVehiclesList((prev) => [
      ...prev,
      {
        licensePlate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        currentKm: 0,
      },
    ]);
  };

  const handleRemoveVehicleRow = (index: number) => {
    setVehiclesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVehicleChange = (index: number, field: keyof VehicleDraft, value: any) => {
    setVehiclesList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Por favor ingresa el nombre y apellido o razón social del cliente.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const clientPayload: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
        fullName: fullName.trim(),
        documentNumber: documentNumber.trim() || undefined,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        branchId,
        active: true,
      };

      // Filter valid vehicles (must have a licensePlate)
      const validVehicles: Array<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>> = vehiclesList
        .filter((v) => v.licensePlate.trim())
        .map((v) => ({
          licensePlate: v.licensePlate.trim().toUpperCase(),
          brand: v.brand.trim() || 'Desconocida',
          model: v.model.trim() || 'General',
          year: Number(v.year) || new Date().getFullYear(),
          currentKm: Number(v.currentKm) || 0,
          lastServiceKm: v.lastServiceKm ? Number(v.lastServiceKm) : undefined,
          clientId: client?.id || '',
          clientName: fullName.trim(),
          branchId,
          active: true,
        }));

      if (client?.id && onUpdate) {
        await onUpdate(client.id, clientPayload, validVehicles);
      } else {
        await onSave(clientPayload, validVehicles);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error al guardar los datos del cliente.');
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
          <Users className="w-5 h-5 text-red-500" />
          <span>{client ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</span>
        </div>
      }
      subtitle="Ficha comercial y registro de vehículos asociados (soporta múltiples autos)"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs">
            {formError}
          </div>
        )}

        {/* Section 1: Client Personal Data */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-red-500" />
            <span>Datos Personales & Contacto</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Nombre y Apellido / Razón Social *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Marcelo Rossi / Distribuidora Norte"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-hidden focus:border-red-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                DNI / CUIT (Opcional)
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Ej: 32.456.789 / 30-71829340-8"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Sucursal Asignada
              </label>
              <select
                value={branchId}
                disabled={profile?.role === 'USUARIO_SUCURSAL'}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              >
                <option value="escobar">Escobar</option>
                <option value="maschwitz">Ing. Maschwitz</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Teléfono Principal
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="011 4455-6677"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                WhatsApp (para recordatorios)
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="11 5566-7788"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Email (Opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Domicilio / Localidad
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Belén de Escobar / Maschwitz"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Notas Adicionales
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferencias, facturación, etc."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Linked Multi-Vehicles */}
        <div className="pt-4 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Car className="w-4 h-4 text-red-400" />
                <span>Autos del Cliente ({vehiclesList.length})</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Un cliente puede tener 1 o más vehículos registrados bajo su misma cuenta.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddVehicleRow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold transition-colors cursor-pointer border border-red-500/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Agregar Otro Auto</span>
            </button>
          </div>

          {vehiclesList.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
              No hay vehículos añadidos aún. Haz clic en <strong>"+ Agregar Otro Auto"</strong> para registrar uno.
            </div>
          ) : (
            <div className="space-y-3">
              {vehiclesList.map((veh, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 relative space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-1 border-b border-slate-800/60">
                    <span className="flex items-center gap-1.5 text-red-400">
                      <Car className="w-3.5 h-3.5" />
                      <span>Vehículo #{index + 1}</span>
                    </span>

                    {vehiclesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVehicleRow(index)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar este vehículo de la lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Patente *
                      </label>
                      <input
                        type="text"
                        value={veh.licensePlate}
                        onChange={(e) =>
                          handleVehicleChange(index, 'licensePlate', e.target.value.toUpperCase())
                        }
                        placeholder="AA123BB"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-red-400 uppercase focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={veh.brand}
                        onChange={(e) => handleVehicleChange(index, 'brand', e.target.value)}
                        placeholder="Volkswagen"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Modelo
                      </label>
                      <input
                        type="text"
                        value={veh.model}
                        onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                        placeholder="Gol Trend"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Año
                      </label>
                      <input
                        type="number"
                        value={veh.year}
                        onChange={(e) => handleVehicleChange(index, 'year', Number(e.target.value))}
                        placeholder="2020"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        KM Actual
                      </label>
                      <input
                        type="number"
                        value={veh.currentKm || ''}
                        onChange={(e) => handleVehicleChange(index, 'currentKm', Number(e.target.value))}
                        placeholder="45000"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-hidden focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Cliente y Vehículos'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
