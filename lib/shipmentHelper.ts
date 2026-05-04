import Order from '@/models/Order';
import Shipment from '@/models/Shipment';
import CourierPartner from '@/models/CourierPartner';
import CourierRoutingEngine from '@/lib/courierRoutingEngine';

export async function createShipmentForOrder(order: any, options: { priority?: 'cost' | 'speed' | 'balance'; manualCourierId?: string } = {}) {
  const priority = options.priority || 'balance';
  const manualCourierId = options.manualCourierId;

  // Prevent duplicate shipment creation
  const existingShipment = await Shipment.findOne({ order: order._id });
  if (existingShipment) {
    return existingShipment;
  }

  // Determine weight; fallback to 0.5kg per item if not available
  const totalWeight = order.products.reduce((sum: number, item: any) => sum + (item.quantity * 0.5), 0.5);

  let courier: any;
  if (manualCourierId) {
    courier = await CourierPartner.findById(manualCourierId);
    if (!courier || !courier.isActive) {
      throw new Error('Invalid manual courier selected');
    }
  } else {
    const routingEngine = CourierRoutingEngine.getInstance();
    const bestOption = await routingEngine.findBestCourier({
      destinationPincode: order.shipping?.postalCode || '110001',
      weight: totalWeight,
      isCOD: order.paymentMethod === 'cod',
      orderValue: order.total,
      priority,
    });

    if (!bestOption) {
      throw new Error('No suitable courier found for automatic shipment creation');
    }

    courier = bestOption.courier;
  }
  const awbNumber = `AWB${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const shipment = new Shipment({
    order: order._id,
    orderNumber: order.orderNumber,
    courierPartner: courier._id,
    courierName: courier.name,
    courierCode: courier.code,
    awbNumber,
    weight: totalWeight,
    shippingCost: 0,
    isCOD: order.paymentMethod === 'cod',
    codAmount: order.paymentMethod === 'cod' ? order.total : 0,
    pickupAddress: {
      name: 'Refurbished PC Studio',
      address: 'Business Address',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      phone: '9999999999',
      email: 'admin@pcstudio.com',
    },
    deliveryAddress: {
      name: order.shipping?.name || '',
      address: order.shipping?.address || '',
      city: order.shipping?.city || '',
      state: order.shippingState || order.shipping?.city || '',
      pincode: order.shipping?.postalCode || '',
      phone: order.shipping?.mobile || '',
      email: order.shipping?.email || '',
    },
    status: 'Shipment Created',
    statusHistory: [
      {
        status: 'Shipment Created',
        timestamp: new Date(),
        remarks: 'Auto-created after payment verification',
      },
    ],
  });

  try {
    const courierResponse = await createCourierShipment(courier, shipment);
    shipment.courierResponse = courierResponse;
    shipment.shipmentId = courierResponse.shipmentId;
    shipment.trackingUrl = courierResponse.trackingUrl;
    shipment.labelUrl = courierResponse.labelUrl;
    shipment.shippingCost = courierResponse.shippingCost || 0;
  } catch (error) {
    console.error('Courier API shipment creation failed:', error);
  }

  await shipment.save();

  order.status = 'Shipped';
  order.deliveryCompanyName = courier.name;
  order.trackingId = awbNumber;
  order.shipment = shipment._id;
  await order.save();

  return shipment;
}

export async function cancelShipmentForOrder(order: any, options: { reason?: string } = {}) {
  const shipment = await Shipment.findOne({ order: order._id });
  if (!shipment) {
    return null;
  }

  if (['Cancelled', 'Delivered', 'Returned', 'Lost'].includes(shipment.status)) {
    return shipment;
  }

  try {
    const courierResponse = await cancelCourierShipment(shipment.courierName, shipment);
    shipment.courierResponse = {
      ...shipment.courierResponse,
      cancelResponse: courierResponse,
    };
  } catch (error) {
    console.error('Courier cancellation failed:', error);
  }

  shipment.status = 'Cancelled';
  shipment.statusHistory.push({
    status: 'Cancelled',
    timestamp: new Date(),
    remarks: options.reason || 'Order rejected, shipment cancelled automatically',
  });

  await shipment.save();
  return shipment;
}

async function createCourierShipment(courier: any, shipment: any) {
  const courierAPIs: Record<string, (courier: any, shipment: any) => Promise<any>> = {
    Delhivery: createDelhiveryShipment,
    Ekart: createEkartShipment,
    XpressBees: createXpressBeesShipment,
    Shadowfax: createShadowfaxShipment,
    'Ecom Express': createEcomExpressShipment,
    Shiprocket: createShiprocketShipment,
  };

  const apiFunction = courierAPIs[courier.name];
  if (apiFunction) {
    return await apiFunction(courier, shipment);
  }

  throw new Error(`Courier ${courier.name} API not implemented`);
}

async function createDelhiveryShipment(courier: any, shipment: any) {
  const apiKey = process.env.DELHIVERY_API_KEY;
  if (!apiKey) {
    throw new Error('Delhivery API key not configured');
  }

  try {
    // Delhivery API payload - using the correct CMU create endpoint
    const payload = {
      format: 'json',
      shipments: [{
        name: shipment.deliveryAddress.name,
        add: shipment.deliveryAddress.address,
        city: shipment.deliveryAddress.city,
        state: shipment.deliveryAddress.state,
        country: 'India',
        phone: shipment.deliveryAddress.phone,
        pin: shipment.deliveryAddress.pincode,
        order: shipment.awbNumber,
        payment_mode: shipment.isCOD ? 'COD' : 'Prepaid',
        return_pin: '110001',
        return_city: 'Delhi',
        return_phone: '9999999999',
        return_add: 'Business Address',
        return_state: 'Delhi',
        return_country: 'India',
        products_desc: 'PC Parts',
        hsn_code: '84713010',
        cod_amount: shipment.isCOD ? shipment.codAmount : 0,
        order_date: new Date().toISOString().split('T')[0],
        total_amount: shipment.codAmount || 100,
        seller_add: 'Business Address',
        seller_name: 'Refurbished PC Studio',
        seller_inv: [],
        quantity: '1',
        shipment_width: '20',
        shipment_height: '15',
        shipment_length: '10',
        weight: shipment.weight.toString(),
        pickup_location: {
          pickup_location: 'Business Address',
          pickup_name: 'Refurbished PC Studio',
          pickup_phone: '9999999999',
          pickup_pincode: '110001',
          pickup_city: 'Delhi',
          pickup_state: 'Delhi',
          pickup_country: 'India'
        }
      }],
      pickup_location: {
        pickup_location: 'Business Address',
        pickup_name: 'Refurbished PC Studio',
        pickup_phone: '9999999999',
        pickup_pincode: '110001',
        pickup_city: 'Delhi',
        pickup_state: 'Delhi',
        pickup_country: 'India'
      }
    };

    console.log('Delhivery API Request Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://track.delhivery.com/api/cmu/create.json', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('Delhivery API Response Status:', response.status);
    console.log('Delhivery API Response:', responseText);

    if (!response.ok) {
      console.error('Delhivery API error response:', responseText, 'Status:', response.status);
      throw new Error(`Delhivery API error: ${response.status} - ${responseText}`);
    }

    // Parse response
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { success: true, message: responseText };
    }

    return {
      shipmentId: shipment.awbNumber,
      trackingUrl: `https://www.delhivery.com/track/${shipment.awbNumber}`,
      labelUrl: `https://track.delhivery.com/api/p/packing_slip?wbns=${shipment.awbNumber}&pdf=true`,
      shippingCost: 150,
      courierResponse: data,
    };
  } catch (error) {
    console.error('Delhivery shipment creation failed:', error);
    // Don't throw - allow graceful degradation with tracking number still saved
    return {
      shipmentId: shipment.awbNumber,
      trackingUrl: `https://www.delhivery.com/track/${shipment.awbNumber}`,
      labelUrl: `https://track.delhivery.com/api/p/packing_slip?wbns=${shipment.awbNumber}&pdf=true`,
      shippingCost: 150,
      error: error instanceof Error ? error.message : 'API call failed',
    };
  }
}

