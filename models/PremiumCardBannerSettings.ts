import mongoose from 'mongoose';

const PremiumCardBannerSettingsSchema = new mongoose.Schema({
  // Banner Text
  bannerTitle: { type: String, default: 'Premium Virtual Cards' },
  bannerSubtitle: { type: String, default: 'Buy premium virtual cards with secure checkout and admin verification.' },
  bannerLabel: { type: String, default: 'Premium Cards' },
  
  // Colors
  bannerBgColor1: { type: String, default: '#0f172a' }, // Dark background start
  bannerBgColor2: { type: String, default: '#1e3a8a' }, // Dark background end
  bannerAccentColor: { type: String, default: '#fbbf24' }, // Amber/Gold accent
  labelColor: { type: String, default: '#fcd34d' }, // Light gold for label
  textColor: { type: String, default: '#ffffff' }, // White text
  subtitleColor: { type: String, default: '#cbd5e1' }, // Light gray subtitle
  
  // Button Styling
  buttonText: { type: String, default: 'Open Cards Section' },
  buttonBgColor: { type: String, default: '#fbbf24' }, // Button background
  buttonTextColor: { type: String, default: '#1f2937' }, // Button text
  buttonHoverBg: { type: String, default: '#f59e0b' }, // Button hover
  
  // Border and Effects
  borderColor: { type: String, default: '#64748b' }, // Border color
  shadowColor: { type: String, default: 'rgba(0,0,0,0.3)' }, // Shadow
  
  // Layout
  showLabel: { type: Boolean, default: true },
  showSubtitle: { type: Boolean, default: true },
  bannerHeight: { type: String, default: 'md' }, // xs, sm, md, lg, xl
  
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.PremiumCardBannerSettings || mongoose.model('PremiumCardBannerSettings', PremiumCardBannerSettingsSchema, 'premium_card_banner_settings');
