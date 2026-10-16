import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Client, Vehicle, WorkOrder } from '../../types';
import { formatBranchName, buildWhatsAppLink } from '../../utils/formatters';
import { BranchBadge } from '../common/Badge';
import {
  Search,
  Users,
  Plus,
  Car,
  Phone,
  MessageCircle,
  Edit2,
} from 'lucide-react';
import { ClientFormModal } from './ClientFormModal';

interface ClientsListProps {
  clients: Client[];
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  onSaveClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateClient?: (id: string, clientData: Partial<Client>) => Promise<void>;
  onSelectVehiclePlate?: (plate: string) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({
  clients,
  vehicles,
  workOrders,
  onSaveClient,
  onUpdateClient,
  onSelectVehiclePlate,
}) => {
  const { currentBranch } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (currentBranch !== 'todas' && c.branchId && c.branchId !== currentBranch) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const name = (c.fullName || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const doc = (c.documentNumber || '').toLowerCase();

        // Check if query matches any plate belonging to this client
        const clientVehicles = vehicles.filter((v) => v.clientId === c.id);
        const matchesPlate = clientVehicles.some((v) =>
          (v.licensePlate || '').toLowerCase().includes(query)
        );

        return (
          name.includes(query) ||
          phone.includes(query) ||
          doc.includes(query) ||
          matchesPlate
        );
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
            Clientes
          </h1>
          <p className="text-xs text-slate-400">
            {filteredClients.length} clientes registrados
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Cliente</span>
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
            placeholder="Buscar por nombre, teléfono, DNI o patente asociada..."
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
            Agrega tu primer cliente con el botón "+ Nuevo Cliente".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            // Find all vehicles of this client
            const clientVehicles = vehicles.filter(
              (v) =>
                v.clientId === client.id ||
                v.clientName?.toLowerCase() === client.fullName?.toLowerCase()
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
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {client.fullName}
                      </h3>
                      {client.documentNumber && (
                        <span className="text-[11px] font-mono text-slate-400">
                          Doc: {client.documentNumber}
                        </span>
                      )}
                    </div>
                    <BranchBadge branchId={client.branchId} />
                  </div>

                  {/* Contact info */}
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
                  </div>

                  {/* Associated Vehicles */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Vehículos Asociados ({clientVehicles.length})
                    </span>
                    {clientVehicles.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">
                        Sin vehículos asignados
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {clientVehicles.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => onSelectVehiclePlate && onSelectVehiclePlate(v.licensePlate)}
                            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500 text-[11px] text-slate-200 font-mono flex items-center gap-1 transition-colors cursor-pointer"
                            title="Ver historial del vehículo"
                          >
                            <Car className="w-3 h-3 text-red-500" />
                            <span className="font-bold text-red-400">{v.licensePlate}</span>
                            <span className="text-slate-400 font-sans text-[10px]">
                              {v.brand} {v.model}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom actions */}
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
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Client Modal */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        client={editingClient}
        onSave={onSaveClient}
        onUpdate={onUpdateClient}
      />
    </div>
  );
};
