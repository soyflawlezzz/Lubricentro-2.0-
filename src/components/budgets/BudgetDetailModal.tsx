import React, { useState } from 'react';
import { Budget, CompanySettings } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatBranchName,
} from '../../utils/formatters';
import {
  Printer,
  MessageCircle,
  ArrowRightCircle,
  Fuel,
  Download,
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { downloadBudgetPdf, sendBudgetWhatsApp } from '../../utils/pdfGenerator';
import { downloadBudgetJpeg, sendBudgetJpegWhatsApp } from '../../utils/jpegGenerator';

interface BudgetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
  onConvertToWorkOrder: (budget: Budget) => void;
  settings?: CompanySettings;
}

export const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  isOpen,
  onClose,
  budget,
  onConvertToWorkOrder,
  settings,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingJpeg, setIsGeneratingJpeg] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [directWaUrl, setDirectWaUrl] = useState<string | null>(null);

  if (!budget) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    setFeedbackMsg(null);
    try {
      const filename = downloadBudgetPdf(budget, settings);
      setFeedbackMsg(`✓ Archivo PDF descargado correctamente: ${filename}`);
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: any) {
      console.error('Error al descargar PDF:', err);
      setFeedbackMsg('Error al descargar el PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendPdfWhatsApp = async () => {
    setIsGeneratingPdf(true);
    setFeedbackMsg(null);
    setDirectWaUrl(null);
    try {
      const res = await sendBudgetWhatsApp(budget, settings);
      if (res.waUrl) {
        setDirectWaUrl(res.waUrl);
      }
      setFeedbackMsg(`✓ PDF "${res.filename}" descargado. Abriendo WhatsApp para enviar al cliente...`);
    } catch (err: any) {
      console.error('Error al enviar WhatsApp:', err);
      // Fallback download if anything failed
      downloadBudgetPdf(budget, settings);
      setFeedbackMsg('Se descargó el PDF en tu dispositivo.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadJpeg = async () => {
    setIsGeneratingJpeg(true);
    setFeedbackMsg(null);
    try {
      const filename = await downloadBudgetJpeg(budget, settings);
      setFeedbackMsg(`✓ Imagen JPEG descargada correctamente: ${filename}`);
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: any) {
      console.error('Error al descargar JPEG:', err);
      setFeedbackMsg('Error al generar la imagen JPEG.');
    } finally {
      setIsGeneratingJpeg(false);
    }
  };

  const handleSendJpegWhatsApp = async () => {
    setIsGeneratingJpeg(true);
    setFeedbackMsg(null);
    setDirectWaUrl(null);
    try {
      const res = await sendBudgetJpegWhatsApp(budget, settings);
      if (res.waUrl) {
        setDirectWaUrl(res.waUrl);
      }
      setFeedbackMsg(`✓ Imagen JPEG "${res.filename}" generada y descargada. Abriendo WhatsApp para enviar al cliente...`);
    } catch (err: any) {
      console.error('Error al enviar JPEG por WhatsApp:', err);
      setFeedbackMsg('Error al compartir la imagen JPEG por WhatsApp.');
    } finally {
      setIsGeneratingJpeg(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Presupuesto #${budget.budgetNumber}`}
      subtitle={`Sucursal ${formatBranchName(budget.branchId)} &bull; ${formatDate(budget.createdAt)}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                budget.status === 'convertido_ot'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {budget.status === 'convertido_ot' ? '✓ Convertido en OT' : 'Presupuesto Pendiente'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp PDF Button */}
            <button
              onClick={handleSendPdfWhatsApp}
              disabled={isGeneratingPdf || isGeneratingJpeg}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              title="Genera el archivo PDF y abre WhatsApp para enviarlo al cliente"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4 text-white" />
              )}
              <span>Enviar PDF por WhatsApp</span>
            </button>

            {/* WhatsApp JPEG Button (New requested feature) */}
            <button
              onClick={handleSendJpegWhatsApp}
              disabled={isGeneratingPdf || isGeneratingJpeg}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-950/40 cursor-pointer disabled:opacity-50"
              title="Genera una imagen JPEG del presupuesto y abre WhatsApp para enviarla al cliente"
            >
              {isGeneratingJpeg ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4 text-white" />
              )}
              <span>Enviar JPEG por WhatsApp</span>
            </button>

            {/* Download JPEG button */}
            <button
              onClick={handleDownloadJpeg}
              disabled={isGeneratingPdf || isGeneratingJpeg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Descargar imagen JPEG de alta resolución al dispositivo"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>Descargar JPEG</span>
            </button>

            {/* Download PDF button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isGeneratingJpeg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Descargar archivo PDF al dispositivo"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Descargar PDF</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {/* Convert to OT */}
            {budget.status !== 'convertido_ot' && (
              <button
                onClick={() => onConvertToWorkOrder(budget)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer"
              >
                <ArrowRightCircle className="w-4 h-4" />
                <span>Convertir a OT</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback message banner */}
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

        {/* Printable Sheet */}
        <div
          id="budget-printable-document"
          className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-300 font-sans print:m-0 print:p-0 print:border-none print:shadow-none"
        >
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
            <div className="flex items-center gap-4">
              <img
                src={settings?.logoUrl || '/lubricentro-logo.svg'}
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
                <p className="text-xs text-slate-700 font-bold">
                  {settings?.commercialInfo || 'Lubricentro & Mecánica Automotor'}
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  {settings?.addressEscobar ? `• ${settings.addressEscobar}` : 'Sucursal: • Estrada 1355, Belén de Escobar'}
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  {settings?.addressMaschwitz ? `• ${settings.addressMaschwitz}` : 'Colectora Oeste 1439, Ing. Maschwitz.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 text-right">
              <div className="text-base sm:text-lg font-black text-slate-900">
                PRESUPUESTO #{budget.budgetNumber}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Fecha: <strong>{formatDate(budget.createdAt)}</strong>
              </div>
            </div>
          </div>

          {/* Client & Vehicle */}
          <div className="py-4 border-b border-slate-200 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Cliente:</span>
              <span className="font-bold text-slate-900 text-sm">{budget.clientName}</span>
              <span className="text-slate-600 block mt-0.5">Tel: {budget.clientPhone}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Vehículo:</span>
              <span className="font-bold text-slate-900 text-sm">
                {budget.vehicleBrand} {budget.vehicleModel}
              </span>
              <span className="font-mono font-bold text-red-600 block mt-0.5">
                Patente: {budget.licensePlate}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="py-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-2 px-1">Cant.</th>
                  <th className="py-2 px-2">Código</th>
                  <th className="py-2 px-2">Descripción del Trabajo o Producto</th>
                  <th className="py-2 px-2 text-right">P. Unitario</th>
                  <th className="py-2 px-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {budget.items.map((item, idx) => (
                  <tr key={idx} className="text-slate-800">
                    <td className="py-2 px-1 font-bold text-slate-950 font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-500">
                      {item.code || '-'}
                    </td>
                    <td className="py-2 px-2 font-semibold text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 px-1 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Labor Cost */}
          <div className="pt-4 border-t-2 border-slate-900 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-right">
              {budget.laborCost > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Mano de Obra:</span>
                  <span className="font-mono font-semibold">{formatCurrency(budget.laborCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Trabajos/Repuestos:</span>
                <span className="font-mono font-semibold">{formatCurrency(budget.subtotal)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-300">
                <span>TOTAL:</span>
                <span className="text-red-600 font-mono text-lg">{formatCurrency(budget.total)}</span>
              </div>
            </div>
          </div>

          {budget.observations && (
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-900 block mb-0.5">Observaciones:</span>
              <p>{budget.observations}</p>
            </div>
          )}

          <div className="mt-6 pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 text-center">
            Validez del presupuesto: 15 días corridos. Sujeto a variación de costos de repuestos.
          </div>
        </div>
      </div>
    </Modal>
  );
};
