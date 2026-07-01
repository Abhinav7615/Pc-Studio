import Link from 'next/link';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaShippingFast,
  FaLock,
  FaCheckCircle,
  FaHeadset
} from 'react-icons/fa';

import type { BusinessSettings } from '../types/business';

export default function Footer({ settings = {} as BusinessSettings }) {
  // Dynamic styles from settings
  const bgColor = settings.footerBgColor || '#1e293b';
  const textColor = settings.footerTextColor || settings.textColor || '#f1f5f9';
  const borderColor = settings.footerBorderColor || '#334155';
  return (
    <footer
      className="w-full pt-12 pb-0 px-0 mt-auto shadow-2xl rounded-t-3xl border-t"
      style={{
        background: bgColor,
        color: textColor,
        borderTopColor: borderColor,
        borderTopWidth: '1px',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer ad slot */}
        <div className="mb-6">
          <div className="mx-auto max-w-3xl">
            {/* Lazy-loaded footer ad */}
            { }
            <div className="w-full">
              {/* AdSlot inserted here to keep layout stable */}
              {/* Importing lazily to avoid SSR issues */}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 pb-8 border-b" style={{ borderColor }}>
          {/* Brand/Description */}
          <div className="flex flex-col gap-4">
            {settings.brandLogo && (
              <img src={settings.brandLogo} alt={settings.websiteName || 'Brand Logo'} className="h-12 w-auto mb-2 rounded-xl shadow-lg bg-white/10 p-1" />
            )}
            <h3 className="text-2xl font-bold tracking-tight drop-shadow-lg" style={{ color: settings.websiteNameColor || textColor }}>
              {settings.websiteName || 'Refurbished PC Studio'}
            </h3>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: settings.footerDescColor || textColor }}>
              {settings.footerText || 'Shop premium refurbished laptops & computers. Quality assured, best prices, trusted by professionals.'}
            </p>
            <span className="inline-block text-xs font-semibold mt-2 px-3 py-1 rounded-full shadow" style={{ background: settings.footerBadgeBg || 'rgba(30,64,175,0.2)', color: settings.footerBadgeColor || '#38bdf8' }}>
              {settings.footerBadgeText || 'Trusted Refurbished Marketplace'}
            </span>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ color: textColor }}>Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-blue-400 transition-colors">Browse Stock</Link></li>
              <li><Link href="/offers" className="hover:text-blue-400 transition-colors">Offers</Link></li>
              <li><Link href="/orders" className="hover:text-blue-400 transition-colors">Orders</Link></li>
              <li><Link href="/support-tickets" className="hover:text-blue-400 transition-colors">Support</Link></li>
              <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact / Visit Us */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ color: textColor }}>Contact / Visit Us</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><FaMapMarkerAlt className="text-blue-400" />{settings.ownerAddress || settings.businessAddress || 'Business address here'}</li>
              <li className="flex items-center gap-2"><FaEnvelope className="text-blue-400" /><a href={`mailto:${settings.contactEmail || 'support@example.com'}`} className="hover:text-blue-400 transition-colors">{settings.contactEmail || 'support@example.com'}</a></li>
              <li className="flex items-center gap-2"><FaWhatsapp className="text-blue-400" /><a href={`https://wa.me/${settings.contactWhatsapp || ''}`} className="hover:text-blue-400 transition-colors">{settings.contactWhatsapp || 'WhatsApp'}</a></li>
              <li className="flex items-center gap-2"><FaPhoneAlt className="text-blue-400" />{settings.ownerPhone1 || settings.businessPhone || 'Phone number'}</li>
              <li className="flex items-center gap-2"><FaMapMarkerAlt className="text-blue-400" />{settings.ownerMapLink ? (<a href={settings.ownerMapLink} target="_blank" rel="noopener" className="hover:text-blue-400 transition-colors">Location</a>) : 'Location'}</li>
              <li className="flex items-center gap-2"><span className="text-blue-400 font-bold">⏰</span>{settings.storeTiming || 'Mon-Sat 10am-7pm'}</li>
            </ul>
          </div>

          {/* Support & Benefits */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ color: textColor }}>Support & Benefits</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><FaShippingFast className="text-blue-400" />Free Shipping</li>
              <li className="flex items-center gap-2"><FaLock className="text-blue-400" />Secure Payment</li>
              <li className="flex items-center gap-2"><FaCheckCircle className="text-blue-400" />Quality Assured</li>
              <li className="flex items-center gap-2"><FaHeadset className="text-blue-400" />24/7 Support</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row md:justify-between items-center py-5 gap-3 text-xs" style={{ color: settings.footerBottomTextColor || '#94a3b8' }}>
          <div className="flex flex-wrap items-center gap-3">
            <span>&copy; {new Date().getFullYear()} {settings.footerCopyright || settings.websiteName || 'Refurbished PC Studio'}. All rights reserved.</span>
            <span className="hidden md:inline">|</span>
            <a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <span className="hidden md:inline">|</span>
            <a href="/terms" className="hover:text-blue-400 transition-colors">Terms</a>
          </div>
          <div className="flex items-center gap-2">
            <span>{settings.footerMadeWith || <>Made with <span className="text-red-500">&#10084;&#65039;</span> by <span className="font-semibold text-blue-400">{settings.websiteName || 'Refurbished PC Studio'}</span></>}</span>
            {settings.footerFacebook && <a href={settings.footerFacebook} className="ml-2 hover:text-blue-400" target="_blank" rel="noopener"><FaFacebookF /></a>}
            {settings.footerTwitter && <a href={settings.footerTwitter} className="hover:text-blue-400" target="_blank" rel="noopener"><FaTwitter /></a>}
            {settings.footerInstagram && <a href={settings.footerInstagram} className="hover:text-blue-400" target="_blank" rel="noopener"><FaInstagram /></a>}
            {settings.footerLinkedin && <a href={settings.footerLinkedin} className="hover:text-blue-400" target="_blank" rel="noopener"><FaLinkedinIn /></a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
