/**
 * MSG91 OTP Service
 * Handles sending OTP via SMS through MSG91 provider
 */

const MSG91_API_KEY = process.env.MSG91_API_KEY;
const SENDER_ID = process.env.MSG91_SENDER_ID || 'PCSTUD';

export async function sendOtp(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!MSG91_API_KEY) {
      console.error('MSG91_API_KEY not configured');
      return { success: false, message: 'OTP service not configured' };
    }

    // Remove leading +91 if present and ensure 10 digit mobile
    let cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    
    // If Indian number, add 91 prefix
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      // Already has prefix
    } else {
      return { success: false, message: 'Invalid phone number' };
    }

    const message = `Your Refurbished PC Studio OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;

    const params = new URLSearchParams({
      authkey: MSG91_API_KEY,
      mobiles: cleanPhone,
      message: message,
      sender: SENDER_ID,
      route: '4',
      unicode: '0',
    });

    const response = await fetch(`https://api.msg91.com/api/sendhttp?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      console.error('MSG91 API error:', response.statusText);
      return { success: false, message: 'Failed to send OTP' };
    }

    const data = await response.text();
    
    // MSG91 returns success if response contains "2002100" or similar success codes
    if (data.includes('2002100') || data.includes('901101')) {
      return { success: true, message: 'OTP sent successfully' };
    } else {
      console.error('MSG91 Response:', data);
      return { success: false, message: 'Failed to send OTP' };
    }
  } catch (error) {
    console.error('OTP send error:', error);
    return { success: false, message: 'Error sending OTP' };
  }
}

export function generateOtp(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return otp;
}

export function getOtpExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes validity
  return expiry;
}
