import React, { useState } from 'react';
import { Invoice } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency, formatDate, formatBranchName } from '../../utils/formatters';
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  CreditCard,
  Image,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => Promise<void>;
  onTogglePaid: (invoice: Invoice) => Promise<void>;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onEdit,
  onDelete,
  onTogglePaid,
}) => {
  const { isAdmin } = useAuth();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  if (!invoice) return null;

  // Calculate days difference from today
  const today = new Date().toISOString().split('T')[0];
  const dueTime = new Date(invoice.dueDate + 'T00:00:00').getTime();
  const todayTime = new Date(today + 'T00:00:00').getTime();
  const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));

  const isOverdue = invoice.status !== 'pagada' && diffDays < 0;
  const isExpiringSoon = invoice.status !== 'pagada' && diffDays >= 0 && diffDays <= 7;

  const isPdf =
    invoice.attachmentUrl?.startsWith('data:application/pdf') ||
    invoice.attachmentName?.toLowerCase().endsWith('.pdf');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${invoice.voucherType} #${invoice.invoiceNumber}`}
      subtitle={`Proveedor: ${invoice.supplierName}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Top Status & Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2">
            {invoice.status === 'pagada' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Factura Pagada</span>
              </span>
            ) : isOverdue ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Factura Vencida (hace {Math.abs(diffDays)} días)</span>
              </span>
            ) : isExpiringSoon ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Próxima a Vencer ({diffDays === 0 ? '¡Vence Hoy!' : `en ${diffDays} días`})</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Pendiente (en {diffDays} días)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTogglePaid(invoice)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                invoice.status === 'pagada'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{invoice.status === 'pagada' ? 'Marcar como Pendiente' : 'Marcar como Pagada'}</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(invoice);
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Editar Factura"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer"
                title="Eliminar Factura (Sólo Administrador)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Amount Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Monto del Comprobante
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 block">
              {formatCurrency(invoice.amount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Medio de Pago</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5 block">
              {invoice.paymentMethod || 'No especificado'}
            </span>
            {invoice.paymentDate && (
              <span className="text-[11px] text-emerald-400 block mt-0.5">
                Pagada el {formatDate(invoice.paymentDate)}
              </span>
            )}
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Proveedor:</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{invoice.supplierName}</span>
            {invoice.cuit && <span className="text-slate-400 font-mono text-[11px] block mt-0.5">CUIT: {invoice.cuit}</span>}
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Comprobante:</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{invoice.voucherType}</span>
            <span className="text-slate-300 font-mono text-xs block mt-0.5">#{invoice.invoiceNumber}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Sucursal:</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{formatBranchName(invoice.branchId)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Fecha de Emisión:</span>
            <span className="font-bold text-slate-200 text-sm mt-0.5 block">{formatDate(invoice.issueDate)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Fecha de Vencimiento:</span>
            <span className={`font-bold text-sm mt-0.5 block ${isOverdue ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-slate-200'}`}>
              {formatDate(invoice.dueDate)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Condición:</span>
            <span className="font-bold text-slate-200 text-sm mt-0.5 block">
              {diffDays < 0 ? `Vencida hace ${Math.abs(diffDays)}d` : diffDays === 0 ? 'Vence hoy' : `Faltan ${diffDays} días`}
            </span>
          </div>
        </div>

        {/* Concept */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="font-bold text-slate-400 block mb-1">Concepto / Detalle de Compra:</span>
          <p className="text-slate-200 font-medium">{invoice.concept || 'Sin descripción detallada.'}</p>
        </div>

        {/* Detalle de Conceptos / Ítems */}
        {invoice.items && invoice.items.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-red-400" />
              <span>Desglose de Ítems / Conceptos ({invoice.items.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2 px-1">Código</th>
                    <th className="py-2 px-2">Descripción</th>
                    <th className="py-2 px-1 text-center">Cant.</th>
                    <th className="py-2 px-2 text-right">Costo Unit.</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-1.5 px-1 font-mono text-slate-400 text-[11px]">
                        {it.code || '-'}
                      </td>
                      <td className="py-1.5 px-2 font-medium text-slate-200">
                        {it.description}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono text-slate-300">
                        {it.quantity}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-slate-300">
                        {formatCurrency(it.cost)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-700 font-bold text-xs text-slate-200">
                    <td colSpan={4} className="py-2 px-2 text-right">
                      Total Ítems:
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-emerald-400 font-bold">
                      {formatCurrency(invoice.items.reduce((acc, curr) => acc + (curr.total || 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Observations */}
        {invoice.observations && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <span className="font-bold text-slate-400 block mb-1">Observaciones:</span>
            <p className="text-slate-300">{invoice.observations}</p>
          </div>
        )}

        {/* File Attachment Viewer / Downloader */}
        {invoice.attachmentUrl && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPdf ? (
                  <FileText className="w-5 h-5 text-red-500" />
                ) : (
                  <Image className="w-5 h-5 text-blue-400" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {invoice.attachmentName || 'Comprobante Adjunto'}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Archivo original adjunto de la factura
                  </span>
                </div>
              </div>

              <a
                href={invoice.attachmentUrl}
                download={invoice.attachmentName || `Factura_${invoice.invoiceNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-red-400" />
                <span>Descargar Archivo</span>
              </a>
            </div>

            {/* Inline preview */}
            {!isPdf && (
              <div className="max-h-72 overflow-hidden rounded-xl border border-slate-800 flex justify-center bg-black/40 p-2">
                <img
                  src={invoice.attachmentUrl}
                  alt="Comprobante"
                  className="max-h-64 object-contain rounded"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title="Eliminar Factura"
        message={`¿Estás seguro de que deseas eliminar permanentemente la factura #${invoice.invoiceNumber} de ${invoice.supplierName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Factura"
        cancelText="Cancelar"
        danger={true}
        onConfirm={async () => {
          setIsConfirmDeleteOpen(false);
          onClose();
          await onDelete(invoice.id);
        }}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </Modal>
  );
};
