import html2canvas from 'html2canvas-pro';
import { Budget, CompanySettings } from '../types';
import { formatCurrency, buildWhatsAppLink, formatBudgetWhatsAppMessage } from './formatters';

/**
 * Downloads a Blob or DataURL safely to the client's device as a .jpg file
 */
export function saveJpegLocally(blobOrDataUrl: Blob | string, filename: string): void {
  const safeFilename = filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')
    ? filename
    : `${filename}.jpg`;

  const url = typeof blobOrDataUrl === 'string'
    ? blobOrDataUrl
    : URL.createObjectURL(blobOrDataUrl);

  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
      if (typeof blobOrDataUrl !== 'string') {
        URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    }
  }, 15000);
}

/**
 * Captures an HTML element and converts it to a high-resolution JPEG Blob & DataURL
 */
export async function captureElementToJpeg(
  elementId: string = 'budget-printable-document',
  quality: number = 0.95
): Promise<{ blob: Blob; dataUrl: string }> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Elemento de presupuesto "#${elementId}" no encontrado en el documento.`);
  }

  // Ensure canvas renders clearly with scale 2 and handle any modern CSS colors safely
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc) => {
      try {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (!clonedEl) return;
        // Normalize any oklch color references in computed styles to standard hex/rgba
        const dummyCanvas = clonedDoc.createElement('canvas');
        const ctx = dummyCanvas.getContext('2d');
        if (ctx) {
          const all = clonedEl.querySelectorAll('*');
          const nodes = [clonedEl, ...Array.from(all)] as HTMLElement[];
          for (const node of nodes) {
            if (!node || !node.style) continue;
            const comp = clonedDoc.defaultView?.getComputedStyle(node) || window.getComputedStyle(node);
            const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];
            for (const prop of colorProps) {
              const val = (comp as any)[prop];
              if (typeof val === 'string' && val.includes('oklch')) {
                ctx.fillStyle = '#000000';
                ctx.fillStyle = val;
                (node.style as any)[prop] = ctx.fillStyle;
              }
            }
          }
        }
      } catch (err) {
        // Non-blocking cleanup
      }
    },
  });

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('No se pudo convertir el canvas a formato JPEG'));
      },
      'image/jpeg',
      quality
    );
  });

  return { blob, dataUrl };
}

/**
 * Downloads the budget as a JPEG image to the local device
 */
export async function downloadBudgetJpeg(
  budget: Budget,
  _settings?: CompanySettings,
  elementId: string = 'budget-printable-document'
): Promise<string> {
  const cleanPlate = (budget.licensePlate || 'general').replace(/[^a-zA-Z0-9]/g, '');
  const filename = `Presupuesto_${budget.budgetNumber}_${cleanPlate}.jpg`;

  const { blob } = await captureElementToJpeg(elementId);
  saveJpegLocally(blob, filename);
  return filename;
}

/**
 * Converts budget to JPEG, downloads it locally, and launches WhatsApp with pre-filled message (or native share sheet)
 */
export async function sendBudgetJpegWhatsApp(
  budget: Budget,
  settings?: CompanySettings,
  elementId: string = 'budget-printable-document'
): Promise<{ sharedNatively: boolean; waUrl: string; filename: string }> {
  const cleanPlate = (budget.licensePlate || 'general').replace(/[^a-zA-Z0-9]/g, '');
  const filename = `Presupuesto_${budget.budgetNumber}_${cleanPlate}.jpg`;

  // 1. Capture element to high-res JPEG
  const { blob } = await captureElementToJpeg(elementId);

  // 2. Trigger automatic local download so user has the JPEG image ready
  saveJpegLocally(blob, filename);

  // 3. Prepare message text using company template
  const message = formatBudgetWhatsAppMessage(budget, settings, 'jpeg');

  const phone = budget.clientWhatsapp || budget.clientPhone || '';
  const waUrl = buildWhatsAppLink(phone, message);

  // 4. Try native Web Share API (on mobile, this shares the actual JPEG file directly into WhatsApp!)
  try {
    const imageFile = new File([blob], filename, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      await navigator.share({
        title: `Presupuesto #${budget.budgetNumber} - ${settings?.companyName || 'Lubricentro 2.0'}`,
        text: message,
        files: [imageFile],
      });
      return { sharedNatively: true, waUrl, filename };
    }
  } catch (shareErr: any) {
    if (shareErr.name === 'AbortError') {
      return { sharedNatively: true, waUrl, filename };
    }
    console.warn('Native image share fallback to link:', shareErr);
  }

  // 5. Open WhatsApp
  if (waUrl) {
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Ignored if popup blocked
    }
  }

  return { sharedNatively: false, waUrl, filename };
}
