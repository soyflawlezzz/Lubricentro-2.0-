import jsPDF from 'jspdf';
import { Budget, Sale, CompanySettings } from '../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatBranchName,
  buildWhatsAppLink,
  formatBudgetWhatsAppMessage,
} from './formatters';

/**
 * Downloads a generated jsPDF document safely to the client device
 */
export function savePdfLocally(doc: jsPDF, filename: string): void {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  try {
    doc.save(safeFilename);
  } catch (err) {
    console.warn('doc.save failed, using blob download fallback:', err);
    try {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }, 15000);
    } catch (blobErr) {
      console.error('Blob download also failed:', blobErr);
    }
  }
}

/**
 * Generates a clean, professional vector PDF for a Budget
 */
function hexToRgb(hex: string | undefined, defaultRgb: [number, number, number] = [220, 38, 38]): [number, number, number] {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return defaultRgb;
  const num = parseInt(hex.slice(1), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Generates a clean, professional vector PDF for a Budget
 */
export function generateBudgetPdf(budget: Budget, settings?: CompanySettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const fmt = {
    headerTitle: settings?.budgetFormat?.headerTitle || 'PRESUPUESTO DE SERVICIO',
    headerSubtitle: settings?.budgetFormat?.headerSubtitle || 'Lubricentro & Mecánica Automotor',
    headerCustomText: settings?.budgetFormat?.headerCustomText || '',
    headerLogoPosition: settings?.budgetFormat?.headerLogoPosition || 'left',
    showBranchAddresses: settings?.budgetFormat?.showBranchAddresses ?? true,
    accentColor: settings?.budgetFormat?.accentColor || '#DC2626',
    templateStyle: settings?.budgetFormat?.templateStyle || 'modern_card',
    validityDaysText: settings?.budgetFormat?.validityDaysText || 'Presupuesto válido por 10 días a partir de la fecha de emisión.',
    footerNotes: settings?.budgetFormat?.footerNotes || 'Precios sujetos a variación según disponibilidad de repuestos e insumos al momento de ejecutar el trabajo.',
    customTerms: settings?.budgetFormat?.customTerms || 'Trabajos de mano de obra y repuestos garantizados según especificaciones técnicas de fábrica.',
    showSignatureBlock: settings?.budgetFormat?.showSignatureBlock ?? true,
    showItemCode: settings?.budgetFormat?.showItemCode ?? true,
    showItemCategory: settings?.budgetFormat?.showItemCategory ?? true,
    showUnitPrices: settings?.budgetFormat?.showUnitPrices ?? true,
    showVehicleKm: settings?.budgetFormat?.showVehicleKm ?? true,
  };

  const [accentR, accentG, accentB] = hexToRgb(fmt.accentColor, [220, 38, 38]);

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Top Accent Line
  doc.setFillColor(accentR, accentG, accentB);
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  // Logo (if available)
  let textStartX = margin;
  const showLogo = fmt.headerLogoPosition !== 'hidden' && settings?.logoUrl && settings.logoUrl.startsWith('data:image');

  if (showLogo && fmt.headerLogoPosition === 'left') {
    try {
      doc.addImage(settings.logoUrl!, margin, 8, 16, 16);
      textStartX = margin + 20;
    } catch {
      textStartX = margin;
    }
  } else if (showLogo && fmt.headerLogoPosition === 'right') {
    try {
      doc.addImage(settings.logoUrl!, pageWidth - margin - 20, 8, 20, 16);
    } catch {
      // ignore
    }
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const companyTitle = settings?.companyName || 'LUBRICENTRO 2.0';
  doc.text(companyTitle, textStartX, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(accentR, accentG, accentB);
  doc.text(fmt.headerTitle.toUpperCase(), textStartX, 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(fmt.headerSubtitle || settings?.commercialInfo || 'Lubricentro & Mecánica Automotor', textStartX, 23.5);

  if (fmt.showBranchAddresses) {
    doc.setFontSize(7.5);
    const addrEscobar = settings?.addressEscobar ? `• ${settings.addressEscobar}` : 'Sucursal: Estrada 1355, Belén de Escobar';
    const addrMaschwitz = settings?.addressMaschwitz ? `• ${settings.addressMaschwitz}` : 'Colectora Oeste 1439, Ing. Maschwitz.';
    doc.text(`${addrEscobar}  ${addrMaschwitz}`, textStartX, 27.5);
  }

  if (fmt.headerCustomText) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(fmt.headerCustomText, textStartX, 31);
  }

  // Budget Number and Date Card (Top-Right)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(128, 8, 68, 24, 2, 2, 'FD');

  doc.setFillColor(accentR, accentG, accentB);
  doc.rect(128, 8, 68, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`PRESUPUESTO #${budget.budgetNumber}`, 162, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha: ${formatDate(budget.createdAt)}`, 162, 21, { align: 'center' });
  doc.text(`Estado: ${budget.status === 'convertido_ot' ? 'Convertido en OT' : 'Presupuesto Pendiente'}`, 162, 26, { align: 'center' });

  // Client & Vehicle Data Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 36, contentWidth, 26, 2, 2, 'FD');

  // Client column (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DATOS DEL CLIENTE', margin + 4, 41.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(budget.clientName || 'Cliente Particular', margin + 4, 47.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const clientPhone = budget.clientWhatsapp || budget.clientPhone || 'No registrado';
  doc.text(`Tel / WhatsApp: ${clientPhone}`, margin + 4, 53);

  // Vehicle column (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DATOS DEL VEHÍCULO', margin + 95, 41.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const vehicleText = `${budget.vehicleBrand || ''} ${budget.vehicleModel || ''}`.trim() || 'Vehículo';
  doc.text(vehicleText, margin + 95, 47.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(accentR, accentG, accentB);
  doc.text(`Patente: ${budget.licensePlate || '-'}`, margin + 95, 53);

  if (budget.vehicleYear) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Año: ${budget.vehicleYear}`, margin + 145, 53);
  }

  // Table Header
  let currY = 66;
  doc.setFillColor(accentR, accentG, accentB);
  doc.rect(margin, currY, contentWidth, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Cant.', margin + 4, currY + 5);

  if (fmt.showItemCode) {
    doc.text('Código', margin + 18, currY + 5);
    doc.text('Descripción del Trabajo o Repuesto', margin + 42, currY + 5);
  } else {
    doc.text('Descripción del Trabajo o Repuesto', margin + 18, currY + 5);
  }

  if (fmt.showUnitPrices) {
    doc.text('P. Unitario', margin + 138, currY + 5, { align: 'right' });
  }
  doc.text('Total', margin + contentWidth - 4, currY + 5, { align: 'right' });

  currY += 7.5;

  // Table Body Rows
  const items = budget.items || [];
  items.forEach((item, index) => {
    // Check page overflow
    if (currY > pageHeight - 65) {
      doc.addPage();
      currY = 20;
    }

    // Row alternating background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currY, contentWidth, 7, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.quantity), margin + 4, currY + 4.8);

    let descX = margin + 18;
    if (fmt.showItemCode) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.code || '-', margin + 18, currY + 4.8);
      descX = margin + 42;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const descWidth = fmt.showUnitPrices ? 90 : 120;
    const descLines = doc.splitTextToSize(item.description, descWidth);
    doc.text(descLines, descX, currY + 4.8);

    if (fmt.showUnitPrices) {
      doc.setTextColor(71, 85, 105);
      doc.text(formatCurrency(item.unitPrice), margin + 138, currY + 4.8, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(item.total), margin + contentWidth - 4, currY + 4.8, { align: 'right' });

    const rowHeight = Math.max(7, descLines.length * 4 + 2);
    currY += rowHeight;
  });

  // Table footer line
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currY, margin + contentWidth, currY);
  currY += 4;

  // Totals Area (Right aligned)
  if (budget.laborCost && budget.laborCost > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Mano de Obra:', margin + 138, currY + 3.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(budget.laborCost), margin + contentWidth - 4, currY + 3.5, { align: 'right' });
    currY += 6;
  }

  if (budget.subtotal && budget.subtotal !== budget.total) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal:', margin + 138, currY + 3.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(budget.subtotal), margin + contentWidth - 4, currY + 3.5, { align: 'right' });
    currY += 6;
  }

  // TOTAL Box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(accentR, accentG, accentB);
  doc.roundedRect(margin + 90, currY, contentWidth - 90, 11, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL:', margin + 95, currY + 7.5);

  doc.setFontSize(12);
  doc.setTextColor(accentR, accentG, accentB);
  doc.text(formatCurrency(budget.total), margin + contentWidth - 5, currY + 7.5, { align: 'right' });

  currY += 16;

  // Observations (if any)
  if (budget.observations && budget.observations.trim()) {
    if (currY > pageHeight - 50) {
      doc.addPage();
      currY = 20;
    }
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const obsLines = doc.splitTextToSize(budget.observations, contentWidth - 8);
    const obsHeight = Math.max(14, obsLines.length * 4 + 8);
    doc.roundedRect(margin, currY, contentWidth, obsHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('OBSERVACIONES / DETALLES:', margin + 4, currY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(obsLines, margin + 4, currY + 9.5);

    currY += obsHeight + 5;
  }

  // Custom Terms & Notes
  if (fmt.footerNotes || fmt.customTerms) {
    if (currY > pageHeight - 45) {
      doc.addPage();
      currY = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    if (fmt.footerNotes) {
      const noteLines = doc.splitTextToSize(`Nota: ${fmt.footerNotes}`, contentWidth);
      doc.text(noteLines, margin, currY);
      currY += noteLines.length * 3.5 + 2;
    }

    if (fmt.customTerms) {
      const termLines = doc.splitTextToSize(`Condiciones: ${fmt.customTerms}`, contentWidth);
      doc.text(termLines, margin, currY);
      currY += termLines.length * 3.5 + 2;
    }
  }

  // Signature Block
  if (fmt.showSignatureBlock) {
    if (currY > pageHeight - 30) {
      doc.addPage();
      currY = 20;
    }
    const sigX = margin + contentWidth - 65;
    doc.setDrawColor(148, 163, 184);
    doc.line(sigX, currY + 12, sigX + 60, currY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Firma y Aclaración de Conformidad', sigX + 30, currY + 16, { align: 'center' });
  }

  // Bottom Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(fmt.validityDaysText, pageWidth / 2, 282, { align: 'center' });
  const footerBranch = `${settings?.companyName || 'Lubricentro 2.0'} • ${settings?.addressEscobar || 'Estrada 1355, Belén de Escobar'} • ${settings?.addressMaschwitz || 'Colectora Oeste 1439, Ing. Maschwitz'}`;
  doc.text(footerBranch, pageWidth / 2, 287, { align: 'center' });

  return doc;
}

/**
 * Downloads a budget PDF independently
 */
export function downloadBudgetPdf(budget: Budget, settings?: CompanySettings): string {
  const doc = generateBudgetPdf(budget, settings);
  const cleanPlate = (budget.licensePlate || 'general').replace(/[^a-zA-Z0-9]/g, '');
  const filename = `Presupuesto_${budget.budgetNumber}_${cleanPlate}.pdf`;
  savePdfLocally(doc, filename);
  return filename;
}

/**
 * Sends a budget via WhatsApp and independently downloads the PDF
 */
export async function sendBudgetWhatsApp(
  budget: Budget,
  settings?: CompanySettings
): Promise<{ sharedNatively: boolean; waUrl: string; filename: string }> {
  const doc = generateBudgetPdf(budget, settings);
  const cleanPlate = (budget.licensePlate || 'general').replace(/[^a-zA-Z0-9]/g, '');
  const filename = `Presupuesto_${budget.budgetNumber}_${cleanPlate}.pdf`;

  // 1. Independent PDF download triggered immediately
  savePdfLocally(doc, filename);

  // 2. Build message & link using company template
  const message = formatBudgetWhatsAppMessage(budget, settings, 'pdf');

  const phone = budget.clientWhatsapp || budget.clientPhone || '';
  const waUrl = buildWhatsAppLink(phone, message);

  // 3. Check Web Share API (mobile devices with native WhatsApp app)
  try {
    const blob = doc.output('blob');
    const pdfFile = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        title: `Presupuesto #${budget.budgetNumber} - Lubricentro 2.0`,
        text: message,
        files: [pdfFile],
      });
      return { sharedNatively: true, waUrl, filename };
    }
  } catch (shareErr: any) {
    if (shareErr.name === 'AbortError') {
      return { sharedNatively: true, waUrl, filename };
    }
    console.warn('Native share error, falling back to WhatsApp link:', shareErr);
  }

  // 4. Open WhatsApp Web / App
  if (waUrl) {
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('window.open blocked:', e);
    }
  }

  return { sharedNatively: false, waUrl, filename };
}

/**
 * Generates a clean vector PDF for a Sale Remito
 */
export function generateSalePdf(sale: Sale, settings?: CompanySettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Red accent line
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  // Logo (if available)
  let textStartX = margin;
  if (settings?.logoUrl && settings.logoUrl.startsWith('data:image')) {
    try {
      doc.addImage(settings.logoUrl, margin, 8, 16, 16);
      textStartX = margin + 20;
    } catch {
      textStartX = margin;
    }
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const companyTitle = settings?.companyName || 'LUBRICENTRO 2.0';
  doc.text(companyTitle, textStartX, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(settings?.commercialInfo || 'Remito Comercial de Entrega de Repuestos & Servicios', textStartX, 22);

  const branchAddress =
    sale.branchId === 'escobar'
      ? settings?.addressEscobar || 'Av. 25 de Mayo 1420, Belén de Escobar'
      : settings?.addressMaschwitz || 'Colectora Este 2850, Ing. Maschwitz';
  doc.text(`Sucursal: ${formatBranchName(sale.branchId)} • ${branchAddress}`, textStartX, 27.5);

  // Remito Card (Top Right)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(128, 10, 68, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`REMITO #${sale.saleNumber}`, 162, 16.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha: ${formatDateTime(sale.createdAt)}`, 162, 22, { align: 'center' });
  doc.text(`Pago: ${sale.paymentMethod || 'Efectivo'}`, 162, 27, { align: 'center' });

  // Client info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 35, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('CLIENTE:', margin + 4, 41);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(sale.clientName || 'Consumidor Final', margin + 4, 47.5);

  if (sale.clientPhone) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Teléfono: ${sale.clientPhone}`, margin + 95, 47.5);
  }

  // Items table
  let currY = 59;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, currY, contentWidth, 7.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Cant.', margin + 4, currY + 5);
  doc.text('Código', margin + 18, currY + 5);
  doc.text('Descripción del Artículo / Servicio', margin + 42, currY + 5);
  doc.text('P. Unitario', margin + 138, currY + 5, { align: 'right' });
  doc.text('Total', margin + contentWidth - 4, currY + 5, { align: 'right' });

  currY += 7.5;

  const items = sale.items || [];
  items.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currY, contentWidth, 7, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.quantity), margin + 4, currY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.code || '-', margin + 18, currY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const descLines = doc.splitTextToSize(item.name || '', 88);
    doc.text(descLines, margin + 42, currY + 4.8);

    doc.setTextColor(71, 85, 105);
    doc.text(formatCurrency(item.unitPrice), margin + 138, currY + 4.8, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(item.total), margin + contentWidth - 4, currY + 4.8, { align: 'right' });

    currY += Math.max(7, descLines.length * 4 + 2);
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currY, margin + contentWidth, currY);
  currY += 6;

  // TOTAL Box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(margin + 90, currY, contentWidth - 90, 11, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL:', margin + 95, currY + 7.5);

  doc.setFontSize(12);
  doc.setTextColor(220, 38, 38);
  doc.text(formatCurrency(sale.total), margin + contentWidth - 5, currY + 7.5, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento no válido como factura. Comprobante interno de entrega comercial.', pageWidth / 2, 282, { align: 'center' });
  doc.text('Lubricentro 2.0 • Belén de Escobar • Ing. Maschwitz', pageWidth / 2, 287, { align: 'center' });

  return doc;
}

/**
 * Downloads a sale Remito PDF independently
 */
export function downloadSalePdf(sale: Sale, settings?: CompanySettings): string {
  const doc = generateSalePdf(sale, settings);
  const filename = `Remito_${sale.saleNumber}.pdf`;
  savePdfLocally(doc, filename);
  return filename;
}

/**
 * Sends a sale remito via WhatsApp and independently downloads the PDF
 */
export async function sendSaleWhatsApp(
  sale: Sale,
  settings?: CompanySettings
): Promise<{ sharedNatively: boolean; waUrl: string; filename: string }> {
  const doc = generateSalePdf(sale, settings);
  const filename = `Remito_${sale.saleNumber}.pdf`;

  savePdfLocally(doc, filename);

  const message = `Hola ${sale.clientName || 'Cliente'}, te enviamos el comprobante de remito #${sale.saleNumber} de Lubricentro 2.0 (Sucursal ${formatBranchName(sale.branchId)}) por un total de ${formatCurrency(sale.total)}.\n\n📄 Te adjuntamos el archivo PDF con el detalle de artículos entregados. ¡Muchas gracias!`;
  const waUrl = buildWhatsAppLink(sale.clientPhone || '', message);

  try {
    const blob = doc.output('blob');
    const pdfFile = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        title: `Remito #${sale.saleNumber} - Lubricentro 2.0`,
        text: message,
        files: [pdfFile],
      });
      return { sharedNatively: true, waUrl, filename };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { sharedNatively: true, waUrl, filename };
    }
  }

  if (waUrl) {
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('window.open blocked:', e);
    }
  }

  return { sharedNatively: false, waUrl, filename };
}

/**
 * Generic fallback helpers maintained for backward compatibility
 */
export async function generatePdfBlob(elementId: string): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  doc.text('Documento Lubricentro 2.0', 14, 20);
  return doc.output('blob');
}

export async function downloadPdf(elementId: string, filename: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  doc.text('Documento Lubricentro 2.0', 14, 20);
  savePdfLocally(doc, filename);
}

export async function shareOrSendPdfWhatsApp(
  elementId: string,
  filename: string,
  phoneNumber: string,
  message: string
): Promise<{ sharedNatively: boolean }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  doc.text('Documento Lubricentro 2.0', 14, 20);
  savePdfLocally(doc, filename);

  const waUrl = buildWhatsAppLink(phoneNumber, message);
  if (waUrl) {
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('window.open blocked:', e);
    }
  }
  return { sharedNatively: false };
}
