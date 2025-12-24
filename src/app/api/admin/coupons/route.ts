import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/coupons - List all coupons
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { couponUsages: true } },
            },
        });

        return NextResponse.json({
            coupons: coupons.map((c) => ({
                id: c.id,
                code: c.code,
                discountType: c.discountType,
                discountValue: c.discountValue.toString(),
                minOrderAmount: c.minOrderAmount?.toString() || null,
                maxDiscount: c.maxDiscount?.toString() || null,
                usageLimit: c.usageLimit,
                usageCount: c._count.couponUsages,
                validFrom: c.validFrom.toISOString(),
                validUntil: c.validUntil.toISOString(),
                isActive: c.isActive,
            })),
        });
    } catch (error) {
        console.error('Get coupons error:', error);
        return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
    }
}

// POST /api/admin/coupons - Create coupon
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, validFrom, validUntil } = body;

        if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if code already exists
        const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
        if (existing) {
            return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                discountType,
                discountValue: parseFloat(discountValue),
                minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
                maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                validFrom: new Date(validFrom),
                validUntil: new Date(validUntil),
            },
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'coupon_create',
                entityType: 'coupon',
                entityId: coupon.id,
                detailsJson: JSON.stringify({ code: coupon.code, discountType, discountValue }),
            },
        });

        return NextResponse.json({ coupon });
    } catch (error) {
        console.error('Create coupon error:', error);
        return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }
}
