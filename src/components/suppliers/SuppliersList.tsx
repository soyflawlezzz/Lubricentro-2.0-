import React, { useState, useMemo } from 'react';
import { Supplier, Invoice } from '../../types';
import { formatCurrency, buildWhatsAppLink } from '../../utils/formatters';
import {
  Building2,
  Search,
  Plus,
  Phone,
  MessageCircle,
  FileText,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { SupplierModal } from './SupplierModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

interface SuppliersListProps {
  suppliers: Supplier[];
  invoices: Invoice[];
  onSaveSupplier: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | void>;
  onUpdateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  onDeleteSupplier: (id: string) => Promise<void>;
  onOpenNewInvoiceForSupplier?: (supplier: Supplier) => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onToggleInvoicePaid?: (invoice: Invoice) => void;
}

export const SuppliersList: React.FC<SuppliersListProps> = ({
  suppliers,
  invoices,
  onSaveSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onOpenNewInvoiceForSupplier,
  onViewInvoice,
  onToggleInvoicePaid,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supp) => {
      if (statusFilter !== 'todos' && supp.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = (supp.name || '').toLowerCase().includes(query);
        const matchesCuit = (supp.cuit || '').toLowerCase().includes(query);
        const matchesContact = (supp.contactPerson || '').toLowerCase().includes(query);
        return matchesName || matchesCuit || matchesContact;
      }
      return true;
    });
  }, [suppliers, statusFilter, searchTerm]);

  // Overall statistics
  const stats = useMemo(() => {
    const activeCount = suppliers.filter((s) => s.status === 'activo').length;
    const totalPending = invoices
      .filter((inv) => inv.status !== 'pagada')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalInvoices = invoices.length;

    return { activeCount, totalPending, totalInvoices };
  }, [suppliers, invoices]);

  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-red-500" />
            <span>Proveedores</span>
          </h1>
          <p className="text-xs text-slate-400">
            Registro comercial de distribuidores, repuesteros y fabricantes
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/50 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Proveedores Activos</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">{stats.activeCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Comprobantes</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">{stats.totalInvoices}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Deuda Total Pendiente</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">{formatCurrency(stats.totalPending)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por razón social, CUIT o contacto..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'todos'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            Todos ({suppliers.length})
          </button>
          <button
            onClick={() => setStatusFilter('activo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'activo'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setStatusFilter('inactivo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'inactivo'
                ? 'bg-slate-800 text-slate-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Suppliers Table & Cards */}
      {filteredSuppliers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No se encontraron proveedores</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Probá cambiando el criterio de búsqueda.'
              : 'Agregá tu primer proveedor con el botón "Nuevo Proveedor".'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">CUIT</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4">Canales</th>
                  <th className="py-3 px-4 text-center">Facturas</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSuppliers.map((supp) => {
                  const suppInvoices = invoices.filter(
                    (inv) =>
                      inv.supplierId === supp.id ||
                      (inv.cuit && inv.cuit === supp.cuit) ||
                      (inv.supplierName && inv.supplierName.trim().toLowerCase() === supp.name.trim().toLowerCase())
                  );
                  const pendingTotal = suppInvoices
                    .filter((inv) => inv.status !== 'pagada')
                    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

                  const waLink = supp.whatsapp
                    ? buildWhatsAppLink(supp.whatsapp, `Hola ${supp.name}, te contactamos de Lubricentro 2.0.`)
                    : '';

                  return (
                    <tr
                      key={supp.id}
                      onClick={() => handleEdit(supp)}
                      className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{supp.name}</div>
                        {supp.address && <div className="text-[11px] text-slate-400 truncate max-w-xs">{supp.address}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        {supp.cuit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {supp.contactPerson || '-'}
                      </td>
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20"
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {supp.phone && (
                            <a
                              href={`tel:${supp.phone}`}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                              title="Llamar"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-white">{suppInvoices.length}</span>
                          {pendingTotal > 0 && (
                            <span className="text-[10px] text-amber-400 font-mono font-bold">
                              {formatCurrency(pendingTotal)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            supp.status === 'activo'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {supp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(supp)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Ver ficha e historial de facturas"
                          >
                            <FileText className="w-3.5 h-3.5 text-red-400" />
                            <span>Ficha</span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(supp)}
                              disabled={deletingId === supp.id}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Eliminar proveedor (Sólo Administrador)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-800">
            {filteredSuppliers.map((supp) => {
              const suppInvoices = invoices.filter(
                (inv) =>
                  inv.supplierId === supp.id ||
                  (inv.cuit && inv.cuit === supp.cuit) ||
                  (inv.supplierName && inv.supplierName.trim().toLowerCase() === supp.name.trim().toLowerCase())
              );
              const pendingTotal = suppInvoices
                .filter((inv) => inv.status !== 'pagada')
                .reduce((sum, inv) => sum + (inv.amount || 0), 0);

              return (
                <div
                  key={supp.id}
                  onClick={() => handleEdit(supp)}
                  className="p-4 hover:bg-slate-850/50 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{supp.name}</h4>
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">CUIT: {supp.cuit}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        supp.status === 'activo'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {supp.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Contacto: {supp.contactPerson || '-'}</span>
                    <span>Facturas: <strong className="text-white">{suppInvoices.length}</strong></span>
                  </div>

                  {pendingTotal > 0 && (
                    <div className="text-xs text-amber-400 flex items-center justify-between bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <span>Deuda pendiente:</span>
                      <strong className="font-mono">{formatCurrency(pendingTotal)}</strong>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(supp)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-red-400" />
                      <span>Ver Ficha</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(supp)}
                        className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400"
                        title="Eliminar proveedor (Sólo Administrador)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supplier Profile / Edit / Create Modal */}
      {isModalOpen && (
        <SupplierModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          supplier={selectedSupplier}
          invoices={invoices}
          onSave={async (data) => {
            await onSaveSupplier(data);
          }}
          onUpdate={onUpdateSupplier}
          onOpenNewInvoiceForSupplier={onOpenNewInvoiceForSupplier}
          onViewInvoice={onViewInvoice}
          onToggleInvoicePaid={onToggleInvoicePaid}
        />
      )}

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!supplierToDelete}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que deseas eliminar permanentemente al proveedor "${supplierToDelete?.name}"?`}
        confirmText="Eliminar Proveedor"
        cancelText="Cancelar"
        danger={true}
        onConfirm={async () => {
          if (supplierToDelete) {
            setDeletingId(supplierToDelete.id);
            try {
              await onDeleteSupplier(supplierToDelete.id);
            } finally {
              setDeletingId(null);
              setSupplierToDelete(null);
            }
          }
        }}
        onCancel={() => setSupplierToDelete(null)}
      />
    </div>
  );
};
