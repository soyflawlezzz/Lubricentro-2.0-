import React, { useState } from 'react';
import { Supplier, Invoice } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate, buildWhatsAppLink } from '../../utils/formatters';
import {
  Building2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  User,
  FileText,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null; // null if creating new
  invoices: Invoice[]; // all invoices to filter supplier's history
  onSave: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (id: string, data: Partial<Supplier>) => Promise<void>;
  onOpenNewInvoiceForSupplier?: (supplier: Supplier) => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onToggleInvoicePaid?: (invoice: Invoice) => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
  invoices,
  onSave,
  onUpdate,
  onOpenNewInvoiceForSupplier,
  onViewInvoice,
  onToggleInvoicePaid,
}) => {
  const isEditing = Boolean(supplier?.id);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  const [name, setName] = useState(supplier?.name || '');
  const [cuit, setCuit] = useState(supplier?.cuit || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [whatsapp, setWhatsapp] = useState(supplier?.whatsapp || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [address, setAddress] = useState(supplier?.address || '');
  const [contactPerson, setContactPerson] = useState(supplier?.contactPerson || '');
  const [observations, setObservations] = useState(supplier?.observations || '');
  const [status, setStatus] = useState<'activo' | 'inactivo'>(supplier?.status || 'activo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if supplier changes
  React.useEffect(() => {
    if (supplier) {
      setName(supplier.name || '');
      setCuit(supplier.cuit || '');
      setPhone(supplier.phone || '');
      setWhatsapp(supplier.whatsapp || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
      setContactPerson(supplier.contactPerson || '');
      setObservations(supplier.observations || '');
      setStatus(supplier.status || 'activo');
      setActiveTab('history'); // default to history if viewing existing supplier
    } else {
      setName('');
      setCuit('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setAddress('');
      setContactPerson('');
      setObservations('');
      setStatus('activo');
      setActiveTab('info');
    }
  }, [supplier, isOpen]);

  // Supplier's invoices
  const supplierInvoices = React.useMemo(() => {
    if (!supplier) return [];
    return invoices.filter(
      (inv) =>
        inv.supplierId === supplier.id ||
        (inv.cuit && inv.cuit === supplier.cuit) ||
        (inv.supplierName && inv.supplierName.trim().toLowerCase() === supplier.name.trim().toLowerCase())
    );
  }, [invoices, supplier]);

  // Financial summary
  const totals = React.useMemo(() => {
    const totalFacturado = supplierInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPagado = supplierInvoices
      .filter((inv) => inv.status === 'pagada')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPendiente = supplierInvoices
      .filter((inv) => inv.status !== 'pagada')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalVencido = supplierInvoices
      .filter((inv) => inv.status === 'vencida')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    return { totalFacturado, totalPagado, totalPendiente, totalVencido };
  }, [supplierInvoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cuit.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && supplier && onUpdate) {
        await onUpdate(supplier.id, {
          name: name.trim(),
          cuit: cuit.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          address: address.trim(),
          contactPerson: contactPerson.trim(),
          observations: observations.trim(),
          status,
        });
      } else {
        await onSave({
          name: name.trim(),
          cuit: cuit.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          address: address.trim(),
          contactPerson: contactPerson.trim(),
          observations: observations.trim(),
          status,
        });
      }
      onClose();
    } catch (err) {
      console.error('Error saving supplier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const waLink = whatsapp ? buildWhatsAppLink(whatsapp, `Hola ${name}, nos comunicamos desde Lubricentro 2.0.`) : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Proveedor: ${supplier?.name}` : 'Nuevo Proveedor'}
      subtitle={isEditing ? `CUIT: ${supplier?.cuit}` : 'Registrar nuevo proveedor de lubricantes y repuestos'}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* If editing existing, show tab switcher */}
        {isEditing && (
          <div className="flex border-b border-slate-800 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-red-600 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Historial de Facturas ({supplierInvoices.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'info'
                  ? 'border-red-600 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Datos del Proveedor</span>
            </button>
          </div>
        )}

        {/* TAB: Historial de Facturas */}
        {isEditing && activeTab === 'history' && (
          <div className="space-y-4">
            {/* Quick Actions & Contact Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{phone}</span>
                  </a>
                )}
                {contactPerson && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{contactPerson}</span>
                  </span>
                )}
              </div>

              {onOpenNewInvoiceForSupplier && supplier && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewInvoiceForSupplier(supplier);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cargar Factura</span>
                </button>
              )}
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Facturado</span>
                <span className="text-base font-black text-white font-mono mt-0.5 block">{formatCurrency(totals.totalFacturado)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Total Pagado</span>
                <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">{formatCurrency(totals.totalPagado)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Pendiente / A Pagar</span>
                <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">{formatCurrency(totals.totalPendiente)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Vencido</span>
                <span className="text-base font-black text-red-400 font-mono mt-0.5 block">{formatCurrency(totals.totalVencido)}</span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Comprobantes Registrados ({supplierInvoices.length})
              </div>

              {supplierInvoices.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No hay facturas registradas para este proveedor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3">Comprobante</th>
                        <th className="py-2.5 px-3">Vencimiento</th>
                        <th className="py-2.5 px-3">Concepto</th>
                        <th className="py-2.5 px-3 text-right">Importe</th>
                        <th className="py-2.5 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {supplierInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-850/40">
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                inv.status === 'pagada'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : inv.status === 'vencida'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-200">
                            {inv.voucherType} {inv.invoiceNumber}
                          </td>
                          <td className="py-2 px-3 text-slate-300">
                            {formatDate(inv.dueDate)}
                          </td>
                          <td className="py-2 px-3 text-slate-400 max-w-[160px] truncate">
                            {inv.concept || '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white">
                            {formatCurrency(inv.amount)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onToggleInvoicePaid && (
                                <button
                                  type="button"
                                  onClick={() => onToggleInvoicePaid(inv)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                    inv.status === 'pagada'
                                      ? 'bg-slate-850 hover:bg-slate-800 text-slate-300'
                                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  {inv.status === 'pagada' ? 'Pendiente' : 'Pagar'}
                                </button>
                              )}
                              {onViewInvoice && (
                                <button
                                  type="button"
                                  onClick={() => onViewInvoice(inv)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                                  title="Ver detalle"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Form / Datos del Proveedor */}
        {(activeTab === 'info' || !isEditing) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Razón Social / Nombre del Proveedor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Distribuidora Shell & Castrol Argentina"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  CUIT del Proveedor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  placeholder="Ej: 30-68192834-4"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ej: Martín Rodríguez (Asesor Comercial)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 011 4765-8899"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ej: 5491147658899"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: pedidos@proveedor.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'activo' | 'inactivo')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Dirección / Localidad</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Av. Warnes 1250, CABA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Condiciones comerciales, días de entrega, descuentos, etc."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/50 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
