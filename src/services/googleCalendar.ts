import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { ServiceAppointment, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initGoogleCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInGoogleCalendar = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Calendar.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Calendar login error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleCalendarAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const signOutGoogleCalendar = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Syncs a single Service Appointment to Google Calendar
 */
export const syncAppointmentToGoogleCalendar = async (
  appointment: ServiceAppointment,
  accessToken: string
) => {
  const startDateTime = `${appointment.date}T${appointment.time || '09:00'}:00`;
  const [hours, mins] = (appointment.time || '09:00').split(':').map(Number);
  const endHour = (isNaN(hours) ? 10 : (hours + 1)).toString().padStart(2, '0');
  const endMin = (isNaN(mins) ? 0 : mins).toString().padStart(2, '0');
  const endDateTime = `${appointment.date}T${endHour}:${endMin}:00`;

  const event = {
    summary: `🚗 Turno Service: ${appointment.clientName} (${appointment.licensePlate || 'Sin patente'})`,
    description: `🔧 Servicio: ${appointment.serviceType}\n🚗 Vehículo: ${appointment.vehicleBrand || ''} ${appointment.vehicleModel || ''} (${appointment.vehicleYear || ''})\n👤 Cliente: ${appointment.clientName}\n📞 Tel / WA: ${appointment.clientWhatsapp || appointment.clientPhone || 'No registrado'}\n📍 Sucursal: ${appointment.branchId}\n📝 Notas: ${appointment.notes || 'Sin observaciones'}\n\nGenerado automáticamente desde Lubricentro 2.0`,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    colorId: '11', // Red/Crimson color in Google Calendar
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error al sincronizar el turno con Google Calendar');
  }

  return await res.json();
};

/**
 * Syncs a single Invoice Due Date (Vencimiento de Factura) to Google Calendar
 */
export const syncInvoiceToGoogleCalendar = async (
  invoice: Invoice,
  accessToken: string
) => {
  if (!invoice.dueDate) return null;

  const startDateTime = `${invoice.dueDate}T09:00:00`;
  const endDateTime = `${invoice.dueDate}T10:00:00`;

  const totalStr = formatCurrency(invoice.amount);
  const event = {
    summary: `💳 Vencimiento Factura: ${invoice.supplierName || 'Proveedor'} (${totalStr})`,
    description: `📄 Comprobante: ${invoice.voucherType || 'Factura'} #${invoice.invoiceNumber || '-'}\n🏢 Proveedor: ${invoice.supplierName || '-'}\n💰 Total: ${totalStr}\n📌 Estado: ${invoice.status.toUpperCase()}\n📅 Fecha Vencimiento: ${formatDate(invoice.dueDate)}\n📝 Observaciones: ${invoice.observations || 'Sin observaciones'}\n\nRegistrado automáticamente desde Lubricentro 2.0`,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    colorId: invoice.status === 'pagada' ? '10' : '5', // Green if paid, Yellow/Gold if pending
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error al sincronizar el vencimiento con Google Calendar');
  }

  return await res.json();
};

/**
 * Fetches events from primary Google Calendar for a date range
 */
export const fetchGoogleCalendarEvents = async (
  accessToken: string,
  timeMinIso?: string,
  timeMaxIso?: string
) => {
  const params = new URLSearchParams();
  if (timeMinIso) params.append('timeMin', timeMinIso);
  if (timeMaxIso) params.append('timeMax', timeMaxIso);
  params.append('singleEvents', 'true');
  params.append('orderBy', 'startTime');

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'No se pudieron consultar los eventos de Google Calendar');
  }

  const data = await res.json();
  return data.items || [];
};
