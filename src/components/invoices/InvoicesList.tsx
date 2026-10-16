import React, { useState, useMemo } from 'react';
import { Invoice, Supplier, InvoiceStatus } from '../../types';
import { formatCurrency, formatDate, formatBranchName } from '../../utils/formatters';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  Paperclip,
  Eye,
  Edit2,
  Trash2,
  Building2,
  CalendarDays,
} from 'lucide-react';
import { InvoiceFormModal } from './InvoiceFormModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

interface InvoicesListProps {
  invoices: Invoice[];
  suppliers: Supplier[];
  onSaveInvoice: (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | void>;
  onUpdateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onNavigateToCalendar?: () => void;
  onNavigateToSuppliers?: () => void;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({
  invoices,
  suppliers,
  onSaveInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onNavigateToCalendar,
  onNavigateToSuppliers,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'todas' | 'proximas' | 'vencidas' | 'pendientes' | 'pagadas'>('todas');
  const [branchFilter, setBranchFilter] = useState('todas');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to categorize an invoice
  const getCategory = (inv: Invoice) => {
    if (inv.status === 'pagada') return 'pagada';
    const dueTime = new Date(inv.dueDate + 'T00:00:00').getTime();
    const todayTime = new Date(todayStr + 'T00:00:00').getTime();
    const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'vencida';
    if (diffDays <= 7) return 'proxima';
    return 'pendiente';
  };

  const getDiffDays = (dueDate: string) => {
    const dueTime = new Date(dueDate + 'T00:00:00').getTime();
    const todayTime = new Date(todayStr + 'T00:00:00').getTime();
    return Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));
  };

  // Metrics
  const stats = useMemo(() => {
    let totalPending = 0;
    let countExpiringSoon = 0;
    let totalExpiringSoon = 0;
    let countOverdue = 0;
    let totalOverdue = 0;
    let countPaid = 0;
    let totalPaid = 0;

    invoices.forEach((inv) => {
      const cat = getCategory(inv);
      if (cat === 'pagada') {
        countPaid++;
        totalPaid += inv.amount || 0;
      } else {
        totalPending += inv.amount || 0;
        if (cat === 'vencida') {
          countOverdue++;
          totalOverdue += inv.amount || 0;
        } else if (cat === 'proxima') {
          countExpiringSoon++;
          totalExpiringSoon += inv.amount || 0;
        }
      }
    });

    return {
      totalPending,
      countExpiringSoon,
      totalExpiringSoon,
      countOverdue,
      totalOverdue,
      countPaid,
      totalPaid,
    };
  }, [invoices, todayStr]);

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Branch filter
      if (branchFilter !== 'todas' && inv.branchId !== 'ambas' && inv.branchId !== branchFilter) {
        return false;
      }

      // Tab filter
      const cat = getCategory(inv);
      if (filterTab === 'proximas' && cat !== 'proxima') return false;
      if (filterTab === 'vencidas' && cat !== 'vencida') return false;
      if (filterTab === 'pendientes' && (cat === 'pagada')) return false;
      if (filterTab === 'pagadas' && cat !== 'pagada') return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSupp = (inv.supplierName || '').toLowerCase().includes(query);
        const matchesCuit = (inv.cuit || '').toLowerCase().includes(query);
        const matchesNum = (inv.invoiceNumber || '').toLowerCase().includes(query);
        const matchesConcept = (inv.concept || '').toLowerCase().includes(query);
        return matchesSupp || matchesCuit || matchesNum || matchesConcept;
      }

