import crypto from 'crypto';
import User from '../models/User';

export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function generateUniqueReferralCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateReferralCode();
    attempts++;
  } while (await User.findOne({ referralCode: code }) && attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique referral code');
  }

  return code;
}

export function generateCouponCode(): string {
  return 'REF' + crypto.randomBytes(3).toString('hex').toUpperCase();
}