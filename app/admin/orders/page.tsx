'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface OrderItem {
  _id: string;
  customer: { name: string; email: string; mobile: string; customerId?: string };
  total: number;
  discountAmount: number;
  discountCoupon?: string;
  discountBreakdown?: {
    manualCoupon: number;
    referralDiscount: number;
    firstOrderDiscount: number;
  };
  shippingCharges?: number;
  shippingState?: string;
  status: string;
  returnStatus: string;
  refundStatus: string;
  cancellationStatus: string;
  cancellationReason?: string;
  returnReason?: string;
  transactionId?: string;
  paymentScreenshot?: string;
  paymentMethod?: string;
  paymentDetails?: any;
  createdAt: string;
  deliveryCompanyName?: string;
  deliveryCompanyDetails?: string;
  trackingId?: string;
  shipping?: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    mobile: string;
  };
  products: { product: { _id: string; name: string } | null; quantity: number; price: number; gstPercent: number; discountPercent: number }[];
}

export default function AdminOrders() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [settings, setSettings] = useState<{ paymentVerificationStartTime?: string; paymentVerificationEndTime?: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateFilterEnabled, setDateFilterEnabled] = useState(true);
  const [cleanupThreshold, setCleanupThreshold] = useState(6);
  const [cleanupUnit, setCleanupUnit] = useState<'months' | 'years'>('months');
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [deliveryEditOrderId, setDeliveryEditOrderId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [customReportFromDate, setCustomReportFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customReportToDate, setCustomReportToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTab, setSelectedTab] = useState<string>('New Orders');
  const [bulkSelection, setBulkSelection] = useState<Record<string, boolean>>({});
  const [bulkAction, setBulkAction] = useState<string>('');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [deliveryCompanyName, setDeliveryCompanyName] = useState('');
  const [deliveryCompanyDetails, setDeliveryCompanyDetails] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const isAdmin = session?.user?.role === 'admin';

  const statusTabs = [
    'All Orders',
    'New Orders',
    'Pending Payment',
    'Verify Payment',
    'Paid',
    'Packed',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Return Requested',
    'Return Approved',
    'Return Rejected',
    'Refund Pending',
    'Refund Approved',
    'Refund Processed',
    'Disputes'
  ];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verify session exists
      if (!session) {
        throw new Error('Not authenticated. Please log in.');
      }
      
      const res = await fetch('/api/orders', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch orders: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error instanceof Error ? error.message : 'Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user?.role === 'admin' || session?.user?.role === 'staff')) {
      fetchOrders();
    }
  }, [status, session, fetchOrders]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/business-settings');
        if (!res.ok) return;
        const data = await res.json();
        setSettings({
          paymentVerificationStartTime: data.paymentVerificationStartTime || '09:00',
          paymentVerificationEndTime: data.paymentVerificationEndTime || '17:00',
        });
      } catch (err) {
        console.error('Failed to load business settings', err);
      }
    };
    fetchSettings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      console.log('updateStatus', id, status);
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error || `Failed to update status (${res.status})`;
        console.error('Order update failed:', message, data);
        alert(message);
        return;
      }
      const updatedOrder = await res.json();
      console.log('Order updated successfully:', updatedOrder);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const updateReturnStatus = async (id: string, returnStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update return status');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error updating return status:', error);
      alert('Failed to update return status');
    }
  };

  const updateRefundStatus = async (id: string, refundStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update refund status');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error updating refund status:', error);
      alert('Failed to update refund status');
    }
  };

  const updateCancellationStatus = async (id: string, cancellationStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update cancellation status');
      }
      fetchOrders();
    } catch (error) {
      console.error('Error updating cancellation status:', error);
      alert('Failed to update cancellation status');
    }
  };

  const deleteOrder = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm('Are you sure you want to delete this cancelled/rejected order? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchOrders();
        if (!skipConfirm) alert('Order deleted successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const sendToDeliveryPartner = async (id: string) => {
    try {
      console.log('Sending order to delivery partner:', id);
      const res = await fetch(`/api/orders/${id}/send-to-delivery`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error || `Failed to send to delivery partner (${res.status})`;
        console.error('Send to delivery partner failed:', message, data);
        alert(message);
        return;
      }
      
      const result = await res.json();
      console.log('Order sent to delivery partner successfully:', result);
      alert(`Order sent to delivery partner successfully!\nTracking ID: ${result.trackingId || 'N/A'}\nCourier: ${result.deliveryCompanyName || 'N/A'}`);
      fetchOrders();
    } catch (error) {
      console.error('Error sending to delivery partner:', error);
      alert(error instanceof Error ? error.message : 'Failed to send to delivery partner');
    }
  };

  const cleanupOldOrders = async () => {
    if (!confirm(`This will permanently delete all orders older than ${cleanupThreshold} ${cleanupUnit}. Continue?`)) {
      return;
    }

    setCleanupLoading(true);
    try {
      const res = await fetch('/api/orders/cleanup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholdValue: cleanupThreshold, thresholdUnit: cleanupUnit }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete old orders');
      }

      fetchOrders();
      alert(`Deleted ${data.deletedCount || 0} orders older than ${cleanupThreshold} ${cleanupUnit}.`);
    } catch (error) {
      console.error('Order cleanup failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete old orders');
    } finally {
      setCleanupLoading(false);
    }
  };

  const getVerificationTimeSlotString = () => {
    try {
      const startTime = settings.paymentVerificationStartTime || '09:00';
      const endTime = settings.paymentVerificationEndTime || '17:00';
      return `${startTime} to ${endTime}`;
    } catch (_e) {
      return '09:00 to 17:00';
    }
  };

  const openImage = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  const isVerifyPaymentOrder = (order: OrderItem) => {
    const hasProof = Boolean(order.paymentScreenshot || order.transactionId || (order as any).paymentDetails?.upiRef);
    return hasProof && (order.status === 'Payment Completed' || order.status === 'Payment Processing' || order.status === 'Payment Pending');
  };

  const getOrdersForTab = () => {
    switch (selectedTab) {
      case 'All Orders':
        return orders;
      case 'New Orders':
        return orders.filter(order => order.status === 'Payment Pending' && !isVerifyPaymentOrder(order));
      case 'Pending Payment':
        return orders.filter(order => order.status === 'Payment Pending' && isVerifyPaymentOrder(order));
      case 'Verify Payment':
        return orders.filter(order => isVerifyPaymentOrder(order));
      case 'Paid':
        return orders.filter(order => order.status === 'Payment Verified');
      case 'Packed':
        return orders.filter(order => order.status === 'Order Preparing');
      case 'Shipped':
        return orders.filter(order => order.status === 'Shipped');
      case 'Delivered':
        return orders.filter(order => order.status === 'Delivered');
      case 'Cancelled':
        return orders.filter(order => order.status === 'Order Rejected' || order.cancellationStatus === 'Cancellation Approved' || order.cancellationStatus === 'Cancellation Requested');
      case 'Return Requested':
        return orders.filter(order => order.returnStatus === 'Return Requested');
      case 'Return Approved':
        return orders.filter(order => order.returnStatus === 'Return Approved');
      case 'Return Rejected':
        return orders.filter(order => order.returnStatus === 'Return Rejected');
      case 'Refund Pending':
        return orders.filter(order => order.refundStatus === 'Refund Pending');
      case 'Refund Approved':
        return orders.filter(order => order.refundStatus === 'Refund Approved');
      case 'Refund Processed':
        return orders.filter(order => order.refundStatus === 'Refund Processed');
      case 'Disputes':
        return orders.filter(order => order.status === 'Payment Rejected' || order.cancellationStatus === 'Cancellation Requested' || order.returnStatus === 'Return Requested' || order.refundStatus === 'Refund Pending' || order.refundStatus === 'Refund Approved');
      default:
        return orders;
    }
  };

  const filteredOrdersByDate = dateFilterEnabled
    ? getOrdersForTab().filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
      })
    : getOrdersForTab();

  const filteredOrders = filteredOrdersByDate.filter(order => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      order._id.toLowerCase().includes(q) ||
      order.customer?.name?.toLowerCase().includes(q) ||
      order.customer?.email?.toLowerCase().includes(q) ||
      order.customer?.mobile?.toLowerCase().includes(q) ||
      order.customer?.customerId?.toLowerCase().includes(q) ||
      order.transactionId?.toLowerCase().includes(q) ||
      order.products.some(item => item.product?.name?.toLowerCase().includes(q))
    );
  });

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalCancelled = filteredOrders.filter(order => order.status === 'Order Rejected' || order.cancellationStatus === 'Cancellation Approved').length;
  const totalRejected = filteredOrders.filter(order => order.status === 'Payment Rejected').length;
  const totalPaymentVerified = filteredOrders.filter(order => order.status === 'Payment Verified').length;
  const totalReturns = filteredOrders.filter(order => order.returnStatus === 'Return Approved').length;
  const totalRefunds = filteredOrders.reduce((sum, order) => sum + (order.returnStatus === 'Return Approved' ? (order.total || 0) : 0), 0);

  const selectedOrderIds = Object.keys(bulkSelection).filter(id => bulkSelection[id]);
  const selectedOrders = filteredOrders.filter(order => selectedOrderIds.includes(order._id));

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrderIds.length === 0) {
      alert('Please choose a bulk action and select at least one order.');
      return;
    }

    setStatusChangeLoading(true);
    try {
      if (bulkAction === 'Approve Return') {
        await Promise.all(selectedOrderIds.map(id => updateReturnStatus(id, 'Return Approved')));
      } else if (bulkAction === 'Reject Return') {
        await Promise.all(selectedOrderIds.map(id => updateReturnStatus(id, 'Return Rejected')));
      } else if (bulkAction === 'Process Refund') {
        await Promise.all(selectedOrderIds.map(id => updateRefundStatus(id, 'Refund Processed')));
      } else if (bulkAction === 'Send to Delivery Partner') {
        await Promise.all(selectedOrderIds.map(id => sendToDeliveryPartner(id)));
      } else {
        const actionToStatus: Record<string, string> = {
          'Mark Payment Verified': 'Payment Verified',
          'Approve Payment': 'Payment Verified',
          'Reject Payment': 'Payment Rejected',
          'Pack': 'Order Preparing',
          'Ship': 'Shipped',
          'Deliver': 'Delivered',
          'Cancel': 'Order Rejected'
        };

        const status = actionToStatus[bulkAction];
        if (!status) {
          alert('Unsupported bulk action.');
          return;
        }

        await Promise.all(selectedOrderIds.map(id => updateStatus(id, status)));
      }
      setBulkSelection({});
      setBulkAction('');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  // Generate printable report PDF
  const generatePrintReport = async (reportType: 'daily' | 'monthly' | 'custom') => {
    try {
      let reportOrders = orders;
      let reportTitle = '';
      let dateRange = '';

      if (reportType === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        reportOrders = orders.filter(order => new Date(order.createdAt).toISOString().split('T')[0] === today);
        reportTitle = 'Daily Orders Report';
        dateRange = `Date: ${new Date().toLocaleDateString('en-IN')}`;
      } else if (reportType === 'monthly') {
        const [year, month] = selectedMonth.split('-');
        reportOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getFullYear() === Number(year) && orderDate.getMonth() === Number(month) - 1;
        });
        reportTitle = 'Monthly Orders Report';
        dateRange = `Month: ${new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
      } else {
        reportOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          return orderDate >= customReportFromDate && orderDate <= customReportToDate;
        });
        reportTitle = 'Custom Date Range Report';
        dateRange = `From: ${new Date(customReportFromDate).toLocaleDateString('en-IN')} To: ${new Date(customReportToDate).toLocaleDateString('en-IN')}`;
      }

      if (reportOrders.length === 0) {
        alert('No orders found for the selected report period. Please adjust the dates.');
        return;
      }

      const reportTotalOrders = reportOrders.length;
      const reportTotalRevenue = reportOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const reportTotalCancelled = reportOrders.filter(order => order.status === 'Order Rejected' || order.cancellationStatus === 'Cancellation Approved').length;
      const reportTotalRejected = reportOrders.filter(order => order.status === 'Payment Rejected').length;
      const reportTotalPaymentVerified = reportOrders.filter(order => order.status === 'Payment Verified').length;
      const reportTotalReturns = reportOrders.filter(order => order.returnStatus === 'Return Approved').length;
      const reportTotalRefunds = reportOrders.reduce((sum, order) => sum + (order.returnStatus === 'Return Approved' ? (order.total || 0) : 0), 0);
      let businessSettings = { websiteName: 'REFURBISHED PC STUDIO', invoiceLogo: '' };
      try {
        const settingsRes = await fetch('/api/business-settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          businessSettings = {
            websiteName: settings.websiteName || 'REFURBISHED PC STUDIO',
            invoiceLogo: settings.invoiceLogo || ''
          };
        }
      } catch (e) {
        console.error('Failed to fetch settings:', e);
      }

      // Create circular logo function
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
            if (!ctx) { resolve(null); return; }
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
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

      // Dynamic import jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      let top = 40;
      const leftMargin = 40;
      const rightMargin = 555;

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

      // ===================== HEADER =====================
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 595, 60, 'F');

      // Add logo if available
      if (businessSettings.invoiceLogo) {
        try {
          const circularLogo = await createCircularImage(businessSettings.invoiceLogo);
          if (circularLogo) {
            doc.addImage(circularLogo, 'PNG', leftMargin + 5, 10, 40, 40);
          }
        } catch (e) {
          console.error('Failed to add logo:', e);
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(businessSettings.websiteName, leftMargin + 55, 25);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(reportTitle, leftMargin + 55, 42);

      // Date range on right
      doc.setFontSize(10);
      doc.text(dateRange, rightMargin, 25, { align: 'right' });
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, rightMargin, 38, { align: 'right' });
      doc.text(`Total Orders: ${reportTotalOrders}`, rightMargin, 50, { align: 'right' });

      doc.setTextColor(0, 0, 0);
      top = 75;

      // ===================== SUMMARY SECTION =====================
      addHorizontalLine(top);
      top += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      addLine('Summary', { size: 14, style: 'bold' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      // Summary boxes
      const summaryData = [
        { label: 'Total Orders', value: reportTotalOrders.toString(), color: [79, 70, 229] },
        { label: 'Total Revenue', value: `Rs ${reportTotalRevenue.toFixed(2)}`, color: [22, 163, 74] },
        { label: 'Payment Verified', value: reportTotalPaymentVerified.toString(), color: [249, 115, 22] },
        { label: 'Returns', value: reportTotalReturns.toString(), color: [220, 38, 38] },
        { label: 'Refunds', value: `Rs ${reportTotalRefunds.toFixed(2)}`, color: [220, 38, 38] },
        { label: 'Cancelled/Rejected', value: (reportTotalCancelled + reportTotalRejected).toString(), color: [220, 38, 38] }
      ];

      let col = 0;
      summaryData.forEach((item, index) => {
        const x = leftMargin + (col * 170);
        const y = top;
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.rect(x, y, 160, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(item.label, x + 10, y + 12);
        doc.setFontSize(14);
        doc.text(item.value, x + 10, y + 26);
        col = (col + 1) % 3;
        if (index === 2) {
          top += 45;
          col = 0;
        }
      });

      top += 50;

      // ===================== ORDERS LIST =====================
      addHorizontalLine(top);
      top += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      addLine('Order Details', { size: 14, style: 'bold' });

      const tableColumns = [
        { label: 'S.No', x: leftMargin + 5, width: 25, align: 'left' },
        { label: 'Order ID', x: leftMargin + 35, width: 65, align: 'left' },
        { label: 'Customer', x: leftMargin + 105, width: 70, align: 'left' },
        { label: 'Date', x: leftMargin + 185, width: 55, align: 'left' },
        { label: 'Status', x: leftMargin + 245, width: 60, align: 'left' },
        { label: 'Return', x: leftMargin + 315, width: 60, align: 'left' },
        { label: 'Amount (₹)', x: rightMargin, width: 60, align: 'right' }
      ];

      doc.setFillColor(228, 228, 228);
      doc.rect(leftMargin, top - 5, 515, 18, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      tableColumns.forEach(col => {
        doc.text(col.label, col.x, top + 4, { align: col.align as any });
      });

      top += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      reportOrders.slice(0, 50).forEach((order, index) => {
        if (top > 700) {
          doc.addPage();
          top = 40;
        }

        const rowBg = index % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
        doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
        doc.rect(leftMargin, top - 3, 515, 14, 'F');

        doc.setTextColor(0, 0, 0);
        const customerText = (order.customer?.name || 'N/A').substring(0, 16);
        const statusText = (order.status || 'N/A').substring(0, 10);
        const returnText = (order.returnStatus || 'No Return').substring(0, 10);

        doc.text(`${index + 1}`, tableColumns[0].x, top + 5, { align: 'left' });
        doc.text(String(order._id).slice(-8), tableColumns[1].x, top + 5, { maxWidth: tableColumns[1].width, align: 'left' });
        doc.text(customerText, tableColumns[2].x, top + 5, { maxWidth: tableColumns[2].width, align: 'left' });
        doc.text(new Date(order.createdAt).toLocaleDateString('en-IN'), tableColumns[3].x, top + 5, { align: 'left' });
        doc.text(statusText, tableColumns[4].x, top + 5, { maxWidth: tableColumns[4].width, align: 'left' });
        doc.text(returnText, tableColumns[5].x, top + 5, { maxWidth: tableColumns[5].width, align: 'left' });
        doc.text((order.total || 0).toFixed(2), tableColumns[6].x, top + 5, { align: 'right' });

        top += 14;
      });

      if (reportOrders.length > 50) {
        top += 10;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(0, 0, 0);
        addLine(`... and ${reportOrders.length - 50} more orders`, { size: 9 });
      }

      // ===================== FOOTER =====================
      top = 720;
      addHorizontalLine(top);
      top += 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Thank you for using our system!', 297.5, top, { align: 'center' });
      top += 10;
      doc.text(`Report generated on ${new Date().toLocaleString('en-IN')} | ${businessSettings.websiteName}`, 297.5, top, { align: 'center' });

      // Save PDF
      const fileName = reportType === 'daily' 
        ? `daily-report-${new Date().toISOString().split('T')[0]}.pdf`
        : reportType === 'monthly'
        ? `monthly-report-${selectedMonth}.pdf`
        : `orders-report-${customReportFromDate}-to-${customReportToDate}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };


  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading orders...</div>;
  }

  const startDeliveryEdit = (order: OrderItem) => {
    setDeliveryEditOrderId(order._id);
    setDeliveryCompanyName(order.deliveryCompanyName || '');
    setDeliveryCompanyDetails(order.deliveryCompanyDetails || '');
    setTrackingId(order.trackingId || '');
  };

  const cancelDeliveryEdit = () => {
    setDeliveryEditOrderId(null);
    setDeliveryCompanyName('');
    setDeliveryCompanyDetails('');
    setTrackingId('');
  };

  const saveDeliveryDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryCompanyName, deliveryCompanyDetails, trackingId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save delivery details');
      }
      setDeliveryEditOrderId(null);
      setDeliveryCompanyName('');
      setDeliveryCompanyDetails('');
      setTrackingId('');
      fetchOrders();
      alert('Delivery details saved successfully');
    } catch (error) {
      console.error('Save delivery details failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to save delivery details');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Professional order workflow with smart status tabs, payment verification queue and bulk actions.</p>
        </div>

        <div className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">Workflow tabs</p>
              <h2 className="text-2xl font-semibold text-slate-900">Select a tab to focus your queue</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 ${selectedTab === tab ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 border border-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-3xl bg-blue-50 border border-blue-100 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-700">Filtered orders</p>
              <p className="mt-4 text-3xl font-semibold text-blue-900">{filteredOrders.length}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Revenue</p>
              <p className="mt-4 text-3xl font-semibold text-emerald-900">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Verification queue</p>
              <p className="mt-4 text-3xl font-semibold text-amber-900">{orders.filter(isVerifyPaymentOrder).length}</p>
            </div>
            <div className="rounded-3xl bg-rose-50 border border-rose-100 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-rose-700">Cancelled / Rejected</p>
              <p className="mt-4 text-3xl font-semibold text-rose-900">{totalCancelled + totalRejected}</p>
            </div>
            <div className="rounded-3xl bg-sky-50 border border-sky-100 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-700">Payment verified</p>
              <p className="mt-4 text-3xl font-semibold text-sky-900">{totalPaymentVerified}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[1fr_300px]">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">Quick search</p>
                <p className="mt-2 text-sm text-slate-600">Search orders, customers, mobile numbers, or payment references.</p>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search order ID / customer / UPI ref"
                className="w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500 font-semibold">Filters</p>
                <div className="mt-4 space-y-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={dateFilterEnabled}
                      onChange={(e) => setDateFilterEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    Enable date filter
                  </label>
                  <div className="grid gap-3">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      disabled={!dateFilterEnabled}
                      className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm"
                    />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      disabled={!dateFilterEnabled}
                      className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500 font-semibold">Bulk action</p>
                <div className="mt-4 space-y-3">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm"
                  >
                    <option value="">Select action</option>
                    <option value="Mark Payment Verified">Mark Payment Verified</option>
                    <option value="Reject Payment">Reject Payment</option>
                    <option value="Send to Delivery Partner">Send to Delivery Partner</option>
                    <option value="Pack">Pack</option>
                    <option value="Ship">Ship</option>
                    <option value="Deliver">Deliver</option>
                    <option value="Cancel">Cancel</option>
                    <option value="Approve Return">Approve Return</option>
                    <option value="Reject Return">Reject Return</option>
                    <option value="Process Refund">Process Refund</option>
                    <option value="Delete">Delete Orders</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction || statusChangeLoading}
                    className="w-full rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {statusChangeLoading ? 'Applying...' : `Apply to ${selectedOrderIds.length} selected`}
                  </button>
                  <p className="text-xs text-slate-500">Select orders from the table below to update the workflow in bulk.</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl bg-white border border-gray-200 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500 font-semibold">Report tools</p>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-3">
                  <p className="text-sm font-semibold text-slate-900">Monthly report</p>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm"
                  />
                  <button
                    onClick={() => generatePrintReport('monthly')}
                    className="w-full rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >Generate monthly PDF</button>
                </div>
                <div className="grid gap-3">
                  <p className="text-sm font-semibold text-slate-900">Custom report</p>
                  <input
                    type="date"
                    value={customReportFromDate}
                    onChange={(e) => setCustomReportFromDate(e.target.value)}
                    className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm"
                  />
                  <input
                    type="date"
                    value={customReportToDate}
                    min={customReportFromDate}
                    onChange={(e) => setCustomReportToDate(e.target.value)}
                    className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm"
                  />
                  <button
                    onClick={() => generatePrintReport('custom')}
                    className="w-full rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                  >Generate custom PDF</button>
                </div>
                <div className="grid gap-3 rounded-3xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500 font-semibold">Cleanup</p>
                  <input
                    type="number"
                    min={1}
                    value={cleanupThreshold}
                    onChange={(e) => setCleanupThreshold(Number(e.target.value))}
                    className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm"
                  />
                  <select
                    value={cleanupUnit}
                    onChange={(e) => setCleanupUnit(e.target.value as 'months' | 'years')}
                    className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                  <button
                    onClick={cleanupOldOrders}
                    disabled={cleanupLoading || !isAdmin}
                    className="w-full rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {cleanupLoading ? 'Deleting...' : 'Cleanup orders'}
                  </button>
                  {!isAdmin && <p className="text-xs text-rose-600">Admin only action</p>}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">{selectedTab === 'Verify Payment' ? 'Verification queue' : 'Orders table'}</p>
              <h3 className="text-xl font-semibold text-slate-900">{selectedTab === 'Verify Payment' ? 'Review payment proof and decide quickly' : 'Orders ready for action'}</h3>
            </div>
            <div className="text-sm text-slate-500">Showing {filteredOrders.length} of {orders.length} total orders</div>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 && !error ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">📦 No Orders</h2>
          <p className="text-blue-800">No orders found for this workflow tab. Adjust filters or select another tab.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {selectedTab === 'Verify Payment' ? (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Order #{order._id.slice(-8)}</span>
                        <span className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{order.customer?.name || 'Guest Customer'}</p>
                      <p className="text-sm text-slate-600">{order.customer?.email || 'No email'} • {order.customer?.mobile || 'No phone'}</p>
                      <p className="text-sm text-slate-600">Amount: ₹{order.total?.toFixed(2) || '0.00'}</p>
                      <p className="text-sm text-slate-600">Payment ref: {order.transactionId || ((order.paymentDetails as any)?.upiRef || 'N/A')}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => updateStatus(order._id, 'Payment Verified')}
                        className="rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                      >Approve payment</button>
                      <button
                        onClick={() => updateStatus(order._id, 'Payment Rejected')}
                        className="rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                      >Reject payment</button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Payment Proof</p>
                      {order.paymentScreenshot ? (
                        <img
                          src={order.paymentScreenshot}
                          alt="Payment proof"
                          onClick={() => openImage(order.paymentScreenshot)}
                          className="mt-3 h-full min-h-[220px] w-full rounded-3xl border border-slate-200 object-cover shadow-sm cursor-pointer"
                        />
                      ) : (
                        <div className="mt-3 rounded-3xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">No screenshot uploaded.</div>
                      )}
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-sm uppercase tracking-[0.16em] text-slate-500 font-semibold">Order details</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p>Order ID: {order._id}</p>
                        <p>Status: {order.status}</p>
                        <p>Delivery city: {order.shipping?.city || 'N/A'}</p>
                        <p>Payment mode: {order.paymentMethod || 'Unknown'}</p>
                        <p>Current return: {order.returnStatus || 'No Return'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const newSelection: Record<string, boolean> = {};
                        if (checked) filteredOrders.forEach(order => { newSelection[order._id] = true; });
                        setBulkSelection(newSelection);
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    <span className="text-sm text-slate-700">Select all visible</span>
                  </label>
                  <span className="text-sm text-slate-500">{selectedOrderIds.length} selected</span>
                </div>
                <span className="text-sm text-slate-500">Showing {filteredOrders.length} orders</span>
              </div>

              <table className="min-w-full text-sm">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Select</th>
                    <th className="px-4 py-3 text-left font-semibold">Order</th>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Courier/Tracking</th>
                    <th className="px-4 py-3 text-left font-semibold">Proof</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredOrders.map(order => (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={Boolean(bulkSelection[order._id])}
                          onChange={(e) => setBulkSelection(prev => ({ ...prev, [order._id]: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                      </td>
                      <td className="px-4 py-4 text-slate-900">
                        <div className="font-semibold">#{order._id.slice(-8)}</div>
                        <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        <div>{order.customer?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{order.customer?.mobile || order.customer?.email || '—'}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">₹{order.total?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          order.status === 'Payment Verified' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'Payment Rejected' ? 'bg-rose-100 text-rose-700' :
                          order.status === 'Shipped' ? 'bg-sky-100 text-sky-700' :
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{order.status}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {order.deliveryCompanyName && <div className="text-xs">{order.deliveryCompanyName}</div>}
                        {order.trackingId && <div className="text-xs font-mono">{order.trackingId}</div>}
                        {!order.deliveryCompanyName && !order.trackingId && <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {order.paymentScreenshot ? (
                          <button onClick={() => openImage(order.paymentScreenshot)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">View</button>
                        ) : (
                          <span className="text-xs text-slate-400">No proof</span>
                        )}
                      </td>
                      <td className="px-4 py-4 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {order.status !== 'Payment Verified' && order.status !== 'Payment Rejected' && (
                            <button onClick={() => updateStatus(order._id, 'Payment Verified')} className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Verify</button>
                          )}
                          {order.status === 'Payment Verified' && (
                            <button onClick={() => updateStatus(order._id, 'Order Preparing')} className="rounded-full bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700">Pack</button>
                          )}
                          {order.status === 'Order Preparing' && (
                            <button onClick={() => updateStatus(order._id, 'Shipped')} className="rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700">Ship</button>
                          )}
                          {order.status === 'Shipped' && (
                            <button onClick={() => updateStatus(order._id, 'Delivered')} className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Deliver</button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => updateStatus(order._id, 'Order Rejected')} className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">Cancel</button>
                          <button onClick={() => startDeliveryEdit(order)} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">Delivery</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}