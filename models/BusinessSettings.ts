import mongoose from 'mongoose';

const BusinessSettingsSchema = new mongoose.Schema({
  websiteName: { type: String, default: 'Refurbished PC Studio' },
  websiteSubtitle: { type: String, default: 'Shop premium refurbished computers' },
  whatsapp: { type: String },
  contactEmail: { type: String },
  bankAccountNumber: { type: String },
  upiId: { type: String },
  adminWhatsapp: { type: String },
  staffWhatsapp: { type: String },
  contactWhatsapp: { type: String },
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
  
  // Brand & Logo
  brandLogo: { type: String, default: '' },
  favicon: { type: String, default: '' },
  
  // Font & Typography
  fontFamily: { type: String, default: 'system-ui, -apple-system, sans-serif' },
  headingFontFamily: { type: String, default: 'system-ui, -apple-system, sans-serif' },
  
  // Layout
  buttonRadius: { type: String, default: '0.75rem' },
  cardRadius: { type: String, default: '1rem' },
  cardPadding: { type: String, default: '1.5rem' },
  headerHeight: { type: String, default: '72px' },
  containerMaxWidth: { type: String, default: '1280px' },
  
  // Main Theme Colors
  primaryColor: { type: String, default: '#3b82f6' },
  secondaryColor: { type: String, default: '#8b5cf6' },
  accentColor: { type: String, default: '#10b981' },
  
  // Background Colors
  backgroundColor: { type: String, default: '#f8fafc' },
  headerBgColor: { type: String, default: '#ffffff' },
  footerBgColor: { type: String, default: '#1e293b' },
  
  // Text Colors
  textColor: { type: String, default: '#1e293b' },
  headingColor: { type: String, default: '#0f172a' },
  websiteNameColor: { type: String, default: '#3b82f6' },
  
  // Card & Surface Colors
  cardColor: { type: String, default: '#ffffff' },
  cardBorderColor: { type: String, default: '#e2e8f0' },
  
  // Button Colors
  buttonPrimaryBg: { type: String, default: '#3b82f6' },
  buttonPrimaryText: { type: String, default: '#ffffff' },
  buttonSecondaryBg: { type: String, default: '#8b5cf6' },
  buttonSecondaryText: { type: String, default: '#ffffff' },
  
  // Contact Colors
  contactWhatsappColor: { type: String, default: '#22c55e' },
  contactEmailColor: { type: String, default: '#3b82f6' },
  contactInfoEnabled: { type: Boolean, default: true },
  
  // Hero/Banner Section
  heroEnabled: { type: Boolean, default: true },
  heroTitle: { type: String, default: 'Welcome to Our Store' },
  heroSubtitle: { type: String, default: 'Discover amazing products at great prices' },
  heroBgColor: { type: String, default: '#3b82f6' },
  heroTextColor: { type: String, default: '#ffffff' },
  heroButtonText: { type: String, default: 'Shop Now' },
  heroButtonBg: { type: String, default: '#ffffff' },
  heroButtonTextColor: { type: String, default: '#3b82f6' },
  
  // Announcement Banner
  announcementEnabled: { type: Boolean, default: false },
  announcementText: { type: String, default: 'Free shipping on orders over ₹1000!' },
  announcementBgColor: { type: String, default: '#10b981' },
  announcementTextColor: { type: String, default: '#ffffff' },

  // Chatbot & Live Support
  chatEnabled: { type: Boolean, default: true },
  chatBotEnabled: { type: Boolean, default: true },
  chatBotName: { type: String, default: 'ShopBot' },
  chatBotIntroMessage: { type: String, default: '' },
  chatJoinMessage: { type: String, default: 'An agent has joined your chat and will respond shortly.' },
  chatEndMessage: { type: String, default: 'Thank you for chatting with us. If you need anything else, we are here to help!' },

  // Welcome Section
  welcomeEnabled: { type: Boolean, default: true },
  welcomeTitle: { type: String, default: 'Welcome to Our Store' },
  welcomeSubtitle: { type: String, default: 'High-quality products at unbeatable prices' },
  welcomeBgColor: { type: String, default: '#ffffff' },
  welcomeTextColor: { type: String, default: '#1e293b' },
  
  // Features Section
  featuresEnabled: { type: Boolean, default: true },
  feature1Icon: { type: String, default: '🚚' },
  feature1Title: { type: String, default: 'Free Shipping' },
  feature1Text: { type: String, default: 'On orders over ₹1000' },
  feature2Icon: { type: String, default: '🔒' },
  feature2Title: { type: String, default: 'Secure Payment' },
  feature2Text: { type: String, default: '100% secure checkout' },
  feature3Icon: { type: String, default: '💯' },
  feature3Title: { type: String, default: 'Quality Assured' },
  feature3Text: { type: String, default: 'All products checked' },
  feature4Icon: { type: String, default: '📞' },
  feature4Title: { type: String, default: '24/7 Support' },
  feature4Text: { type: String, default: 'Dedicated support team' },
  featureBgColor: { type: String, default: '#f1f5f9' },
  featureCardBg: { type: String, default: '#ffffff' },
  featureTextColor: { type: String, default: '#475569' },
  
  // Product Card Colors
  productCardBg: { type: String, default: '#ffffff' },
  productCardBorder: { type: String, default: '#e2e8f0' },
  productCardHoverBg: { type: String, default: '#f8fafc' },
  productPriceColor: { type: String, default: '#3b82f6' },
  productTitleColor: { type: String, default: '#1e293b' },
  
  // Weekly Schedule
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
  paymentVerificationStartTime: { type: String, default: '09:00' },
  paymentVerificationEndTime: { type: String, default: '17:00' },

  // Referral settings
  referralEnabled: { type: Boolean, default: true },
  referralCouponAmount: { type: Number, default: 100 },
  referralCouponDays: { type: Number, default: 30 },
  bargainCouponDays: { type: Number, default: 3 },
  biddingCouponDays: { type: Number, default: 2 },
  bargainEnabled: { type: Boolean, default: false },
  biddingEnabled: { type: Boolean, default: false },
  referralCouponUsageLimit: { type: Number, default: 1 },
  inviteeDiscountAmount: { type: Number, default: 50 },
  inviteeDiscountDays: { type: Number, default: 30 },
  inviteeDiscountUsageLimit: { type: Number, default: 1 },
  
  // Shipping charges settings
  freeShippingThreshold: { type: Number, default: 0 },
  defaultShippingCharge: { type: Number, default: 0 },
  stateShippingCharges: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  // Customization History (for reset feature)
  customizationHistory: {
    type: [{
      timestamp: { type: Date, default: Date.now },
      settings: { type: mongoose.Schema.Types.Mixed }
    }],
    default: []
  },
});

export default mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', BusinessSettingsSchema);