'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';

interface Order {
  _id: string;
  orderNumber?: string;
  total: number;
  discountAmount?: number;
  transactionId?: string;
  status: string;
  returnStatus: string;
  refundStatus: string;
  returnReason?: string;
  returnDeadline?: string;
  cancellationStatus: string;
  cancellationReason?: string;
  modificationRequest?: { status?: string; reason?: string };
  shipping?: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    mobile: string;
  };
  paymentScreenshot?: string;
  createdAt: string;
  deliveryCompanyName?: string;
  deliveryCompanyDetails?: string;
  trackingId?: string;
  products: { product: { _id: string; name: string; originalPrice: number; discountPercent: number } | null; productName?: string; quantity: number; price: number }[];
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<{ whatsapp?: string; contactWhatsapp?: string; contactEmail?: string; adminWhatsapp?: string; staffWhatsapp?: string; contactWhatsappColor?: string; contactEmailColor?: string; paymentVerificationStartTime?: string; paymentVerificationEndTime?: string; contactInfoEnabled?: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [cancellationOrderId, setCancellationOrderId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [modificationOrderId, setModificationOrderId] = useState<string | null>(null);
  const [modificationReason, setModificationReason] = useState('');
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewProductName, setReviewProductName] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [marketActivity, setMarketActivity] = useState<{ offers: Array<any>; bids: Array<any> }>({ offers: [], bids: [] });
  const [marketLoading, setMarketLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    fetch('/api/orders', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          setError(data.error);
          setOrders([]);
        } else {
          setError(null);
          setOrders(Array.isArray(data) ? data : []);
        }
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setError(`Failed to load orders: ${err.message || 'Unknown error'}`);
        setOrders([]);
      })
      .finally(() => setLoading(false));

    const fetchMarketActivity = async () => {
      try {
        const res = await fetch('/api/user/market-activity');
        if (res.ok) {
          const data = await res.json();
          setMarketActivity({ offers: data.offers || [], bids: data.bids || [] });
        }
      } catch (error) {
        console.error('Market activity fetch failed:', error);
      } finally {
        setMarketLoading(false);
      }
    };
    fetchMarketActivity();

    fetch('/api/business-settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          whatsapp: data.whatsapp,
          contactWhatsapp: data.contactWhatsapp,
          contactEmail: data.contactEmail,
          adminWhatsapp: data.adminWhatsapp,
          staffWhatsapp: data.staffWhatsapp,
          contactWhatsappColor: data.contactWhatsappColor || '#16a34a',
          contactEmailColor: data.contactEmailColor || '#1d4ed8',
          paymentVerificationStartTime: data.paymentVerificationStartTime || '09:00',
          paymentVerificationEndTime: data.paymentVerificationEndTime || '17:00',
          contactInfoEnabled: data.contactInfoEnabled !== false,
        });
      })
      .catch(() => {
        setSettings({});
      });
  }, [session, status, router]);

  if (status === 'loading') return <div className="p-8"><p>Loading...</p></div>;
  if (!session) return null;

  const changePassword = async () => {
    setPwdMsg(null);
    try {
      const res = await fetch(`/api/users/${session.user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdMsg(data.error || 'Failed');
      } else {
        setPwdMsg('Password changed');
        setCurrentPwd('');
        setNewPwd('');
        setChanging(false);
      }
    } catch (error) {
      console.error('Password change request failed:', error);
      setPwdMsg('Request failed');
    }
  };

  const requestReturn = async () => {
    if (!returnOrderId || !returnReason.trim()) return;

    try {
      const res = await fetch(`/api/orders/${returnOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnStatus: 'Return Requested', returnReason: returnReason.trim() }),
      });
      if (res.ok) {
        setReturnOrderId(null);
        setReturnReason('');
        // Refresh orders
        fetch('/api/orders')
          .then(res => res.json())
          .then(data => setOrders(data.error ? [] : data));
      }
    } catch (error) {
      console.error('Return request failed:', error);
    }
  };

  const requestCancellation = async () => {
    if (!cancellationOrderId || !cancellationReason.trim()) return;

    try {
      const res = await fetch(`/api/orders/${cancellationOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationStatus: 'Cancellation Requested', cancellationReason: cancellationReason.trim() }),
      });
      if (res.ok) {
        setCancellationOrderId(null);
        setCancellationReason('');
        // Refresh orders
        fetch('/api/orders')
          .then(res => res.json())
          .then(data => setOrders(data.error ? [] : data));
      }
    } catch (error) {
      console.error('Cancellation request failed:', error);
    }
  };

  const requestModification = async () => {
    if (!modificationOrderId || !modificationReason.trim()) return;

    try {
      const res = await fetch(`/api/orders/${modificationOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modificationRequest: 'Requested', modificationReason: modificationReason.trim() }),
      });
      if (res.ok) {
        setModificationOrderId(null);
        setModificationReason('');
        fetch('/api/orders')
          .then(res => res.json())
          .then(data => setOrders(data.error ? [] : data));
      }
    } catch (error) {
      console.error('Modification request failed:', error);
    }
  };

  const openReviewForm = (productId: string, productName: string) => {
    setReviewProductId(productId);
    setReviewProductName(productName);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
    setReviewMessage('');
  };

  const closeReviewForm = () => {
    setReviewProductId(null);
    setReviewProductName('');
    setReviewComment('');
    setReviewError('');
    setReviewMessage('');
  };

  const submitReview = async () => {
    if (!reviewProductId) return;
    setReviewError('');
    setReviewMessage('');
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a rating between 1 and 5 stars.');
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
      setReviewError('Review must be at least 10 characters.');
      return;
    }

    setReviewLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: reviewProductId, rating: reviewRating, comment: reviewComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || 'Failed to submit review.');
      } else {
        setReviewMessage('Review submitted successfully.');
        setReviewComment('');
        setReviewProductId(null);
        setReviewProductName('');
      }
    } catch (error) {
      console.error('Review submission failed:', error);
      setReviewError('Review submission failed. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const getVerificationTimeSlotString = () => {
    try {
      const startTime = settings.paymentVerificationStartTime || '09:00';
      const endTime = settings.paymentVerificationEndTime || '17:00';
      return `${startTime} to ${endTime}`;
    } catch {
      return '09:00 to 17:00';
    }
  };

  const sendOrderWhatsApp = (order: Order) => {
    const phone = settings.contactInfoEnabled === false ? '' : settings.contactWhatsapp || settings.whatsapp || settings.adminWhatsapp || settings.staffWhatsapp;
    if (!phone) {
      alert('No WhatsApp number configured or contact information is disabled. Please set a WhatsApp number in settings.');
      return;
    }

    const sanitizedPhone = phone.replace(/\D/g, '');
    if (!sanitizedPhone) {
      alert('Invalid WhatsApp number. Please enter a valid number in settings.');
      return;
    }

    const productLines = order.products
      .map(item => `${item.product ? item.product.name : 'Deleted Product'} x${item.quantity} @ ₹${item.product ? item.product.originalPrice : 0}`)
      .join('\n');

    const whatsappText = encodeURIComponent(
      `Order ID: ${order._id}\n` +
      `Date: ${new Date(order.createdAt).toLocaleString()}\n` +
      `Total: ₹${order.total.toFixed(2)}\n` +
      `Status: ${order.status}\n` +
      `Products:\n${productLines}\n` +
      `Shipping Name: ${order.shipping?.name || 'N/A'}\n` +
      `Contact: ${order.shipping?.mobile || 'N/A'}\n` +
      `Address: ${order.shipping?.address || 'N/A'}, ${order.shipping?.city || ''} ${order.shipping?.postalCode || ''}`
    );

    const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${whatsappText}`;
    window.open(whatsappUrl, '_blank');
  };

  const cleanInvoiceText = (value?: string) => {
    if (!value) return 'N/A';
    
    // Convert to string and handle basic cleaning
    let text = String(value);
    
    // Remove null bytes and control characters
    text = text.replace(/[\x00-\x1F\x7F]/g, ' ');
    
    // Normalize unicode characters
    text = text.normalize('NFKC');
    
    // Remove special characters that cause issues in PDF
    text = text.replace(/[&\uFF06]/g, ' and ');
    
    // Keep only valid characters: letters, numbers, spaces, and common punctuation
    text = text.replace(/[^\p{L}\p{N}\s.,:()\/\-@#]/gu, ' ');
    
    // Replace multiple spaces with single space
    text = text.replace(/\s+/g, ' ');
    
    // Trim and return
    return text.trim() || 'N/A';
  };

  // Helper function to create circular image for invoice
  const createCircularImage = async (imageUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 60;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        // Draw image scaled to fit
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  };

  const downloadInvoice = async (order: Order) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let top = 40;
    let leftMargin = 40;
    const rightMargin = 555;
    
    // Fetch all business settings
    let businessSettings = {
      websiteName: 'REFURBISHED PC STUDIO',
      invoiceLogo: '',
      gstin: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      upiId: '',
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    };
    
    try {
      const settingsRes = await fetch('/api/business-settings');
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        businessSettings = {
          websiteName: settings.websiteName || 'REFURBISHED PC STUDIO',
          invoiceLogo: settings.invoiceLogo || '',
          gstin: settings.gstin || '',
          businessAddress: settings.businessAddress || '',
          businessPhone: settings.businessPhone || '',
          businessEmail: settings.businessEmail || '',
          upiId: settings.upiId || '',
          bankName: settings.bankName || '',
          accountNumber: settings.accountNumber || '',
          ifscCode: settings.ifscCode || ''
        };
      }
    } catch (e) {
      console.error('Failed to fetch business settings:', e);
    }

    // Helper functions
    const addLine = (text: string, options: { size?: number; style?: 'normal' | 'bold'; align?: 'left' | 'center' | 'right' } = {}) => {
      const fontSize = options.size || 11;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', options.style === 'bold' ? 'bold' : 'normal');
      
      if (options.align === 'center') {
        doc.text(text, 297.5, top, { align: 'center' });
      } else if (options.align === 'right') {
        doc.text(text, rightMargin, top, { align: 'right' });
      } else {
        doc.text(text, leftMargin, top);
      }
      top += fontSize + 8;
    };

    const addHorizontalLine = (y: number) => {
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, y, rightMargin, y);
    };

    const addBox = (x: number, y: number, w: number, h: number) => {
      doc.setDrawColor(100);
      doc.setLineWidth(1);
      doc.rect(x, y, w, h);
    };

    // ===================== HEADER SECTION =====================
    // Add colored header background
    doc.setFillColor(30, 58, 138); // Dark blue
    doc.rect(0, 0, 595, 70, 'F');
    
    // Add invoice logo (circular) if available
    if (businessSettings.invoiceLogo) {
      try {
        const circularLogo = await createCircularImage(businessSettings.invoiceLogo);
        if (circularLogo) {
          doc.addImage(circularLogo, 'PNG', leftMargin + 5, 15, 40, 40);
        }
      } catch (e) {
        console.error('Failed to add invoice logo:', e);
      }
    }
    
    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(businessSettings.websiteName, leftMargin + 55, 35);
    
    // Invoice Label
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('TAX INVOICE', leftMargin + 55, 52);
    
    // Invoice Number on right
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #: ${cleanInvoiceText(order.orderNumber || String(order._id).slice(-8))}`, rightMargin, 30, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, rightMargin, 45, { align: 'right' });
    doc.text(`Status: ${order.status}`, rightMargin, 58, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    top = 80;

    // ===================== GST & BUSINESS INFO SECTION =====================
    if (businessSettings.gstin || businessSettings.businessAddress) {
      addBox(leftMargin, top - 10, 515, 45);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      addLine('Business Details', { size: 12, style: 'bold' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      let businessInfo = '';
      if (businessSettings.gstin) businessInfo += `GSTIN: ${businessSettings.gstin}  |  `;
      if (businessSettings.businessPhone) businessInfo += `Ph: ${businessSettings.businessPhone}  |  `;
      if (businessSettings.businessEmail) businessInfo += `Email: ${businessSettings.businessEmail}`;
      if (businessInfo) addLine(businessInfo, { size: 9 });
      
      if (businessSettings.businessAddress) {
        addLine(`Address: ${businessSettings.businessAddress}`, { size: 9 });
      }
      top += 10;
    }

    // ===================== BILL TO & SHIP TO SECTION =====================
    // Create two columns for billing and shipping
    const colWidth = 240;
    const col1X = leftMargin;
    const col2X = leftMargin + colWidth + 35;
    
    addBox(col1X, top - 5, colWidth, 70);
    addBox(col2X, top - 5, colWidth, 70);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To (Customer)', col1X + 10, top + 8);
    doc.text('Ship To (Shipping Address)', col2X + 10, top + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const billY = top + 22;
    doc.text(cleanInvoiceText(order.shipping?.name) || 'N/A', col1X + 10, billY);
    doc.text(cleanInvoiceText(order.shipping?.name) || 'N/A', col2X + 10, billY);
    
    const emailY = billY + 12;
    doc.text(`Email: ${cleanInvoiceText(order.shipping?.email) || 'N/A'}`, col1X + 10, emailY);
    doc.text(`Email: ${cleanInvoiceText(order.shipping?.email) || 'N/A'}`, col2X + 10, emailY);
    
    const mobileY = emailY + 12;
    doc.text(`Mobile: ${cleanInvoiceText(order.shipping?.mobile) || 'N/A'}`, col1X + 10, mobileY);
    doc.text(`Mobile: ${cleanInvoiceText(order.shipping?.mobile) || 'N/A'}`, col2X + 10, mobileY);
    
    const addressY = mobileY + 12;
    const address = [
      cleanInvoiceText(order.shipping?.address),
      cleanInvoiceText(order.shipping?.city),
      cleanInvoiceText(order.shipping?.postalCode),
      cleanInvoiceText(order.shipping?.country)
    ].filter(Boolean).join(', ');
    doc.text(address || 'N/A', col1X + 10, addressY, { maxWidth: colWidth - 15 });
    doc.text(address || 'N/A', col2X + 10, addressY, { maxWidth: colWidth - 15 });
    
    top += 80;

    // ===================== ORDER DETAILS SECTION =====================
    addHorizontalLine(top);
    top += 10;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    addLine('Order Information', { size: 13, style: 'bold' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    let infoY = top;
    doc.setFont('helvetica', 'bold');
    doc.text('Order ID:', leftMargin, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(cleanInvoiceText(order.orderNumber || String(order._id)), leftMargin + 90, infoY);

    infoY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Order Date:', leftMargin, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(order.createdAt).toLocaleDateString('en-IN'), leftMargin + 90, infoY);

    infoY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Status:', leftMargin, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(cleanInvoiceText(order.status), leftMargin + 90, infoY);

    infoY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction ID:', leftMargin, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(cleanInvoiceText(order.transactionId) || 'N/A', leftMargin + 90, infoY);

    if (order.trackingId) {
      infoY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Tracking ID:', leftMargin, infoY);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanInvoiceText(order.trackingId), leftMargin + 90, infoY);
    }
    if (order.deliveryCompanyName) {
      infoY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Courier:', leftMargin, infoY);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanInvoiceText(order.deliveryCompanyName), leftMargin + 90, infoY);
    }

    top = infoY + 20;

    // ===================== PRODUCTS TABLE =====================
    addHorizontalLine(top);
    top += 10;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    addLine('Product Details', { size: 13, style: 'bold' });
    
    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, top - 5, 515, 20, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('S.No', leftMargin + 5, top + 5);
    doc.text('Product Name', leftMargin + 30, top + 5);
    doc.text('Qty', leftMargin + 280, top + 5);
    doc.text('Price (₹)', leftMargin + 320, top + 5);
    doc.text('Total (₹)', leftMargin + 420, top + 5, { align: 'right' });
    
    top += 20;
    doc.setFont('helvetica', 'normal');
    
    // Table rows
    order.products.forEach((item, index) => {
      const productName = cleanInvoiceText(item.productName || item.product?.name || 'Deleted Product');
      const productPrice = Number.isFinite(item.price) ? item.price : (item.product?.originalPrice || 0);
      const total = productPrice * item.quantity;

      doc.text(`${index + 1}`, leftMargin + 5, top + 5);
      doc.text(productName.substring(0, 40), leftMargin + 30, top + 5);
      doc.text(String(item.quantity), leftMargin + 280, top + 5);
      doc.text(productPrice.toFixed(2), leftMargin + 320, top + 5);
      doc.text(total.toFixed(2), leftMargin + 420, top + 5, { align: 'right' });

      top += 15;
    });
    
    top += 10;
    addHorizontalLine(top);
    top += 15;

    // ===================== PAYMENT SUMMARY =====================
    const summaryX = leftMargin + 300;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', summaryX, top);
    const subtotal = order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    doc.text(`₹${subtotal.toFixed(2)}`, summaryX + 100, top, { align: 'right' });
    top += 15;

    if (order.discountAmount && order.discountAmount > 0) {
      doc.setTextColor(220, 50, 50);
      doc.text('Discount:', summaryX, top);
      doc.text(`-₹${order.discountAmount.toFixed(2)}`, summaryX + 100, top, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      top += 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', summaryX, top);
    doc.text(`₹${order.total.toFixed(2)}`, summaryX + 100, top, { align: 'right' });
    top += 25;

    // ===================== PAYMENT & BANK DETAILS =====================
    if (businessSettings.upiId || businessSettings.bankName) {
      addBox(leftMargin, top - 5, 515, 50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      addLine('Payment Details', { size: 11, style: 'bold' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      if (businessSettings.upiId) {
        addLine(`UPI ID: ${businessSettings.upiId}`, { size: 9 });
      }
      if (businessSettings.bankName) {
        addLine(`Bank: ${businessSettings.bankName} | A/C: ${businessSettings.accountNumber} | IFSC: ${businessSettings.ifscCode}`, { size: 9 });
      }
      top += 20;
    }

    // ===================== QR CODE SECTION =====================
    // Generate QR code with order info
    const qrData = `Order:${order.orderNumber || order._id}|Date:${new Date(order.createdAt).toISOString()}|Amount:₹${order.total}|Status:${order.status}`;
    try {
      // Simple QR code placeholder - in production, use a QR library
      doc.setFillColor(245, 245, 245);
      doc.rect(leftMargin, top, 80, 80, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(leftMargin, top, 80, 80);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Scan to verify', leftMargin + 40, top + 35, { align: 'center' });
      doc.text('Order Details', leftMargin + 40, top + 45, { align: 'center' });
      
      // Add order summary in QR box
      doc.setFontSize(7);
      const qrSummary = [
        `Order: ${cleanInvoiceText(order.orderNumber || String(order._id)).slice(-8)}`,
        `Amount: ₹${order.total.toFixed(2)}`,
        `Status: ${cleanInvoiceText(order.status)}`
      ];
      qrSummary.forEach((line, i) => {
        doc.text(line, leftMargin + 40, top + 58 + (i * 8), { align: 'center' });
      });
    } catch (e) {
      console.error('Failed to add QR code:', e);
    }

    // ===================== TRACKING INFO =====================
    const trackingX = leftMargin + 100;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    addLine('Shipping Tracking', { size: 10, style: 'bold' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (order.trackingId) {
      addLine(`Tracking ID: ${cleanInvoiceText(order.trackingId)}`, { size: 9 });
    }
    if (order.deliveryCompanyName) {
      addLine(`Courier: ${cleanInvoiceText(order.deliveryCompanyName)}`, { size: 9 });
    }
    if (order.deliveryCompanyDetails) {
      addLine(`Info: ${cleanInvoiceText(order.deliveryCompanyDetails)}`, { size: 9 });
    }
    if (!order.trackingId && !order.deliveryCompanyName) {
      addLine('Tracking details will be updated once shipped', { size: 9 });
    }

    // ===================== FOOTER =====================
    top = 720;
    addHorizontalLine(top);
    top += 10;
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your purchase!', 297.5, top, { align: 'center' });
    top += 12;
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')} | ${businessSettings.websiteName}`, 297.5, top, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Save the PDF
    doc.save(`invoice-${cleanInvoiceText(order.orderNumber || String(order._id)).slice(-8)}.pdf`);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <h1 className="text-5xl font-black mb-2 text-blue-950 dark:text-cyan-100 leading-tight drop-shadow-lg" aria-label="My Orders" style={{ textShadow: '0 0 12px rgba(0,0,0,.35)' }}>
        My Orders
      </h1>
      <p className="mb-6 text-lg font-semibold text-slate-800 dark:text-slate-100 drop-shadow-sm">Track your latest purchases and manage returns/cancellations.</p>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-700 font-semibold">⚠️ Error:</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); window.location.reload(); }} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <>
          {(marketLoading ? true : marketActivity.offers.length > 0 || marketActivity.bids.length > 0) && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-emerald-900">🎯 Bargain & Auction Activity</h3>
              {marketLoading ? (
                <p className="text-sm text-emerald-800">Loading your bargain and bid status...</p>
              ) : (
                <div className="space-y-3">
                  {marketActivity.offers.map((offer) => (
                    <div key={`offer-${offer.productId}-${offer.createdAt}`} className="rounded-lg bg-white p-3 border border-emerald-200">
                      <div className="flex flex-col md:flex-row md:justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-700 font-semibold">Bargain Offer for {offer.productName}</p>
                          <p className="text-sm text-gray-600">Offered: ₹{offer.price.toFixed(2)}</p>
                        </div>
                        <div className="text-sm text-gray-700">
                          Status: <span className="font-semibold">{offer.status}</span>
                        </div>
                      </div>
                      {offer.couponCode && (
                        <p className="mt-2 text-sm text-green-800">Coupon: <strong>{offer.couponCode}</strong> (valid until {offer.reservedUntil ? new Date(offer.reservedUntil).toLocaleDateString() : 'N/A'})</p>
                      )}
                    </div>
                  ))}
                  {marketActivity.bids.map((bid) => (
                    <div key={`bid-${bid.productId}-${bid.createdAt}`} className="rounded-lg bg-white p-3 border border-emerald-200">
                      <div className="flex flex-col md:flex-row md:justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-700 font-semibold">Auction Bid for {bid.productName}</p>
                          <p className="text-sm text-gray-600">Bid: ₹{bid.price.toFixed(2)}</p>
                        </div>
                        <div className="text-sm text-gray-700">
                          Status: <span className="font-semibold">{bid.status}</span>
                        </div>
                      </div>
                      {bid.couponCode && (
                        <p className="mt-2 text-sm text-green-800">Coupon: <strong>{bid.couponCode}</strong> (valid until {bid.reservedUntil ? new Date(bid.reservedUntil).toLocaleDateString() : 'N/A'})</p>
                      )}
                    </div>
                  ))}
                  {marketActivity.offers.length === 0 && marketActivity.bids.length === 0 && (
                    <p className="text-sm text-gray-700">No bargain or bidding activity to show yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
          {orders.some(order => order.status === 'Payment Pending' || order.status === 'Payment Completed') && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">⏱️ Payment Verification Time</h3>
              <p className="text-sm text-blue-800 mb-1">Your payment will be verified during admin working hours:</p>
              <p className="text-lg font-bold text-blue-900">{settings.paymentVerificationStartTime || '09:00'} to {settings.paymentVerificationEndTime || '17:00'}</p>
              <p className="text-xs text-blue-700 mt-2">आपके भुगतान का सत्यापन इन कार्य घंटों के दौरान किया जाएगा</p>
            </div>
          )}
          {changing && (
            <div className="mb-6 p-4 border rounded bg-white">
              <h2 className="font-semibold mb-2">Change Password</h2>
              {pwdMsg && <p className="text-sm text-center mb-2">{pwdMsg}</p>}
              <input
                type="password"
                placeholder="Current password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full mb-2 p-2 border rounded"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full mb-2 p-2 border rounded"
              />
              <div className="flex gap-2">
                <button onClick={changePassword} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                <button onClick={() => setChanging(false)} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              </div>
            </div>
          )}
          {returnOrderId && (
            <div className="mb-6 p-4 border rounded bg-white">
              <h2 className="font-semibold mb-2">Request Return</h2>
              <textarea
                placeholder="Please provide reason for return"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full mb-2 p-2 border rounded"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={requestReturn} className="px-3 py-1 bg-orange-600 text-white rounded">Submit Return Request</button>
                <button onClick={() => { setReturnOrderId(null); setReturnReason(''); }} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              </div>
            </div>
          )}
          {cancellationOrderId && (
            <div className="mb-6 p-4 border rounded bg-white">
              <h2 className="font-semibold mb-2">Request Cancellation</h2>
              <textarea
                placeholder="Please provide reason for cancellation"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full mb-2 p-2 border rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={requestCancellation} className="px-3 py-1 bg-red-600 text-white rounded">Submit Cancellation Request</button>
                <button onClick={() => { setCancellationOrderId(null); setCancellationReason(''); }} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              </div>
            </div>
          )}
          {modificationOrderId && (
            <div className="mb-6 p-4 border rounded bg-white">
              <h2 className="font-semibold mb-2">Request Order Modification</h2>
              <textarea
                placeholder="Please explain what you want to modify"
                value={modificationReason}
                onChange={(e) => setModificationReason(e.target.value)}
                className="w-full mb-2 p-2 border rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={requestModification} className="px-3 py-1 bg-blue-600 text-white rounded">Submit Modification Request</button>
                <button onClick={() => { setModificationOrderId(null); setModificationReason(''); }} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              </div>
            </div>
          )}
          {reviewProductId && (
            <div className="mb-6 p-4 border rounded bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-lg">Review {reviewProductName}</h2>
                  <p className="text-sm text-gray-600">Leave your review for the delivered product.</p>
                </div>
                <button onClick={closeReviewForm} className="text-gray-500 hover:text-gray-900">✕</button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${reviewRating === star ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share your experience with this product."
                />
              </div>
              {reviewError && <p className="text-sm text-red-600 mb-3">{reviewError}</p>}
              {reviewMessage && <p className="text-sm text-green-700 mb-3">{reviewMessage}</p>}
              <div className="flex gap-2">
                <button onClick={submitReview} disabled={reviewLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{reviewLoading ? 'Submitting...' : 'Submit Review'}</button>
                <button onClick={closeReviewForm} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          )}
          <button onClick={() => setChanging(true)} className="mb-4 text-blue-600">Change Password</button>
          <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Order ID</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Date</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Products</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Total</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Status</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Return Status</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Refund Status</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Cancellation Status</th>
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <React.Fragment key={order._id}>
                <tr className="border-t bg-white even:bg-gray-50">
                  <td className="p-2 text-gray-800">{order.orderNumber || order._id.slice(-8)}</td>
                <td className="p-2">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="p-2 space-y-2">
                  {order.products.map((item, idx) => (
                    <div key={`${order._id}-${item.product?._id || 'deleted'}-${idx}`} className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>{item.product ? item.product.name : 'Deleted Product'} x{item.quantity}</span>
                        {order.status === 'Delivered' && item.product?._id ? (
                          <button
                            onClick={() => openReviewForm(item.product!._id, item.product!.name)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Review
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </td>
                <td className="p-2">₹{order.total.toFixed(2)}</td>
                <td className="p-2">
                  <div>
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      order.status === 'Payment Pending' ? 'bg-orange-100 text-orange-800' :
                      order.status === 'Payment Completed' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Payment Verified' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'Payment Rejected' ? 'bg-red-100 text-red-800' :
                      order.status === 'Order Preparing' ? 'bg-sky-100 text-sky-800' :
                      order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'Order Rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'Payment Completed' ? 'Payment Completed (पेमेंट पूरा, admin सत्यापन बाकी)' : order.status}
                    </span>
                  </div>
                  {order.status === 'Payment Completed' && (
                    <p className="text-xs text-orange-700 mt-1">
                      Payment completed but not verified by admin. <br /> भुगतान अभी तक admin द्वारा सत्यापित नहीं हुआ है। <br />
                      Admin सत्यापन समय: {getVerificationTimeSlotString()} (Admin सेट समय स्लॉट)
                    </p>
                  )}
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    order.returnStatus === 'No Return' ? 'bg-gray-100 text-gray-700' :
                    order.returnStatus === 'Return Requested' ? 'bg-orange-100 text-orange-800' :
                    order.returnStatus === 'Return Approved' ? 'bg-emerald-100 text-emerald-800' :
                    order.returnStatus === 'Return Rejected' ? 'bg-red-100 text-red-800' :
                    order.returnStatus === 'Return Received' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.returnStatus}
                  </span>
                  {order.returnReason && (
                    <div className="text-xs text-gray-700 font-medium mt-1">
                      Reason: {order.returnReason}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    order.refundStatus === 'No Refund' ? 'bg-gray-100 text-gray-700' :
                    order.refundStatus === 'Refund Pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.refundStatus === 'Refund Approved' ? 'bg-green-100 text-green-800' :
                    order.refundStatus === 'Refund Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-indigo-100 text-indigo-800'
                  }`}>
                    {order.refundStatus}
                  </span>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    order.cancellationStatus === 'None' ? 'bg-gray-100 text-gray-700' :
                    order.cancellationStatus === 'Cancellation Requested' ? 'bg-orange-100 text-orange-800' :
                    order.cancellationStatus === 'Cancellation Approved' ? 'bg-emerald-100 text-emerald-800' :
                    order.cancellationStatus === 'Cancellation Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.cancellationStatus}
                  </span>
                  {order.cancellationReason && (
                    <div className="text-xs text-gray-900 font-medium mt-1">
                      Reason: {order.cancellationReason}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  {order.status !== 'Delivered' && order.cancellationStatus === 'None' && order.modificationRequest?.status !== 'Requested' && (
                    <button
                      onClick={() => setModificationOrderId(order._id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 mr-2"
                    >
                      Request Modification
                    </button>
                  )}
                  {order.status !== 'Delivered' && order.modificationRequest?.status === 'Requested' && (
                    <span className="inline-flex px-3 py-1 rounded text-sm bg-blue-100 text-blue-800 mr-2">
                      Modification requested
                    </span>
                  )}
                  {order.status !== 'Delivered' && order.cancellationStatus === 'None' && (
                    <button
                      onClick={() => setCancellationOrderId(order._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 mr-2"
                    >
                      Request Cancellation
                    </button>
                  )}
                  {order.status === 'Delivered' && order.returnStatus === 'No Return' && order.returnDeadline && new Date(order.returnDeadline) > new Date() && (
                    <button
                      onClick={() => setReturnOrderId(order._id)}
                      className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 mr-2"
                    >
                      Request Return
                    </button>
                  )}
                  {settings.contactInfoEnabled !== false && (settings.contactWhatsapp || settings.whatsapp || settings.adminWhatsapp || settings.staffWhatsapp) && (
                    <button
                      onClick={() => sendOrderWhatsApp(order)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 mr-2"
                    >
                      Share Order on WhatsApp
                    </button>
                  )}
                  {['Payment Verified', 'Order Preparing', 'Shipped', 'Delivered'].includes(order.status) && (
                    <button
                      onClick={() => downloadInvoice(order)}
                      className="px-3 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-800"
                    >
                      Download Invoice
                    </button>
                  )}
                </td>
              </tr>
              {(order.trackingId || order.deliveryCompanyName || order.deliveryCompanyDetails) && (
                <tr className="bg-slate-50">
                  <td colSpan={9} className="p-3 text-sm text-slate-700 border-t border-slate-200">
                    <div className="font-semibold mb-1">Delivery Details</div>
                    {order.deliveryCompanyName && <div><span className="font-medium">Company:</span> {order.deliveryCompanyName}</div>}
                    {order.trackingId && <div><span className="font-medium">Tracking ID:</span> {order.trackingId}</div>}
                    {order.deliveryCompanyDetails && <div><span className="font-medium">Details:</span> {order.deliveryCompanyDetails}</div>}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}
