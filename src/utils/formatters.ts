export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$ 0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (isoString: string | undefined): string => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
};

export const formatDateTime = (isoString: string | undefined): string => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
};

export const formatPlate = (plate: string | undefined): string => {
  if (!plate) return '';
  return plate.trim().toUpperCase();
};

export const formatBranchName = (branchId: string | undefined): string => {
  if (branchId === 'escobar') return 'Escobar';
  if (branchId === 'maschwitz') return 'Ing. Maschwitz';
  if (branchId === 'todas') return 'Todas las Sucursales';
  return branchId || '-';
};

/**
 * Normalizes Argentine telephone numbers and builds WhatsApp click-to-chat links
 */
export const buildWhatsAppLink = (phone: string, text: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';

  // If local Argentine number (e.g. 11 1234-5678 or 011...)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (!cleaned.startsWith('54')) {
    cleaned = '549' + cleaned;
  } else if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
    cleaned = '549' + cleaned.substring(2);
  }

  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleaned}?text=${encodedText}`;
};

/**
 * Formats WhatsApp message for budgets using company template or default
 */
export const formatBudgetWhatsAppMessage = (
  budget: {
    budgetNumber?: string;
    clientName?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    licensePlate?: string;
    total?: number;
    branchId?: string;
  },
  settings?: {
    companyName?: string;
    whatsappBudgetTemplate?: string;
  },
  format: 'pdf' | 'jpeg' = 'pdf'
): string => {
  const client = budget.clientName || 'Cliente';
  const vehicle = `${budget.vehicleBrand || ''} ${budget.vehicleModel || ''}`.trim() || 'Vehículo';
  const plate = budget.licensePlate || '-';
  const totalStr = formatCurrency(budget.total);
  const branch = formatBranchName(budget.branchId);
  const num = budget.budgetNumber || '';
  const company = settings?.companyName || 'Lubricentro 2.0';

  const defaultTemplate = `¡Hola {cliente}! Te adjuntamos el presupuesto #{numero} de *{empresa}* para tu vehículo {vehiculo} (Patente: {patente}) por un total de {total}.\n\n{adjunto}\n\n¿Querés que reservemos tu turno para realizar el trabajo?`;

  const template = settings?.whatsappBudgetTemplate && settings.whatsappBudgetTemplate.trim()
    ? settings.whatsappBudgetTemplate
    : defaultTemplate;

  const attachmentNote = format === 'jpeg'
    ? '🖼️ Te adjuntamos la imagen JPEG del presupuesto.'
    : '📄 Te adjuntamos el archivo PDF del presupuesto.';

  let msg = template
    .replaceAll('${total}', totalStr)
    .replaceAll('{total}', totalStr)
    .replaceAll('{nombre}', client)
    .replaceAll('{cliente}', client)
    .replaceAll('{auto}', vehicle)
    .replaceAll('{vehiculo}', vehicle)
    .replaceAll('{dominio}', plate)
    .replaceAll('{patente}', plate)
    .replaceAll('{sucursal}', branch)
    .replaceAll('{numero}', num)
    .replaceAll('{empresa}', company);

  if (msg.includes('{adjunto}')) {
    msg = msg.replaceAll('{adjunto}', attachmentNote);
  } else {
    // If the template didn't have {adjunto}, append a clean file attachment notice
    msg = `${msg}\n\n${attachmentNote}`;
  }

  return msg;
};
