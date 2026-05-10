'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Shipment {
  _id: string;
  orderNumber: string;
  awbNumber: string;
  courierName: string;
  courierCode: string;
  status: string;
  shippingCost: number;
  weight: number;
  isCOD: boolean;
  codAmount: number;
  deliveryAddress: {
    name: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
  estimatedDeliveryDate?: string;
  trackingUrl?: string;
  labelUrl?: string;
  order: {
    total: number;
    customer: { name: string; email: string };
  };
}

interface Courier {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
  successRate: number;
  averageDeliveryDays: number;
  rtoRate: number;
  metrics?: {
    totalShipments: number;
    successRate: number;
    rtoRate: number;
    averageDeliveryDays: number;
  };
}

export default function AdminShipments() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shipments' | 'couriers' | 'create'>('shipments');
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [priority, setPriority] = useState<'cost' | 'speed' | 'balance'>('balance');
  const [manualCourier, setManualCourier] = useState<string>('');
  const [creatingShipment, setCreatingShipment] = useState(false);

  // New courier form state
  const [newCourier, setNewCourier] = useState({
    name: '',
    code: '',
    apiKey: '',
    apiSecret: '',
    baseUrl: '',
    baseRate: '',
    additionalRate: '0',
    codChargePercent: '0',
    fuelSurchargePercent: '0',
    successRate: '95',
    averageDeliveryDays: '3',
    rtoRate: '5',
    supportsCOD: true,
    supportsPrepaid: true,
    maxWeightKg: '30',
    minWeightKg: '0.1'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadShipments(), loadCouriers()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [session, status, router, loadData]);

  const loadShipments = async () => {
    try {
      const response = await fetch('/api/shipments');
      const data = await response.json();
      if (response.ok) {
        setShipments(data.shipments);
      }
    } catch (error) {
      console.error('Error loading shipments:', error);
    }
  };

  const loadCouriers = async () => {
    try {
      const response = await fetch('/api/couriers');
      const data = await response.json();
      if (response.ok) {
        setCouriers(data.couriers);
      }
    } catch (error) {
      console.error('Error loading couriers:', error);
    }
  };

  const createShipment = async () => {
    if (!selectedOrder) return;

    setCreatingShipment(true);
    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder,
          priority,
          manualCourierId: manualCourier || undefined
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Shipment created successfully!');
        setSelectedOrder('');
        setManualCourier('');
        loadShipments();
      } else {
        alert(data.error || 'Failed to create shipment');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('Failed to create shipment');
    } finally {
      setCreatingShipment(false);
    }
  };

  const createCourier = async () => {
    try {
      const response = await fetch('/api/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCourier,
          baseRate: parseFloat(newCourier.baseRate),
          additionalRate: parseFloat(newCourier.additionalRate),
          codChargePercent: parseFloat(newCourier.codChargePercent),
          fuelSurchargePercent: parseFloat(newCourier.fuelSurchargePercent),
          successRate: parseFloat(newCourier.successRate),
          averageDeliveryDays: parseFloat(newCourier.averageDeliveryDays),
          rtoRate: parseFloat(newCourier.rtoRate),
          maxWeightKg: parseFloat(newCourier.maxWeightKg),
          minWeightKg: parseFloat(newCourier.minWeightKg)
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Courier added successfully!');
        setNewCourier({
          name: '',
          code: '',
          apiKey: '',
          apiSecret: '',
          baseUrl: '',
          baseRate: '',
          additionalRate: '0',
          codChargePercent: '0',
          fuelSurchargePercent: '0',
          successRate: '95',
          averageDeliveryDays: '3',
          rtoRate: '5',
          supportsCOD: true,
          supportsPrepaid: true,
          maxWeightKg: '30',
          minWeightKg: '0.1'
        });
        loadCouriers();
        setActiveTab('couriers');
      } else {
        alert(data.error || 'Failed to add courier');
      }
    } catch (error) {
      console.error('Error creating courier:', error);
      alert('Failed to add courier');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      case 'Out for Delivery': return 'bg-yellow-100 text-yellow-800';
      case 'Failed Delivery': return 'bg-red-100 text-red-800';
      case 'Returned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">🚚 Shipment Management</h1>
          <p className="text-gray-600">Smart courier routing and shipment automation</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('shipments')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'shipments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📦 Shipments ({shipments.length})
              </button>
              <button
                onClick={() => setActiveTab('couriers')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'couriers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🚛 Couriers ({couriers.length})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ➕ Create Shipment
              </button>
            </nav>
          </div>
        </div>

        {/* Shipments Tab */}
        {activeTab === 'shipments' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order/AWB
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Courier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shipments.map((shipment) => (
                      <tr key={shipment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{shipment.orderNumber}</div>
                          <div className="text-sm text-gray-500">{shipment.awbNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{shipment.courierName}</div>
                          <div className="text-sm text-gray-500">{shipment.weight}kg</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{shipment.deliveryAddress.name}</div>
                          <div className="text-sm text-gray-500">{shipment.order.customer.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{shipment.deliveryAddress.city}</div>
                          <div className="text-sm text-gray-500">{shipment.deliveryAddress.pincode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                            {shipment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{shipment.shippingCost}
                          {shipment.isCOD && <div className="text-xs text-gray-500">COD: ₹{shipment.codAmount}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {shipment.trackingUrl && (
                              <a
                                href={shipment.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Track
                              </a>
                            )}
                            {shipment.labelUrl && (
                              <a
                                href={shipment.labelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-900"
                              >
                                Label
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Couriers Tab */}
        {activeTab === 'couriers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {couriers.map((courier) => (
              <div key={courier._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{courier.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    courier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {courier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div>Code: {courier.code}</div>
                  <div>Success Rate: {courier.metrics?.successRate?.toFixed(1) || courier.successRate}%</div>
                  <div>Avg Delivery: {courier.metrics?.averageDeliveryDays?.toFixed(1) || courier.averageDeliveryDays} days</div>
                  <div>RTO Rate: {courier.metrics?.rtoRate?.toFixed(1) || courier.rtoRate}%</div>
                  <div>Total Shipments: {courier.metrics?.totalShipments || 0}</div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                    Edit
                  </button>
                  <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
                    Configure
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
              <button
                onClick={() => setActiveTab('create')}
                className="text-gray-600 hover:text-gray-900"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">➕</div>
                  <div className="text-sm font-medium">Add New Courier</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Create Shipment Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Shipment</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipment Creation Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Shipment Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={selectedOrder}
                    onChange={(e) => setSelectedOrder(e.target.value)}
                    placeholder="Enter order ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Routing Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'cost' | 'speed' | 'balance')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="balance">Balanced (Cost & Speed)</option>
                    <option value="cost">Lowest Cost</option>
                    <option value="speed">Fastest Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manual Courier Selection (Optional)
                  </label>
                  <select
                    value={manualCourier}
                    onChange={(e) => setManualCourier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Auto-select best courier</option>
                    {couriers.filter(c => c.isActive).map((courier) => (
                      <option key={courier._id} value={courier._id}>
                        {courier.name} ({courier.code})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={createShipment}
                  disabled={creatingShipment || !selectedOrder}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {creatingShipment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Shipment...
                    </>
                  ) : (
                    '🚚 Create Shipment'
                  )}
                </button>
              </div>

              {/* Add New Courier Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Courier Partner</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <select
                      value={newCourier.name}
                      onChange={(e) => setNewCourier({...newCourier, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Courier</option>
                      <option value="Delhivery">Delhivery</option>
                      <option value="Ekart">Ekart</option>
                      <option value="XpressBees">XpressBees</option>
                      <option value="Shadowfax">Shadowfax</option>
                      <option value="Ecom Express">Ecom Express</option>
                      <option value="Shiprocket">Shiprocket</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={newCourier.code}
                      onChange={(e) => setNewCourier({...newCourier, code: e.target.value})}
                      placeholder="e.g., DL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={newCourier.apiKey}
                    onChange={(e) => setNewCourier({...newCourier, apiKey: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base URL *
                  </label>
                  <input
                    type="url"
                    value={newCourier.baseUrl}
                    onChange={(e) => setNewCourier({...newCourier, baseUrl: e.target.value})}
                    placeholder="https://api.courier.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Rate (₹/kg) *
                    </label>
                    <input
                      type="number"
                      value={newCourier.baseRate}
                      onChange={(e) => setNewCourier({...newCourier, baseRate: e.target.value})}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Success Rate (%)
                    </label>
                    <input
                      type="number"
                      value={newCourier.successRate}
                      onChange={(e) => setNewCourier({...newCourier, successRate: e.target.value})}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={createCourier}
                  disabled={!newCourier.name || !newCourier.code || !newCourier.apiKey || !newCourier.baseUrl || !newCourier.baseRate}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  ➕ Add Courier Partner
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}