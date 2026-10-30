import { CompanySettings, WorkOrder, Client, Sale } from '../types';

export interface AdminNotificationPayload {
  type: 'new_ot' | 'new_client' | 'new_sale';
  workOrder?: Partial<WorkOrder>;
  client?: Partial<Client>;
  sale?: Partial<Sale>;
  userName?: string;
  settings?: CompanySettings;
}

/**
 * Formats a clean, high-visibility WhatsApp summary message for Admin control
 */
export function buildAdminNotificationMessage(payload: AdminNotificationPayload): {
  title: string;
  body: string;
  fullMessage: string;
} {
  const { type, workOrder, client, sale, userName = 'Usuario' } = payload;
  const now = new Date().toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let title = '';
  const lines: string[] = [];

  if (type === 'new_ot' && workOrder) {
    title = `📋 NUEVA ORDEN DE TRABAJO #${workOrder.orderNumber || ''}`;
    lines.push(`🚨 *CONTROL OPERATIVO - NUEVA OT*`);
    lines.push(`🆔 *Orden:* #${workOrder.orderNumber || 'S/N'}`);
    lines.push(`👤 *Cliente:* ${workOrder.clientName || 'Cliente'}`);
    lines.push(`📞 *Contacto:* ${workOrder.clientPhone || workOrder.clientWhatsapp || 'No registrado'}`);
    lines.push(`🚗 *Vehículo:* ${workOrder.vehicleBrand || ''} ${workOrder.vehicleModel || ''} (${workOrder.licensePlate || 'S/D'})`);
    if (workOrder.currentKm) {
      lines.push(`📏 *Kilometraje:* ${workOrder.currentKm.toLocaleString()} KM`);
    }
    
    // Services / Products details
    if (workOrder.servicesSelected && workOrder.servicesSelected.length > 0) {
      lines.push(`🔧 *Servicios:* ${workOrder.servicesSelected.join(', ')}`);
    }
    
    if (workOrder.items && workOrder.items.length > 0) {
      const itemsText = workOrder.items
        .map((i) => `• ${i.description} (x${i.quantity})`)
        .slice(0, 5)
        .join('\n');
      lines.push(`🛢️ *Insumos/Productos:* \n${itemsText}`);
    } else if (workOrder.oilBrand) {
      lines.push(`🛢️ *Aceite:* ${workOrder.oilBrand}`);
    }

    if (workOrder.total) {
      lines.push(`💰 *Monto Total:* $${workOrder.total.toLocaleString('es-AR')}`);
    }
    lines.push(`🏢 *Sucursal:* ${workOrder.branchId === 'maschwitz' ? 'Ing. Maschwitz' : 'Belén de Escobar'}`);
    lines.push(`👤 *Cargado por:* ${userName}`);
    lines.push(`⏰ *Fecha/Hora:* ${now}`);
  } else if (type === 'new_client' && client) {
    title = `👤 NUEVO CLIENTE REGISTRADO`;
    lines.push(`🚨 *CONTROL OPERATIVO - NUEVO CLIENTE*`);
    lines.push(`👤 *Nombre:* ${client.fullName || 'Cliente'}`);
    if (client.documentNumber) lines.push(`📄 *DNI/CUIT:* ${client.documentNumber}`);
    lines.push(`📞 *Teléfono:* ${client.phone || 'S/D'}`);
    lines.push(`💬 *WhatsApp:* ${client.whatsapp || 'S/D'}`);
    if (client.address) lines.push(`📍 *Dirección:* ${client.address}`);
    lines.push(`🏢 *Sucursal:* ${client.branchId === 'maschwitz' ? 'Ing. Maschwitz' : 'Belén de Escobar'}`);
    lines.push(`👤 *Cargado por:* ${userName}`);
    lines.push(`⏰ *Fecha/Hora:* ${now}`);
  } else if (type === 'new_sale' && sale) {
    title = `🛒 NUEVA VENTA COMPROBANTE #${sale.saleNumber || ''}`;
    lines.push(`🚨 *CONTROL OPERATIVO - NUEVA VENTA*`);
    lines.push(`🆔 *Comprobante:* #${sale.saleNumber || 'S/N'}`);
    if (sale.clientName) lines.push(`👤 *Cliente:* ${sale.clientName}`);
    
    if (sale.items && sale.items.length > 0) {
      const itemsText = sale.items
        .map((i) => `• ${i.name} (x${i.quantity}) - $${i.total.toLocaleString('es-AR')}`)
        .join('\n');
      lines.push(`📦 *Productos Vendidos:* \n${itemsText}`);
    }
    
    lines.push(`💳 *Medio de Pago:* ${sale.paymentMethod || 'Efectivo'}`);
    lines.push(`💰 *Monto Total:* $${sale.total.toLocaleString('es-AR')}`);
    lines.push(`🏢 *Sucursal:* ${sale.branchId === 'maschwitz' ? 'Ing. Maschwitz' : 'Belén de Escobar'}`);
    lines.push(`👤 *Cargado por:* ${userName}`);
    lines.push(`⏰ *Fecha/Hora:* ${now}`);
  }

  const fullMessage = lines.join('\n');

  return { title, body: fullMessage, fullMessage };
}

/**
 * Dispatches an automatic notification to Admin WhatsApp/Webhook asynchronously without blocking UI
 */
export async function sendAdminNotification(payload: AdminNotificationPayload): Promise<void> {
  const { settings } = payload;
  
  // Check settings toggles
  if (settings) {
    if (payload.type === 'new_ot' && settings.notifyAdminOnOT === false) return;
    if (payload.type === 'new_client' && settings.notifyAdminOnClient === false) return;
    if (payload.type === 'new_sale' && settings.notifyAdminOnSale === false) return;
  }

  const { title, fullMessage } = buildAdminNotificationMessage(payload);

  // Target Admin Number (from Settings or fallback default 5491164884571)
  const targetNumber = (settings?.adminWhatsappNumber || settings?.whatsapp || '5491164884571')
    .replace(/\D/g, '');

  const webhookUrl = settings?.adminWebhookUrl || (import.meta as any).env?.VITE_ADMIN_WEBHOOK_URL;

  // Run in background asynchronously without blocking workshop UI
  Promise.resolve().then(async () => {
    try {
      // 1. Send to Webhook Endpoint if configured
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: payload.type,
            title,
            phone: targetNumber,
            message: fullMessage,
            payload,
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => console.warn('Webhook notification warning:', err));
      }

      // 2. CallMeBot WhatsApp Gateway if API key exists
      const callmebotApiKey = (import.meta as any).env?.VITE_CALLMEBOT_API_KEY;
      if (callmebotApiKey && targetNumber) {
        const url = `https://api.callmebot.com/whatsapp.php?phone=${targetNumber}&text=${encodeURIComponent(
          fullMessage
        )}&apikey=${callmebotApiKey}`;
        await fetch(url, { mode: 'no-cors' }).catch((err) =>
          console.warn('Callmebot notification warning:', err)
        );
      }

      console.log('✅ Admin Notification dispatched:', title);
    } catch (err) {
      console.warn('Error sending admin notification:', err);
    }
  });
}
