const MSG91_API_KEY = process.env.MSG91_API_KEY?.trim();
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID?.trim() || 'PCSTUD';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID?.trim();
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN?.trim();
const TWILIO_SMS_FROM = process.env.TWILIO_SMS_FROM?.trim();

function normalizePhone(phone: string): string | null {
  if (!phone) return null;
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.slice(1);
  }
  if (cleanPhone.length === 10) {
    return `91${cleanPhone}`;
  }
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return cleanPhone;
  }
  return null;
}

export async function sendSmsMessage(phone: string, message: string): Promise<{ success: boolean; provider: string; message: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { success: false, provider: 'none', message: 'Invalid phone number' };
  }

  if (MSG91_API_KEY) {
    try {
      const params = new URLSearchParams({
        authkey: MSG91_API_KEY,
        mobiles: normalized,
        message,
        sender: MSG91_SENDER_ID,
        route: '4',
        unicode: '0',
      });

      const response = await fetch(`https://api.msg91.com/api/sendhttp?${params.toString()}`, {
        method: 'GET',
      });

      const body = await response.text();
      if (!response.ok) {
        console.error('MSG91 SMS error:', response.status, body);
        // Log for debugging
        console.error('[MSG91 DEBUG]', {
          apiKeyExists: !!MSG91_API_KEY,
          apiKeyPrefix: MSG91_API_KEY?.substring(0, 10),
          endpoint: 'api.msg91.com/api/sendhttp',
          status: response.status,
          responsePreview: body.substring(0, 100),
        });
        return { success: false, provider: 'msg91', message: `MSG91 error: ${response.status}` };
      }

      if (body.includes('2002100') || body.includes('901101') || body.toLowerCase().includes('success')) {
        return { success: true, provider: 'msg91', message: 'SMS sent successfully' };
      }

      console.error('MSG91 SMS unexpected response:', body);
      return { success: false, provider: 'msg91', message: body };
    } catch (error) {
      console.error('MSG91 SMS send error:', error);
      return { success: false, provider: 'msg91', message: error instanceof Error ? error.message : 'Unknown MSG91 error' };
    }
  }

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_SMS_FROM) {
    try {
      const postData = new URLSearchParams({
        To: `+${normalized}`,
        From: TWILIO_SMS_FROM,
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
        console.error('Twilio SMS error:', body);
        return { success: false, provider: 'twilio', message: body.message || 'Twilio SMS failed' };
      }

      return { success: true, provider: 'twilio', message: 'SMS sent successfully' };
    } catch (error) {
      console.error('Twilio SMS send error:', error);
      return { success: false, provider: 'twilio', message: error instanceof Error ? error.message : 'Unknown Twilio error' };
    }
  }

  // Development mode fallback
  if (process.env.NODE_ENV !== 'production') {
    console.log('📱 [DEV MODE] SMS would be sent:');
    console.log(`   To: ${normalized}`);
    console.log(`   Message: ${message}`);
    return { success: true, provider: 'dev', message: 'Development mode: SMS logged to console' };
  }

  console.log('SMS notification skipped, no provider configured:', { phone: normalized, message });
  return { success: false, provider: 'none', message: 'No SMS provider configured' };
}
