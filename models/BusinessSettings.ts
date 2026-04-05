import mongoose from 'mongoose';

const BusinessSettingsSchema = new mongoose.Schema({
  websiteName: { type: String, default: 'Refurbished PC Studio' },
  whatsapp: { type: String },
  contactEmail: { type: String },
  bankAccountNumber: { type: String },
  upiId: { type: String },
  adminWhatsapp: { type: String },
  staffWhatsapp: { type: String },
  contactWhatsapp: { type: String },
  websiteNameColor: { type: String, default: '#111827' },
  offlineShopAddress: { type: String },
  offlineShopCity: { type: String },
  offlineShopState: { type: String },
  offlineShopPincode: { type: String },
  offlineShopGoogleMapsLink: { type: String },
  offlineShopEnabled: { type: Boolean, default: false },
  siteOpen: { type: Boolean, default: true },
  scheduleEnabled: { type: Boolean, default: false },
  alwaysOpen247: { type: Boolean, default: true },
  globalOpenTime: { type: String, default: '00:00' },
  globalCloseTime: { type: String, default: '23:59' },
  closedPageTitle: { type: String, default: 'Website Temporarily Closed' },
  closedPageMessage: { type: String, default: 'We are currently closed. Please visit again during working hours.' },
  // UI customization
  brandLogo: { type: String, default: '' },
  fontFamily: { type: String, default: 'Arial, Helvetica, sans-serif' },
  buttonRadius: { type: String, default: '0.5rem' },
  buttonPrimaryColor: { type: String, default: '#2563eb' },
  buttonSecondaryColor: { type: String, default: '#9333ea' },
  cardPadding: { type: String, default: '1.25rem' },
  headerHeight: { type: String, default: '72px' },

  weeklySchedule: {
    type: [
      {
        day: { type: Number },
        dayName: { type: String },
        active: { type: Boolean, default: true },
        openTime: { type: String, default: '09:00' },
        closeTime: { type: String, default: '18:00' },
      },
    ],
    default: [
      { day: 0, dayName: 'Sunday', active: true, openTime: '09:00', closeTime: '18:00' },
      { day: 1, dayName: 'Monday', active: true, openTime: '09:00', closeTime: '18:00' },
      { day: 2, dayName: 'Tuesday', active: true, openTime: '09:00', closeTime: '18:00' },
      { day: 3, dayName: 'Wednesday', active: true, openTime: '09:00', closeTime: '18:00' },
      { day: 4, dayName: 'Thursday', active: true, openTime: '09:00', closeTime: '18:00' },
      { day: 5, dayName: 'Friday', active: true, openTime: '09:00', closeTime: '18:00' },
      { day: 6, dayName: 'Saturday', active: true, openTime: '09:00', closeTime: '18:00' },
    ],
  },
  // Payment verification settings
  paymentVerificationStartTime: { type: String, default: '09:00' }, // Start time for admin verification
  paymentVerificationEndTime: { type: String, default: '17:00' }, // End time for admin verification

  // Referral settings
  referralEnabled: { type: Boolean, default: true },
  contactInfoEnabled: { type: Boolean, default: true },
  referralCouponAmount: { type: Number, default: 100 }, // Amount for referrer's coupon
  referralCouponDays: { type: Number, default: 30 }, // Validity in days
  referralCouponUsageLimit: { type: Number, default: 1 }, // How many times it can be used
  inviteeDiscountAmount: { type: Number, default: 50 }, // Amount for invitee's coupon
  inviteeDiscountDays: { type: Number, default: 30 }, // Validity in days
  inviteeDiscountUsageLimit: { type: Number, default: 1 }, // How many times it can be used
  primaryColor: { type: String, default: '#2563eb' },
  secondaryColor: { type: String, default: '#9333ea' },
  contactWhatsappColor: { type: String, default: '#16a34a' },
  contactEmailColor: { type: String, default: '#1d4ed8' },
  backgroundColor: { type: String, default: '#f8fafc' },
  textColor: { type: String, default: '#111827' },
  headerColor: { type: String, default: '#ffffff' },
  cardColor: { type: String, default: '#ffffff' },

  // Shipping charges settings
  freeShippingThreshold: { type: Number, default: 0 },
  defaultShippingCharge: { type: Number, default: 0 },
  stateShippingCharges: { type: mongoose.Schema.Types.Mixed, default: {} },
});

export default mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', BusinessSettingsSchema);