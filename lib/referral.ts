import crypto from 'crypto';
import User from '../models/User';

// Generate referral code from name (4 digits) + mobile (last 2 digits)
export function generateCustomReferralCode(name: string, mobile: string): string {
  // Take first 4 chars of name, make uppercase
  const nameCode = name.substring(0, 4).toUpperCase().padEnd(4, 'X');
  
  // Take last 2 digits of mobile
  const mobileCode = mobile.slice(-2);
  
  return nameCode + mobileCode; // e.g., "ABCD12"
}

export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function generateUniqueReferralCode(name: string, mobile: string): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  // Try custom format first
  code = generateCustomReferralCode(name, mobile);
  
  // If already exists, add random suffix
  while (await User.findOne({ referralCode: code }) && attempts < maxAttempts) {
    code = generateCustomReferralCode(name, mobile) + Math.random().toString(36).substring(2, 4).toUpperCase();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique referral code');
  }

  return code;
}

export async function generateUniqueCustomerId(): Promise<string> {
  let customerId: string;
  let attempts = 0;
  const maxAttempts = 20;

  do {
    customerId = 'CUST' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const existing = await User.findOne({ customerId });
    if (!existing) return customerId;
    attempts++;
  } while (attempts < maxAttempts);

  throw new Error('Unable to generate unique customer ID');
}

export function generateCouponCode(): string {
  return 'REF' + crypto.randomBytes(3).toString('hex').toUpperCase();
}