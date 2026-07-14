import mongoose from 'mongoose';

const PremiumCardThemeSchema = new mongoose.Schema({
  // Section title and description
  sectionTitle: { type: String, default: 'Premium Virtual Cards' },
  sectionDescription: { type: String, default: 'Instant delivery. Real balances. Normal, Premium, VIP & American Express cards available now.' },
  
  // Colors
  primaryColor: { type: String, default: '#38bdf8' }, // sky-400
  secondaryColor: { type: String, default: '#fbbf24' }, // amber-400
  accentColor: { type: String, default: '#10b981' }, // emerald-500
  backgroundColor: { type: String, default: '#050816' }, // dark background
  cardBackgroundColor: { type: String, default: '#0b1320' }, // card background
  textColor: { type: String, default: '#e2e8f0' }, // slate-100
  
  // Button styling
  buttonStyle: { 
    type: String, 
    enum: ['gradient', 'solid', 'outlined'],
    default: 'gradient' 
  },
  buttonRadius: { 
    type: String, 
    enum: ['rounded', 'semi-rounded', 'pill'],
    default: 'pill'
  },
  
  // Category card styles (JSON object storing all category styles)
  categoryStyles: { 
    type: Map, 
    of: new mongoose.Schema({
      group: String,
      glow: String,
      badge: String,
      shell: String,
      panel: String,
      price: String,
      button: String,
    }, { _id: false }),
    default: null
  },
  
  // Text customization
  texts: {
    ctaButton: { type: String, default: 'Buy Now' },
    soldOutButton: { type: String, default: 'Sold Out' },
    availableLabel: { type: String, default: 'Available' },
    soldOutLabel: { type: String, default: 'Sold Out' },
    yourOrdersLabel: { type: String, default: 'Your Card Orders' },
    quantityLabel: { type: String, default: 'Qty' },
    typeLabel: { type: String, default: 'Type' },
    cardDetailsLabel: { type: String, default: 'Card Details' },
    noOrdersText: { type: String, default: 'No orders found yet. Select a card and place an order to see it appear here.' },
  },
  
  // Feature toggles
  showCardImage: { type: Boolean, default: true },
  showCardDescription: { type: Boolean, default: true },
  showQuantity: { type: Boolean, default: true },
  showNetworkType: { type: Boolean, default: true },
  enableCardHoverEffect: { type: Boolean, default: true },
  
  // Display options
  cardsPerRow: {
    type: String,
    enum: ['1', '2', '3', '4'],
    default: '3'
  },
  
  // Feature flags
  featured: { type: Boolean, default: false },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PremiumCardTheme || mongoose.model('PremiumCardTheme', PremiumCardThemeSchema, 'premium_card_theme');
