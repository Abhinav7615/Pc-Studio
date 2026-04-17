import crypto from 'crypto';

interface OtpEntry {
  otp: string;
  expiresAt: Date;
  attempts: number;
}

interface TokenEntry {
  userId: string;
  email: string;
  expiresAt: Date;
}

const forgotOtpStore: { [key: string]: OtpEntry } = {};
const resetTokenStore: { [key: string]: TokenEntry } = {};
const registerOtpStore: { [key: string]: OtpEntry } = {};
const registerTokenStore: { [key: string]: TokenEntry } = {};

export const getOtpExpiry = () => new Date(Date.now() + 5 * 60 * 1000);
export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export function setForgotOtp(key: string, otp: string) {
  forgotOtpStore[key] = { otp, expiresAt: getOtpExpiry(), attempts: 0 };
}

export function getForgotOtp(key: string) {
  return forgotOtpStore[key];
}

export function deleteForgotOtp(key: string) {
  delete forgotOtpStore[key];
}

export function setResetToken(token: string, userId: string, email: string) {
  resetTokenStore[token] = { userId, email, expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
}

export function getResetToken(token: string) {
  return resetTokenStore[token];
}

export function deleteResetToken(token: string) {
  delete resetTokenStore[token];
}

export function setRegisterOtp(key: string, otp: string) {
  registerOtpStore[key] = { otp, expiresAt: getOtpExpiry(), attempts: 0 };
}

export function getRegisterOtp(key: string) {
  return registerOtpStore[key];
}

export function deleteRegisterOtp(key: string) {
  delete registerOtpStore[key];
}

export function setRegisterToken(token: string, email: string) {
  registerTokenStore[token] = { userId: '', email, expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
}

export function getRegisterToken(token: string) {
  return registerTokenStore[token];
}

export function deleteRegisterToken(token: string) {
  delete registerTokenStore[token];
}

export function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}
