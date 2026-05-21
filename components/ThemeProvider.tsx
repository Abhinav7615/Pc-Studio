'use client';

import { useEffect } from 'react';

interface ThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headingColor?: string;
  websiteNameColor?: string;
  headerBgColor?: string;
  footerBgColor?: string;
  cardColor?: string;
  cardBorderColor?: string;
  buttonPrimaryBg?: string;
  buttonPrimaryText?: string;
  buttonSecondaryBg?: string;
  buttonSecondaryText?: string;
  productCardBg?: string;
  productCardBorder?: string;
  productPriceColor?: string;
  productTitleColor?: string;
  featureBgColor?: string;
  featureCardBg?: string;
  featureTextColor?: string;
  heroBgColor?: string;
  heroTextColor?: string;
  heroButtonBg?: string;
  heroButtonTextColor?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  welcomeBgColor?: string;
  welcomeTextColor?: string;
  contactWhatsappColor?: string;
  contactEmailColor?: string;
  fontFamily?: string;
  headingFontFamily?: string;
  buttonRadius?: string;
  cardRadius?: string;
  containerMaxWidth?: string;
  // Brand Logos
  brandLogo?: string;
  darkLogo?: string;
  favicon?: string;
  invoiceLogo?: string;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = async () => {
      try {
        const currentTheme = typeof window !== 'undefined' ? window.localStorage.getItem('site-theme') || 'light' : 'light';
        const res = await fetch(`/api/business-settings?t=${Date.now()}`);
        if (res.ok) {
          const settings: ThemeSettings = await res.json();
          const root = document.documentElement;
          
          if (settings.primaryColor) root.style.setProperty('--primary-color', settings.primaryColor);
          if (settings.secondaryColor) root.style.setProperty('--secondary-color', settings.secondaryColor);
          if (settings.accentColor) root.style.setProperty('--accent-color', settings.accentColor);
          if (currentTheme !== 'dark' && settings.backgroundColor) root.style.setProperty('--background-color', settings.backgroundColor);
          if (currentTheme !== 'dark' && settings.textColor) root.style.setProperty('--text-color', settings.textColor);
          if (currentTheme !== 'dark' && settings.headingColor) root.style.setProperty('--heading-color', settings.headingColor);
          if (settings.websiteNameColor) root.style.setProperty('--website-name-color', settings.websiteNameColor);
          if (settings.headerBgColor) {
            root.style.setProperty('--header-bg', settings.headerBgColor);
            root.style.setProperty('--header-color', settings.headerBgColor);
          }
          if (currentTheme !== 'dark' && settings.footerBgColor) root.style.setProperty('--footer-bg', settings.footerBgColor);
          if (currentTheme !== 'dark' && settings.cardColor) root.style.setProperty('--card-color', settings.cardColor);
          if (currentTheme !== 'dark' && settings.cardBorderColor) root.style.setProperty('--card-border', settings.cardBorderColor);
          if (settings.buttonPrimaryBg) root.style.setProperty('--button-primary-bg', settings.buttonPrimaryBg);
          if (settings.buttonPrimaryText) root.style.setProperty('--button-primary-text', settings.buttonPrimaryText);
          if (settings.buttonSecondaryBg) root.style.setProperty('--button-secondary-bg', settings.buttonSecondaryBg);
          if (settings.buttonSecondaryText) root.style.setProperty('--button-secondary-text', settings.buttonSecondaryText);
          if (currentTheme !== 'dark' && settings.productCardBg) root.style.setProperty('--product-card-bg', settings.productCardBg);
          if (currentTheme !== 'dark' && settings.productCardBorder) root.style.setProperty('--product-card-border', settings.productCardBorder);
          if (settings.productPriceColor) root.style.setProperty('--product-price-color', settings.productPriceColor);
          if (settings.productTitleColor) root.style.setProperty('--product-title-color', settings.productTitleColor);
          if (currentTheme !== 'dark' && settings.featureBgColor) root.style.setProperty('--feature-bg', settings.featureBgColor);
          if (currentTheme !== 'dark' && settings.featureCardBg) root.style.setProperty('--feature-card-bg', settings.featureCardBg);
          if (settings.featureTextColor) root.style.setProperty('--feature-text-color', settings.featureTextColor);
          if (currentTheme !== 'dark' && settings.heroBgColor) root.style.setProperty('--hero-bg', settings.heroBgColor);
          if (settings.heroTextColor) root.style.setProperty('--hero-text', settings.heroTextColor);
          if (settings.heroButtonBg) root.style.setProperty('--hero-button-bg', settings.heroButtonBg);
          if (settings.heroButtonTextColor) root.style.setProperty('--hero-button-text', settings.heroButtonTextColor);
          if (currentTheme !== 'dark' && settings.announcementBgColor) root.style.setProperty('--announcement-bg', settings.announcementBgColor);
          if (settings.announcementTextColor) root.style.setProperty('--announcement-text', settings.announcementTextColor);
          if (currentTheme !== 'dark' && settings.welcomeBgColor) root.style.setProperty('--welcome-bg', settings.welcomeBgColor);
          if (settings.welcomeTextColor) root.style.setProperty('--welcome-text', settings.welcomeTextColor);
          if (settings.contactWhatsappColor) root.style.setProperty('--contact-whatsapp', settings.contactWhatsappColor);
          if (settings.contactEmailColor) root.style.setProperty('--contact-email', settings.contactEmailColor);
          if (settings.fontFamily) root.style.setProperty('--font-family', settings.fontFamily);
          if (settings.headingFontFamily) root.style.setProperty('--heading-font', settings.headingFontFamily);
          if (settings.buttonRadius) root.style.setProperty('--button-radius', settings.buttonRadius);
          if (settings.cardRadius) root.style.setProperty('--card-radius', settings.cardRadius);
          if (settings.containerMaxWidth) root.style.setProperty('--container-width', settings.containerMaxWidth);
          
          // Apply brand logos to CSS variables
          if (settings.brandLogo) root.style.setProperty('--brand-logo', settings.brandLogo);
          if (settings.darkLogo) root.style.setProperty('--dark-logo', settings.darkLogo);
          if (settings.favicon) root.style.setProperty('--favicon', settings.favicon);
          if (settings.invoiceLogo) root.style.setProperty('--invoice-logo', settings.invoiceLogo);
        }
      } catch (error) {
        console.error('Failed to apply theme:', error);
      }
    };

    applyTheme();
    
    // Re-apply on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        applyTheme();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}
