import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { awbNumber, testMode = false } = body;

    if (!awbNumber) {
      return NextResponse.json({ error: 'AWB number is required' }, { status: 400 });
    }

    const apiKey = process.env.DELHIVERY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Delhivery API key not configured' }, { status: 500 });
    }

    if (testMode) {
      // Test mode - just return mock response
      return NextResponse.json({
        success: true,
        message: 'Test mode - no actual API call',
        awbNumber,
        mockResponse: {
          shipmentId: awbNumber,
          trackingUrl: `https://www.delhivery.com/track/${awbNumber}`,
          status: 'Shipment Created'
        }
      });
    }

    // Real API call to Delhivery - using correct CMU endpoint
    const payload = {
      format: 'json',
      shipments: [{
        name: 'Test Customer',
        add: 'Test Address',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        phone: '9999999999',
        pin: '110001',
        order: awbNumber,
        payment_mode: 'Prepaid',
        return_pin: '110001',
        return_city: 'Delhi',
        return_phone: '9999999999',
        return_add: 'Business Address',
        return_state: 'Delhi',
        return_country: 'India',
        products_desc: 'Test Product',
        hsn_code: '84713010',
        cod_amount: 0,
        order_date: new Date().toISOString().split('T')[0],
        total_amount: 100,
        seller_add: 'Business Address',
        seller_name: 'Refurbished PC Studio',
        seller_inv: [],
        quantity: '1',
        shipment_width: '20',
        shipment_height: '15',
        shipment_length: '10',
        weight: '0.5',
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
      return NextResponse.json({
        error: 'Delhivery API error',
        status: response.status,
        response: responseText,
        awbNumber
      }, { status: response.status });
    }

    // Parse response
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { success: true, message: responseText };
    }

    return NextResponse.json({
      success: true,
      awbNumber,
      apiResponse: data,
      trackingUrl: `https://www.delhivery.com/track/${awbNumber}`
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}