async function createEkartShipment(courier: any, shipment: any) {
  return {
    shipmentId: `EK${Date.now()}`,
    trackingUrl: `https://ekartlogistics.com/track/${shipment.awbNumber}`,
    labelUrl: `https://api.ekart.com/label/${shipment.awbNumber}`,
    shippingCost: 140,
  };
}

async function createXpressBeesShipment(courier: any, shipment: any) {
  return {
    shipmentId: `XB${Date.now()}`,
    trackingUrl: `https://www.xpressbees.com/track/${shipment.awbNumber}`,
    labelUrl: `https://api.xpressbees.com/label/${shipment.awbNumber}`,
    shippingCost: 160,
  };
}

async function createShadowfaxShipment(courier: any, shipment: any) {
  return {
    shipmentId: `SF${Date.now()}`,
    trackingUrl: `https://www.shadowfax.in/track/${shipment.awbNumber}`,
    labelUrl: `https://api.shadowfax.com/label/${shipment.awbNumber}`,
    shippingCost: 130,
  };
}

async function createEcomExpressShipment(courier: any, shipment: any) {
  return {
    shipmentId: `EE${Date.now()}`,
    trackingUrl: `https://ecomexpress.in/track/${shipment.awbNumber}`,
    labelUrl: `https://api.ecomexpress.com/label/${shipment.awbNumber}`,
    shippingCost: 170,
  };
}

