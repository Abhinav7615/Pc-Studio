const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID?.trim();
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN?.trim();
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM?.trim();

function normalizePhone(phone: string): string | null {
  if (!phone) return null;
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.slice(1);
  }
  if (cleanPhone.length === 10) {
    return `+91${cleanPhone}`;
  }
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return `+${cleanPhone}`;
  }
  if (cleanPhone.length > 12 && cleanPhone.startsWith('91')) {
    return `+${cleanPhone}`;
  }
  return null;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; provider: string; message: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { success: false, provider: 'none', message: 'Invalid phone number' };
  }

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM) {
    try {
      const postData = new URLSearchParams({
        To: `whatsapp:${normalized}`,
        From: TWILIO_WHATSAPP_FROM,
        Body: message,
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData.toString(),
      });

      const body = await response.json();
      if (!response.ok) {
        console.error('Twilio WhatsApp error:', body);
        return { success: false, provider: 'twilio-whatsapp', message: body.message || 'Twilio WhatsApp failed' };
      }

      return { success: true, provider: 'twilio-whatsapp', message: 'WhatsApp sent successfully' };
    } catch (error) {
      console.error('Twilio WhatsApp send error:', error);
      return { success: false, provider: 'twilio-whatsapp', message: error instanceof Error ? error.message : 'Unknown Twilio error' };
    }
  }

  console.log('WhatsApp notification skipped, no provider configured:', { phone: normalized, message });
  return { success: false, provider: 'none', message: 'No WhatsApp provider configured' };
}
