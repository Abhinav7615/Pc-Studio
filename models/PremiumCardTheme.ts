import mongoose from 'mongoose';

const PremiumCardThemeSchema = new mongoose.Schema({
  // Section title and description
  sectionTitle: { type: String, default: 'Premium Virtual Cards' },
  sectionDescription: { type: String, default: 'Instant delivery. Real balances. Normal, Premium, VIP & American Express cards available now.' },
  
  // Global Colors
  primaryColor: { type: String, default: '#38bdf8' }, // sky-400
  secondaryColor: { type: String, default: '#fbbf24' }, // amber-400
  accentColor: { type: String, default: '#10b981' }, // emerald-500
  backgroundColor: { type: String, default: '#050816' }, // dark background
  cardBackgroundColor: { type: String, default: '#0b1320' }, // card background
  textColor: { type: String, default: '#e2e8f0' }, // slate-100
  
  // Consumer Page Colors & Styling
  consumerPageBg: { type: String, default: '#ffffff' }, // page background
  consumerPageText: { type: String, default: '#1e293b' }, // page text
  bannerBg: { type: String, default: '#0f1f3a' }, // banner background
  bannerText: { type: String, default: '#ffffff' }, // banner text
  featuredSectionBg: { type: String, default: '#f1f5f9' }, // featured cards section bg
  featuredSectionText: { type: String, default: '#334155' }, // featured section text
  cardBg: { type: String, default: '#ffffff' }, // individual card background
  cardBorder: { type: String, default: '#cbd5e1' }, // card border
  cardText: { type: String, default: '#1e293b' }, // card text
  
  // Payment Modal Colors
  modalBg: { type: String, default: '#0b1220' }, // modal background
  modalBorder: { type: String, default: '#334155' }, // modal border
  modalText: { type: String, default: '#e2e8f0' }, // modal text
  inputBg: { type: String, default: '#0b1727' }, // input background
  inputBorder: { type: String, default: '#475569' }, // input border
  inputText: { type: String, default: '#f1f5f9' }, // input text
  buttonBg: { type: String, default: '#fbbf24' }, // button background
  buttonText: { type: String, default: '#1e293b' }, // button text
  
  // Confirmation Page Colors
  confirmationBg: { type: String, default: '#0b1220' }, // confirmation page bg
  confirmationBorder: { type: String, default: '#334155' }, // confirmation border
  successColor: { type: String, default: '#10b981' }, // success (green)
  warningColor: { type: String, default: '#f59e0b' }, // warning (amber)
  
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
  
  // Text customization - General
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
  
  // Payment Modal Text
  paymentTexts: {
    securePayment: { type: String, default: 'Secure Payment' },
    countdownLabel: { type: String, default: 'Countdown' },
    amountLabel: { type: String, default: 'Amount to Pay' },
    qrLabel: { type: String, default: 'QR Code' },
    upiLabel: { type: String, default: 'UPI ID' },
    bankLabel: { type: String, default: 'Bank Transfer' },
    proofLabel: { type: String, default: 'Payment Proof' },
    uploadScreenshot: { type: String, default: 'Upload screenshot' },
    instructions: { type: String, default: 'Instructions' },
    submitButton: { type: String, default: 'Submit Payment' },
  },
  
  // Confirmation Page Text
  confirmationTexts: {
    successTitle: { type: String, default: 'Your payment request is received successfully' },
    successMessage: { type: String, default: 'Please wait for admin verification before your card details are released. We will update your order status shortly.' },
    orderDetails: { type: String, default: 'Order Details' },
    paymentDetails: { type: String, default: 'Payment Details You Submitted' },
    whatHappensNext: { type: String, default: 'What happens next?' },
    nextStepOne: { type: String, default: 'Your payment proof and details have been sent to the admin for verification.' },
    nextStepTwo: { type: String, default: 'Once approved, your card details will be released to your order section.' },
    nextStepThree: { type: String, default: 'You can check the status of this request anytime from the "Your Card Orders" section.' },
    backButton: { type: String, default: 'Back to cards' },
    viewOrdersButton: { type: String, default: 'View my orders' },
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

