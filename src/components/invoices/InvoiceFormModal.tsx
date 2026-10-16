import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, Supplier, VoucherType, InvoiceStatus } from '../../types';
import { Modal } from '../common/Modal';
import {
  FileText,
  Upload,
  Calendar,
  Building2,
  DollarSign,
  Paperclip,
  X,
  FileCheck,
  Image,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
  suppliers: Supplier[];
  initialSupplier?: Supplier | null;
  onSave: (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | void>;
  onUpdate?: (id: string, data: Partial<Invoice>) => Promise<void>;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
  suppliers,
  initialSupplier,
  onSave,
  onUpdate,
}) => {
  const isEditing = Boolean(invoiceToEdit?.id);

  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [cuit, setCuit] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [voucherType, setVoucherType] = useState<VoucherType>('Factura A');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Default due date to 15 days from today
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 15);
  const [dueDate, setDueDate] = useState(defaultDue.toISOString().split('T')[0]);

  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria');
  const [status, setStatus] = useState<InvoiceStatus>('pendiente');
  const [paymentDate, setPaymentDate] = useState('');
  const [observations, setObservations] = useState('');
  const [branchId, setBranchId] = useState('ambas');

  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>();
  const [attachmentName, setAttachmentName] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    setFormError(null);
    if (invoiceToEdit) {
      setSupplierId(invoiceToEdit.supplierId || '');
      setSupplierName(invoiceToEdit.supplierName || '');
      setCuit(invoiceToEdit.cuit || '');
      setInvoiceNumber(invoiceToEdit.invoiceNumber || '');
      setVoucherType(invoiceToEdit.voucherType || 'Factura A');
      setIssueDate(invoiceToEdit.issueDate || '');
      setDueDate(invoiceToEdit.dueDate || '');
      setConcept(invoiceToEdit.concept || '');
      setAmount(invoiceToEdit.amount ? String(invoiceToEdit.amount) : '');
      setItems(invoiceToEdit.items || []);
      setPaymentMethod(invoiceToEdit.paymentMethod || 'Transferencia Bancaria');
      setStatus(invoiceToEdit.status || 'pendiente');
      setPaymentDate(invoiceToEdit.paymentDate || '');
      setObservations(invoiceToEdit.observations || '');
      setBranchId(invoiceToEdit.branchId || 'ambas');
      setAttachmentUrl(invoiceToEdit.attachmentUrl);
      setAttachmentName(invoiceToEdit.attachmentName);
    } else {
      if (initialSupplier) {
        setSupplierId(initialSupplier.id);
        setSupplierName(initialSupplier.name);
        setCuit(initialSupplier.cuit);
      } else {
        setSupplierId('');
        setSupplierName('');
        setCuit('');
      }
      setInvoiceNumber('');
      setVoucherType('Factura A');
      setIssueDate(new Date().toISOString().split('T')[0]);
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 15);
      setDueDate(nextDue.toISOString().split('T')[0]);
      setConcept('');
      setAmount('');
      setItems([]);
      setPaymentMethod('Transferencia Bancaria');
      setStatus('pendiente');
      setPaymentDate('');
      setObservations('');
      setBranchId('ambas');
      setAttachmentUrl(undefined);
      setAttachmentName(undefined);
    }
  }, [invoiceToEdit, initialSupplier, isOpen]);

  // When supplier is selected from dropdown
  const handleSelectSupplier = (selectedId: string) => {
    setSupplierId(selectedId);
    const found = suppliers.find((s) => s.id === selectedId);
    if (found) {
      setSupplierName(found.name);
      setCuit(found.cuit);
    }
  };

  // Add a new row to items table
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: '',
        description: '',
        quantity: 1,
        cost: 0,
        total: 0,
      },
    ]);
  };

  // Remove a row from items table
  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0) {
        const sum = updated.reduce((acc, curr) => acc + (curr.total || 0), 0);
        setAmount(String(sum));
      }
      return updated;
    });
  };

  // Handle cell changes in items table: auto calculate row total and grand total
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const current = { ...copy[index] };

      if (field === 'code' || field === 'description') {
        current[field] = value;
      } else if (field === 'quantity') {
        const qty = parseFloat(value) || 0;
        current.quantity = qty;
        current.total = Number((qty * (current.cost || 0)).toFixed(2));
      } else if (field === 'cost') {
        const cost = parseFloat(value) || 0;
        current.cost = cost;
        current.total = Number(((current.quantity || 0) * cost).toFixed(2));
      }

      copy[index] = current;

      // Automatically recalculate grand total
      const sum = copy.reduce((acc, curr) => acc + (curr.total || 0), 0);
      setAmount(String(sum));

      return copy;
    });
  };

  // Handle file attachment (PDF or Image)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachmentUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !invoiceNumber.trim() || !dueDate) {
      setFormError('Por favor complete los campos obligatorios (Proveedor, N° de Factura, Vencimiento).');
      return;
    }

    const numericAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    if (numericAmount <= 0) {
      setFormError('Por favor ingrese un importe numérico mayor a 0 o cargue ítems con costo.');
      return;
    }

    const validItems = items.filter(
      (it) => it.description.trim() || it.code?.trim() || (it.cost && it.cost > 0) || it.total > 0
    );

    // Auto-fill concept if empty but items exist
    const resolvedConcept = concept.trim() || (
      validItems.length > 0
        ? validItems.map((i) => `${i.quantity}x ${i.description || i.code}`).join(', ')
        : 'Compra / Insumos de proveedor'
    );

    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
        supplierId: supplierId || '',
        supplierName: supplierName.trim(),
        cuit: cuit.trim(),
        invoiceNumber: invoiceNumber.trim(),
        voucherType,
        issueDate,
        dueDate,
        concept: resolvedConcept,
        amount: numericAmount,
        items: validItems,
        paymentMethod,
        status,
        paymentDate: status === 'pagada' ? (paymentDate || new Date().toISOString().split('T')[0]) : '',
        observations: observations.trim(),
        branchId,
        attachmentUrl: attachmentUrl || '',
        attachmentName: attachmentName || '',
      };

      if (isEditing && invoiceToEdit && onUpdate) {
        await onUpdate(invoiceToEdit.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      setFormError(err.message || 'Error al guardar la factura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Factura #${invoiceToEdit?.invoiceNumber}` : 'Nueva Factura de Proveedor'}
      subtitle="Registro de compras, insumos y control de vencimientos comerciales"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs">
            {formError}
          </div>
        )}
        {/* Supplier & CUIT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Seleccionar Proveedor Existente
            </label>
            <select
              value={supplierId}
              onChange={(e) => handleSelectSupplier(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="">-- Seleccionar o escribir abajo --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.cuit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nombre / Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Ej: Distribuidora Shell"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              CUIT del Proveedor
            </label>
            <input
              type="text"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              placeholder="Ej: 30-68192834-4"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Sucursal Asignada
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="ambas">Ambas Sucursales / General</option>
              <option value="escobar">Escobar</option>
              <option value="maschwitz">Ing. Maschwitz</option>
            </select>
          </div>
        </div>

        {/* Invoice details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Tipo de Comprobante <span className="text-red-500">*</span>
            </label>
            <select
              value={voucherType}
              onChange={(e) => setVoucherType(e.target.value as VoucherType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="Factura A">Factura A</option>
              <option value="Factura B">Factura B</option>
              <option value="Factura C">Factura C</option>
              <option value="Remito">Remito</option>
              <option value="Nota de Débito">Nota de Débito</option>
              <option value="Nota de Crédito">Nota de Crédito</option>
              <option value="Comprobante">Comprobante Interno</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Número de Factura <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Ej: 0001-00012345"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Importe Total ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Fecha de Emisión <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Fecha de Vencimiento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Medio de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Cheque">Cheque</option>
              <option value="Cuenta Corriente">Cuenta Corriente</option>
              <option value="Débito">Débito</option>
              <option value="Crédito">Crédito</option>
              <option value="Mercado Pago">Mercado Pago</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Estado de la Factura
            </label>
            <select
              value={status}
              onChange={(e) => {
                const val = e.target.value as InvoiceStatus;
                setStatus(val);
                if (val === 'pagada' && !paymentDate) {
                  setPaymentDate(new Date().toISOString().split('T')[0]);
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="vencida">Vencida</option>
            </select>
          </div>

          {status === 'pagada' && (
            <div>
              <label className="block text-xs font-bold text-emerald-400 mb-1">
                Fecha de Pago
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Detalle por Ítem (Conceptos Desglosados) */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-850">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Detalle de Conceptos / Ítems
                </h4>
                <p className="text-[11px] text-slate-400">
                  Agrega los conceptos de la factura desglosados renglón por renglón.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" />
              <span>+ Agregar Concepto / Ítem</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="py-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
              <p className="text-xs text-slate-400">
                No hay conceptos desglosados cargados.
              </p>
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-2 text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
              >
                + Cargar primer concepto ítem por ítem
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2 px-1 w-28">Código</th>
                    <th className="py-2 px-2">Descripción *</th>
                    <th className="py-2 px-1 w-20 text-center">Cantidad</th>
                    <th className="py-2 px-2 w-28 text-right">Costo ($)</th>
                    <th className="py-2 px-2 w-28 text-right">Total ($)</th>
                    <th className="py-2 px-1 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-900/40">
                      <td className="py-1.5 px-1">
                        <input
                          type="text"
                          value={it.code || ''}
                          onChange={(e) => handleItemChange(idx, 'code', e.target.value)}
                          placeholder="Cod-123"
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-red-500"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Ej: Aceite Sintético 5W30 4L"
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-red-500"
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center text-white text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={it.cost || ''}
                          onChange={(e) => handleItemChange(idx, 'cost', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-right text-white text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <span className="font-mono font-bold text-xs text-emerald-400">
                          {formatCurrency(it.total || 0)}
                        </span>
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-800 font-bold text-xs text-slate-300">
                    <td colSpan={4} className="py-2.5 px-2 text-right">
                      Subtotal Conceptos:
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(items.reduce((acc, curr) => acc + (curr.total || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Concept / detail */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Concepto Resumido / Detalle General de Compra
          </label>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Ej: Tambores 205L Helix Ultra 5W40 y cajas de filtros de aceite"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
          />
        </div>

        {/* File Attachment Upload (PDF or Image) */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Comprobante Adjunto (Factura en PDF o Imagen)
          </label>
          {attachmentUrl ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700">
              <div className="flex items-center gap-2 truncate">
                {attachmentUrl.startsWith('data:application/pdf') || attachmentName?.endsWith('.pdf') ? (
                  <FileText className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <Image className="w-4 h-4 text-blue-400 shrink-0" />
                )}
                <span className="text-xs text-slate-200 font-medium truncate">
                  {attachmentName || 'Comprobante adjunto'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachmentUrl(undefined);
                  setAttachmentName(undefined);
                }}
                className="p-1 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                title="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors border border-slate-700">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Subir PDF o Foto</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-500">
                Formatos permitidos: PDF, JPG, PNG
              </span>
            </div>
          )}
        </div>

        {/* Observations */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Observaciones</label>
          <textarea
            rows={2}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Aclaraciones de entrega, números de remito asociados, condiciones de pago..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/50 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Factura'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