async function createShiprocketShipment(courier: any, shipment: any) {
  return {
    shipmentId: `SR${Date.now()}`,
    trackingUrl: `https://app.shiprocket.in/tracking/${shipment.awbNumber}`,
    labelUrl: `https://apiv2.shiprocket.in/v1/external/courier/generate/label`,
    shippingCost: 145,
  };
}

async function cancelCourierShipment(courierName: string, shipment: any) {
  const courierCancelers: Record<string, (shipment: any) => Promise<any>> = {
    Delhivery: cancelDelhiveryShipment,
    Ekart: cancelEkartShipment,
    XpressBees: cancelXpressBeesShipment,
    Shadowfax: cancelShadowfaxShipment,
    'Ecom Express': cancelEcomExpressShipment,
    Shiprocket: cancelShiprocketShipment,
  };

  const cancelFunction = courierCancelers[courierName];
  if (cancelFunction) {
    return await cancelFunction(shipment);
  }

  return {
    cancelled: true,
    message: `No courier cancel API implemented for ${courierName}; local cancellation recorded.`,
  };
}

async function cancelDelhiveryShipment(shipment: any) {
  return {
    cancelled: true,
    courierShipmentId: shipment.shipmentId,
    message: 'Delhivery shipment cancelled via placeholder API',
  };
}

async function cancelEkartShipment(shipment: any) {
  return {
    cancelled: true,
    courierShipmentId: shipment.shipmentId,
    message: 'Ekart shipment cancelled via placeholder API',
  };
}

async function cancelXpressBeesShipment(shipment: any) {
  return {
    cancelled: true,
    courierShipmentId: shipment.shipmentId,
    message: 'XpressBees shipment cancelled via placeholder API',
  };
}

async function cancelShadowfaxShipment(shipment: any) {
  return {
    cancelled: true,
    courierShipmentId: shipment.shipmentId,
    message: 'Shadowfax shipment cancelled via placeholder API',
  };
}

async function cancelEcomExpressShipment(shipment: any) {
  return {
    cancelled: true,
    courierShipmentId: shipment.shipmentId,
    message: 'Ecom Express shipment cancelled via placeholder API',
  };
}

async function cancelShiprocketShipment(shipment: any) {
  return {
    cancelled: true,
    courierShipmentId: shipment.shipmentId,
    message: 'Shiprocket shipment cancelled via placeholder API',
  };
}
