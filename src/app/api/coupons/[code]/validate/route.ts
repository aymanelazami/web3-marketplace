import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ code: string }>;
}

// GET /api/coupons/:code/validate - Validate a coupon code
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { code } = await params;
        const { searchParams } = new URL(request.url);
        const orderAmount = parseFloat(searchParams.get('amount') || '0');

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) {
            return NextResponse.json({ valid: false, error: 'Coupon not found' });
        }

        const now = new Date();

        // Check if active
        if (!coupon.isActive) {
            return NextResponse.json({ valid: false, error: 'Coupon is inactive' });
        }

        // Check validity dates
        if (now < coupon.validFrom || now > coupon.validUntil) {
            return NextResponse.json({ valid: false, error: 'Coupon has expired' });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return NextResponse.json({ valid: false, error: 'Coupon usage limit reached' });
        }

        // Check minimum order amount
        if (coupon.minOrderAmount && orderAmount < parseFloat(coupon.minOrderAmount.toString())) {
            return NextResponse.json({
                valid: false,
                error: `Minimum order amount is ${coupon.minOrderAmount} credits`
            });
        }

        // Check if user already used this coupon
        const existingUsage = await prisma.couponUsage.findFirst({
            where: {
                couponId: coupon.id,
                userId: session.userId,
            },
        });

        if (existingUsage) {
            return NextResponse.json({ valid: false, error: 'You have already used this coupon' });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discount = (orderAmount * parseFloat(coupon.discountValue.toString())) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, parseFloat(coupon.maxDiscount.toString()));
            }
        } else {
            discount = parseFloat(coupon.discountValue.toString());
        }

        discount = Math.min(discount, orderAmount); // Can't discount more than order total

        return NextResponse.json({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue.toString(),
            },
            discount: discount.toFixed(2),
            finalAmount: (orderAmount - discount).toFixed(2),
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
    }
}
