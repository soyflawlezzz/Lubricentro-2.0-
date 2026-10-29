import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Client, Vehicle, WorkOrder } from '../../types';
import { formatBranchName, buildWhatsAppLink, formatPlate } from '../../utils/formatters';
import { BranchBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Search,
  Users,
  Plus,
  Car,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  QrCode,
  FileText,
  History,
} from 'lucide-react';
import { ClientFormModal } from './ClientFormModal';
import { ClientVehicleModal } from './ClientVehicleModal';

interface ClientsListProps {
  clients: Client[];
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  onSaveClient: (
    clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>,
    vehiclesData?: Array<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  onUpdateClient?: (
    id: string,
    clientData: Partial<Client>,
    vehiclesData?: Array<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  onSaveVehicle?: (
    vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onUpdateVehicle?: (
    id: string,
    vehicleData: Partial<Vehicle>
  ) => Promise<void>;
  onDeleteVehicle?: (id: string) => Promise<void>;
  onSelectVehiclePlate?: (plate: string) => void;
  onOpenSticker?: (vehicle: Vehicle) => void;
  onOpenPassport?: (plate: string) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({
  clients,
  vehicles,
  workOrders,
  onSaveClient,
  onUpdateClient,
  onSaveVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onSelectVehiclePlate,
  onOpenSticker,
  onOpenPassport,
}) => {
  const { currentBranch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Vehicle modal state (for adding/editing a vehicle to a client)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [targetClientForVehicle, setTargetClientForVehicle] = useState<Client | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Vehicle delete state
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const name = (c.fullName || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const doc = (c.documentNumber || '').toLowerCase();

        // Check if query matches any plate, brand or model belonging to this client
        const clientVehicles = vehicles.filter((v) => v.clientId === c.id);
        const matchesVehicle = clientVehicles.some((v) => {
          const plate = (v.licensePlate || '').toLowerCase();
          const brand = (v.brand || '').toLowerCase();
          const model = (v.model || '').toLowerCase();
          return plate.includes(query) || brand.includes(query) || model.includes(query);
        });

        return (
          name.includes(query) ||
          phone.includes(query) ||
          doc.includes(query) ||
          matchesVehicle
        );
      }

      if (currentBranch !== 'todas' && c.branchId && c.branchId !== currentBranch) {
        return false;
      }
      return true;
    });
  }, [clients, vehicles, currentBranch, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Clientes & Flotas de Vehículos
          </h1>
          <p className="text-xs text-slate-400">
            {filteredClients.length} clientes registrados &bull; Cada cliente puede poseer múltiples vehículos
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsClientModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente por nombre, teléfono, DNI o por patente, marca o modelo de sus autos..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
          <Users className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            No se encontraron clientes
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Agrega tu primer cliente con el botón "+ Registrar Nuevo Cliente".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            // Find all vehicles of this client
            const clientVehicles = vehicles.filter(
              (v) =>
                v.clientId === client.id ||
                v.clientName?.trim().toLowerCase() === client.fullName?.trim().toLowerCase()
            );

            const waLink = client.whatsapp
              ? buildWhatsAppLink(
                  client.whatsapp,
                  `Hola ${client.fullName}, te contactamos desde Lubricentro 2.0.`
                )
              : '';

            return (
              <div
                key={client.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Client Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>{client.fullName}</span>
                      </h3>
                      {client.documentNumber && (
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          DNI/CUIT: {client.documentNumber}
                        </span>
                      )}
                    </div>
                    <BranchBadge branchId={client.branchId} />
                  </div>

                  {/* Contact info pills */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.whatsapp && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-mono font-medium">
                          {client.whatsapp}
                        </span>
                      </div>
                    )}
                    {client.address && (
                      <span className="text-[11px] text-slate-400 block pt-0.5">
                        📍 {client.address}
                      </span>
                    )}
                  </div>

                  {/* Associated Vehicles Section */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-red-500" />
                        <span>Vehículos ({clientVehicles.length})</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetClientForVehicle(client);
                          setEditingVehicle(null);
                          setIsVehicleModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[11px] font-bold transition-all border border-red-500/30 cursor-pointer"
                        title="Agregar un nuevo auto a este cliente"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Agregar Auto</span>
                      </button>
                    </div>

                    {clientVehicles.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                        <span className="text-xs text-slate-500 italic block">
                          Sin vehículos asignados a este cliente
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetClientForVehicle(client);
                            setEditingVehicle(null);
                            setIsVehicleModalOpen(true);
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Agregar primer auto</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {clientVehicles.map((v) => (
                          <div
                            key={v.id}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 group/veh hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span
                                onClick={() => onSelectVehiclePlate && onSelectVehiclePlate(v.licensePlate)}
                                className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-red-400 font-mono font-bold text-xs tracking-wider cursor-pointer hover:border-red-500 shrink-0"
                                title="Ver en módulo de vehículos"
                              >
                                {formatPlate(v.licensePlate)}
                              </span>
                              <div className="truncate text-xs">
                                <span className="font-bold text-white block truncate">
                                  {v.brand} {v.model}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Año {v.year} &bull; {v.currentKm ? `${v.currentKm.toLocaleString()} KM` : 'Sin KM'}
                                </span>
                              </div>
                            </div>

                            {/* Quick Actions for Vehicle */}
                            <div className="flex items-center gap-1 shrink-0">
                              {onOpenSticker && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSticker(v)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors cursor-pointer"
                                  title="Generar Sticker QR para parabrisas"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {onOpenPassport && (
                                <button
                                  type="button"
                                  onClick={() => onOpenPassport(v.licensePlate)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition-colors cursor-pointer"
                                  title="Ver Pasaporte Digital QR"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setTargetClientForVehicle(client);
                                  setEditingVehicle(v);
                                  setIsVehicleModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
                                title="Editar vehículo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {onDeleteVehicle && (
                                <button
                                  type="button"
                                  onClick={() => setVehicleToDelete(v)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors cursor-pointer"
                                  title="Eliminar vehículo"
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
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  {client.whatsapp ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <span />
                  )}

                  <button
                    onClick={() => {
                      setEditingClient(client);
                      setIsClientModalOpen(true);
                    }}
                    className="p-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Editar Ficha</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Client Form Modal (Create or Edit Client) */}
      <ClientFormModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        client={editingClient}
        existingVehicles={vehicles}
        onSave={onSaveClient}
        onUpdate={onUpdateClient}
      />

      {/* 2. Add / Edit Vehicle Modal (Direct '+' button on Client card) */}
      <ClientVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
          setTargetClientForVehicle(null);
        }}
        client={targetClientForVehicle}
        vehicle={editingVehicle}
        onSave={async (vData) => {
          if (onSaveVehicle) {
            await onSaveVehicle(vData);
          }
        }}
        onUpdate={async (vId, vData) => {
          if (onUpdateVehicle) {
            await onUpdateVehicle(vId, vData);
          }
        }}
      />

      {/* 3. Confirm Delete Vehicle Dialog */}
      <ConfirmDialog
        isOpen={!!vehicleToDelete}
        title="Eliminar Vehículo"
        message={`¿Estás seguro de que deseas eliminar el vehículo patente "${vehicleToDelete?.licensePlate}" (${vehicleToDelete?.brand} ${vehicleToDelete?.model}) de los registros?`}
        confirmText="Eliminar Vehículo"
        cancelText="Cancelar"
        danger={true}
        onConfirm={async () => {
          if (vehicleToDelete && onDeleteVehicle) {
            await onDeleteVehicle(vehicleToDelete.id);
            setVehicleToDelete(null);
          }
        }}
        onCancel={() => setVehicleToDelete(null)}
      />
    </div>
  );
};
