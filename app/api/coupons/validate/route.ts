import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import BusinessSettings from '@/models/BusinessSettings';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    await dbConnect();
    const { code, total, productIds, cartItems } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json({ error: 'Valid total required' }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    // Check if referral program is enabled for referral coupons
    if (coupon.type === 'referral') {
      const settings = await BusinessSettings.findOne();
      if (!settings || !settings.referralEnabled) {
        return NextResponse.json({ error: 'Referral program is currently disabled' }, { status: 400 });
      }
    }

    // Check if coupon belongs to a specific user and if current user can use it
    if (coupon.user) {
      if (!session) {
        return NextResponse.json({ error: 'Please login to use this coupon' }, { status: 401 });
      }
      if (coupon.user.toString() !== session.user.id) {
        return NextResponse.json({ error: 'This coupon is not available for your account' }, { status: 403 });
      }
    }

    // For bargain/bidding coupons, enforce ownership explicitly
    if ((coupon.type === 'bargain' || coupon.type === 'bidding') && !coupon.user) {
      return NextResponse.json({ error: 'This coupon is not available for your account' }, { status: 403 });
    }

    if ((coupon.type === 'bargain' || coupon.type === 'bidding') && session && coupon.user && coupon.user.toString() !== session.user.id) {
      return NextResponse.json({ error: 'This coupon is not available for your account' }, { status: 403 });
    }

    // Check if coupon is product-specific and if the products in cart match
    if (coupon.products && coupon.products.length > 0) {
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return NextResponse.json({ error: 'This coupon requires specific products in your cart' }, { status: 400 });
      }
      
      const allowedProductIds = coupon.products.map((couponProductId: any) => couponProductId.toString());
      const hasAnyValidProduct = productIds.some(cartProductId => allowedProductIds.includes(cartProductId));
      const hasOnlyValidProducts = productIds.every(cartProductId => allowedProductIds.includes(cartProductId));
      
      if (!hasAnyValidProduct) {
        return NextResponse.json({ error: 'This coupon is not valid for the products in your cart' }, { status: 400 });
      }
      
      if (!hasOnlyValidProducts) {
        return NextResponse.json({ error: 'This coupon can only be used with the selected products' }, { status: 400 });
      }
    }

    const now = new Date();
    const createdAt = new Date(coupon.createdAt);

    // Check expiration days
    if (coupon.expirationDays) {
      const expiryDate = new Date(createdAt.getTime() + coupon.expirationDays * 24 * 60 * 60 * 1000);
      if (now > expiryDate) {
        return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
      }
    }

    // Check expiration hours
    if (coupon.expirationHours) {
      const expiryTime = new Date(createdAt.getTime() + coupon.expirationHours * 60 * 60 * 1000);
      if (now > expiryTime) {
        return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
      }
    }

    // Check time range
    if (coupon.startHour !== null && coupon.endHour !== null) {
      const currentHour = now.getHours();
      if (currentHour < coupon.startHour || currentHour > coupon.endHour) {
        return NextResponse.json({ error: 'Coupon not valid at this time' }, { status: 400 });
      }
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon usage limit exceeded' }, { status: 400 });
    }

    // Calculate discount only on eligible products
    let discountBase = total;
    
    // If coupon is product-specific, calculate discount only on matching items
    if (coupon.products && coupon.products.length > 0 && cartItems && Array.isArray(cartItems)) {
      discountBase = cartItems.reduce((sum: number, item: any) => {
        const matchingCouponProduct = coupon.products.some((couponProdId: any) => 
          couponProdId.toString() === item.productId
        );
        if (matchingCouponProduct) {
          return sum + (item.price * item.quantity);
        }
        return sum;
      }, 0);
    }

    let discount = 0;
    if (coupon.type === 'bargain' || coupon.type === 'bidding') {
      if (!coupon.targetPrice || !coupon.products || coupon.products.length === 0) {
        return NextResponse.json({ error: 'Invalid coupon details' }, { status: 400 });
      }
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return NextResponse.json({ error: 'This coupon requires specific products in your cart' }, { status: 400 });
      }

      const eligibleItem = cartItems.find((item: any) =>
        coupon.products.some((couponProdId: any) => couponProdId.toString() === item.productId)
      );
      if (!eligibleItem) {
        return NextResponse.json({ error: 'This coupon is not valid for the products in your cart' }, { status: 400 });
      }

      discount = Math.max(0, eligibleItem.price - coupon.targetPrice);
    } else if (coupon.discountType === 'percentage') {
      discount = (discountBase * coupon.discountValue) / 100;
    } else {
      // For product-specific fixed coupons, cap discount to eligible product total
      discount = Math.min(coupon.discountValue, discountBase);
    }

    return NextResponse.json({ 
      discount,
      couponProducts: coupon.products ? coupon.products.map((p: any) => p.toString()) : [],
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}