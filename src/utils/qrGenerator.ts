import QRCode from 'qrcode';

export interface QrOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Generates a high-contrast base64 Data URL for a given string (e.g. passport link).
 */
export async function generateQrDataUrl(
  text: string,
  options?: QrOptions
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 360,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Builds the canonical public URL for a vehicle's digital passport.
 */
export function getVehiclePassportUrl(licensePlate: string): string {
  const cleanPlate = (licensePlate || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (typeof window === 'undefined') {
    return `https://lubricentro20.com/?passport=${cleanPlate}`;
  }
  const url = new URL(window.location.href);
  url.search = `?passport=${encodeURIComponent(cleanPlate)}`;
  url.hash = '';
  return url.toString();
}