      return true;
    });
  }, [invoices, branchFilter, filterTab, searchTerm, todayStr]);

  const handleCreate = () => {
    setInvoiceToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (inv: Invoice) => {
    setInvoiceToEdit(inv);
    setIsFormOpen(true);
  };

  const handleTogglePaid = async (inv: Invoice) => {
    const nextStatus: InvoiceStatus = inv.status === 'pagada' ? 'pendiente' : 'pagada';
    await onUpdateInvoice(inv.id, {
      status: nextStatus,
      paymentDate: nextStatus === 'pagada' ? new Date().toISOString().split('T')[0] : undefined,
    });
    if (selectedInvoice && selectedInvoice.id === inv.id) {
      setSelectedInvoice({
        ...selectedInvoice,
        status: nextStatus,
        paymentDate: nextStatus === 'pagada' ? new Date().toISOString().split('T')[0] : undefined,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-red-500" />
            <span>Facturas de Proveedores</span>
          </h1>
          <p className="text-xs text-slate-400">
            Control de cuentas por pagar, vencimientos comerciales y comprobantes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToCalendar && (
            <button
              onClick={onNavigateToCalendar}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-amber-400" />
              <span>Ver Calendario</span>
            </button>
          )}
          {onNavigateToSuppliers && (
            <button
              onClick={onNavigateToSuppliers}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Proveedores</span>
            </button>
          )}
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/50 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total a Pagar
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
            {formatCurrency(stats.totalPending)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Pendientes activas
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Próximas a Vencer (7d)
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5 block">
            {formatCurrency(stats.totalExpiringSoon)}
          </span>
          <span className="text-[11px] text-amber-400/80 mt-0.5 block">
            {stats.countExpiringSoon} factura(s) en 7 días
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-red-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
              Facturas Vencidas
            </span>
            {stats.countOverdue > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
          </div>
          <span className="text-xl sm:text-2xl font-black text-red-400 font-mono mt-0.5 block">
            {formatCurrency(stats.totalOverdue)}
          </span>
          <span className="text-[11px] text-red-400/80 mt-0.5 block">
            {stats.countOverdue} factura(s) atrasadas
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
            Facturas Pagadas
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
            {formatCurrency(stats.totalPaid)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {stats.countPaid} canceladas
          </span>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Tab filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 w-fit">
          <button
            onClick={() => setFilterTab('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'todas'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({invoices.length})
          </button>
          <button
            onClick={() => setFilterTab('proximas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'proximas'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Próximas a vencer ({stats.countExpiringSoon})</span>
          </button>
          <button
            onClick={() => setFilterTab('vencidas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'vencidas'
                ? 'bg-red-600 text-white shadow'
                : 'text-red-400 hover:text-red-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Vencidas ({stats.countOverdue})</span>
          </button>
          <button
            onClick={() => setFilterTab('pendientes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'pendientes'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilterTab('pagadas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'pagadas'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pagadas ({stats.countPaid})</span>
          </button>
        </div>

        {/* Search and Branch selection */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por proveedor, CUIT, Nº de factura o concepto..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="todas">Todas las Sucursales</option>
              <option value="escobar">Escobar</option>
              <option value="maschwitz">Ing. Maschwitz</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table & Cards */}
      {filteredInvoices.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No hay facturas que coincidan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || filterTab !== 'todas'
              ? 'Probá ajustando los filtros de búsqueda o estado.'
              : 'Registrá la primera factura con el botón "Nueva Factura".'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Sucursal</th>
                  <th className="py-3 px-4 text-right">Importe</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInvoices.map((inv) => {
                  const cat = getCategory(inv);
                  const diff = getDiffDays(inv.dueDate);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        {inv.status === 'pagada' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Pagada
                          </span>
                        ) : cat === 'vencida' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Vencida</span>
                          </span>
                        ) : cat === 'proxima' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            <span>Próx. a vencer</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                            Pendiente
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{inv.supplierName}</div>
                        {inv.cuit && <div className="text-[11px] text-slate-400 font-mono">{inv.cuit}</div>}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-slate-400">{inv.voucherType} </span>
                        <strong className="text-white">{inv.invoiceNumber}</strong>
                        {inv.attachmentUrl && (
                          <span className="inline-block ml-1 text-slate-500" title="Tiene archivo adjunto">
                            <Paperclip className="w-3 h-3 inline" />
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">{formatDate(inv.dueDate)}</div>
                        {inv.status !== 'pagada' && (
                          <div className={`text-[10px] font-semibold ${diff < 0 ? 'text-red-400' : diff <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {diff < 0 ? `Vencida hace ${Math.abs(diff)}d` : diff === 0 ? '¡Vence hoy!' : `Faltan ${diff} días`}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {inv.concept || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {formatBranchName(inv.branchId)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-white">
                        {formatCurrency(inv.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleTogglePaid(inv)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                              inv.status === 'pagada'
                                ? 'bg-slate-800 text-slate-400 hover:text-white'
                                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                            }`}
                            title={inv.status === 'pagada' ? 'Marcar como pendiente' : 'Marcar como pagada'}
                          >
                            {inv.status === 'pagada' ? 'Desmarcar' : 'Pagar'}
                          </button>
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                            title="Ver Detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(inv)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setInvoiceToDelete(inv)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer"
                              title="Eliminar (Sólo Administrador)"
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
            {filteredInvoices.map((inv) => {
              const cat = getCategory(inv);
              const diff = getDiffDays(inv.dueDate);

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="p-4 hover:bg-slate-850/50 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{inv.supplierName}</h4>
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">
                        {inv.voucherType} #{inv.invoiceNumber}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-base text-white">
                      {formatCurrency(inv.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Vence: <strong className="text-slate-200">{formatDate(inv.dueDate)}</strong></span>
                    {inv.status === 'pagada' ? (
                      <span className="text-emerald-400 font-bold">✓ Pagada</span>
                    ) : (
                      <span className={`font-bold ${diff < 0 ? 'text-red-400' : diff <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {diff < 0 ? `Vencida (-${Math.abs(diff)}d)` : diff === 0 ? '¡Vence hoy!' : `En ${diff} días`}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 truncate">{inv.concept}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleTogglePaid(inv)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        inv.status === 'pagada'
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {inv.status === 'pagada' ? 'Desmarcar' : 'Marcar Pagada'}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold"
                      >
                        Ver Detalle
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setInvoiceToDelete(inv)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer"
                          title="Eliminar Factura"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <InvoiceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          invoiceToEdit={invoiceToEdit}
          suppliers={suppliers}
          onSave={onSaveInvoice}
          onUpdate={onUpdateInvoice}
        />
      )}

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          onEdit={(inv) => {
            setSelectedInvoice(null);
            handleEdit(inv);
          }}
          onDelete={onDeleteInvoice}
          onTogglePaid={handleTogglePaid}
        />
      )}

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!invoiceToDelete}
        title="Eliminar Factura"
        message={`¿Estás seguro de que deseas eliminar permanentemente la factura #${invoiceToDelete?.invoiceNumber} de ${invoiceToDelete?.supplierName}?`}
        confirmText="Eliminar Factura"
        cancelText="Cancelar"
        danger={true}
        onConfirm={async () => {
          if (invoiceToDelete) {
            await onDeleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
          }
        }}
        onCancel={() => setInvoiceToDelete(null)}
      />
    </div>
  );
};
