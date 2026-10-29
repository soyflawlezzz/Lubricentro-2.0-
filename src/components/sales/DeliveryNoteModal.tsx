import React, { useState } from 'react';
import { Sale, CompanySettings } from '../../types';
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  formatBranchName,
} from '../../utils/formatters';
import { Printer, Download, X, Fuel, MessageCircle, Loader2, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { downloadSalePdf, sendSaleWhatsApp } from '../../utils/pdfGenerator';
import { CheckCircle2, ExternalLink } from 'lucide-react';

interface DeliveryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings?: CompanySettings;
}

export const DeliveryNoteModal: React.FC<DeliveryNoteModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [directWaUrl, setDirectWaUrl] = useState<string | null>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    setFeedbackMsg(null);
    try {
      const filename = downloadSalePdf(sale, settings);
      setFeedbackMsg(`✓ Remito PDF descargado: ${filename}`);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      console.error(err);
      setFeedbackMsg('Error al generar el archivo PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendPdfWhatsApp = async () => {
    setIsGeneratingPdf(true);
    setFeedbackMsg(null);
    setDirectWaUrl(null);
    try {
      const result = await sendSaleWhatsApp(sale, settings);
      if (result.waUrl) {
        setDirectWaUrl(result.waUrl);
      }
      setFeedbackMsg(`✓ PDF "${result.filename}" descargado. Abriendo WhatsApp...`);
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err) {
      console.error(err);
      downloadSalePdf(sale, settings);
      setFeedbackMsg('Se descargó el PDF en tu dispositivo.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const branchAddress =
    sale.branchId === 'escobar'
      ? settings?.addressEscobar || 'Av. 25 de Mayo 1420, Belén de Escobar'
      : settings?.addressMaschwitz || 'Colectora Este 2850, Ing. Maschwitz';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remito Comercial de Venta"
      subtitle={`Comprobante #${sale.saleNumber}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="text-xs text-slate-400 font-medium">
            Comprobante de entrega comercial
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendPdfWhatsApp}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              title="Genera el archivo PDF y abre WhatsApp"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4 text-white" />
              )}
              <span>Enviar PDF por WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            {directWaUrl && (
              <a
                href={directWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir chat de WhatsApp</span>
              </a>
            )}
          </div>
        )}

        {/* Printable Remito Document (White background, professional styling) */}
        <div
          id="remito-document"
          className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-300 font-sans print:m-0 print:p-0 print:border-none print:shadow-none"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-900 gap-4">
            <div className="flex items-center gap-4">
              <img
                src={settings?.logoUrl || '/lubricentro-original-logo.png'}
                alt={settings?.companyName || 'Lubricentro 2.0'}
                className="h-14 sm:h-16 w-auto max-w-[210px] object-contain drop-shadow-sm select-none"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                  {settings?.companyName ? (
                    settings.companyName
                  ) : (
                    <>
                      LUBRICENTRO <span className="text-red-600">2.0</span>
                    </>
                  )}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {settings?.commercialInfo || 'Lubricación Integral y Taller Mecánico Especializado'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Sucursal {formatBranchName(sale.branchId)} &bull; {branchAddress}
                </p>
              </div>
            </div>

            {/* Document details box */}
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 sm:text-right w-full sm:w-auto">
              <div className="text-[11px] font-bold tracking-widest uppercase text-red-600">
                DOCUMENTO NO VÁLIDO COMO FACTURA
              </div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                REMITO #{sale.saleNumber}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Fecha: <strong>{formatDateTime(sale.createdAt)}</strong>
              </div>
              <div className="text-xs text-slate-600">
                Operador: <strong>{sale.createdBy || 'Caja'}</strong>
              </div>
            </div>
          </div>

          {/* Client Info (if present) */}
          <div className="py-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 text-xs gap-2">
            <div>
              <span className="text-slate-500 block">Cliente:</span>
              <span className="font-bold text-slate-900 text-sm">
                {sale.clientName || 'Consumidor Final (Mostrador)'}
              </span>
            </div>
            {sale.clientPhone && (
              <div>
                <span className="text-slate-500 block">Contacto:</span>
                <span className="font-medium text-slate-800">{sale.clientPhone}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-2 px-1">Cant.</th>
                  <th className="py-2 px-2">Código</th>
                  <th className="py-2 px-2">Descripción del Producto</th>
                  <th className="py-2 px-2 text-right">P. Unitario</th>
                  <th className="py-2 px-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="text-slate-800">
                    <td className="py-2.5 px-1 font-bold text-slate-950 font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-500">
                      {item.code || '-'}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-1 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment Info */}
          <div className="pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-xs text-slate-600">
              <div>
                Medio de Pago: <strong className="text-slate-900">{sale.paymentMethod}</strong>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Garantía y cambio con presentación de este remito.
              </div>
            </div>

            <div className="text-right w-full sm:w-auto bg-slate-100 sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <span className="text-xs font-bold text-slate-600 uppercase block">
                Total General
              </span>
              <span className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
                {formatCurrency(sale.total)}
              </span>
            </div>
          </div>

          {/* Signature / Bottom Disclaimer */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-300 flex justify-between items-end text-[10px] text-slate-400">
            <div>
              <span>Lubricentro 2.0 &bull; Sistema de Gestión Centralizado</span>
            </div>
            <div className="text-center w-40 border-t border-slate-400 pt-1">
              <span>Firma / Aclaración Receptor</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
