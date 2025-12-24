import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/affiliate - Get current user's affiliate code
export async function GET() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const affiliateCode = await prisma.affiliateCode.findUnique({
            where: { userId: session.userId },
            include: {
                _count: { select: { referrals: true } },
            },
        });

        if (!affiliateCode) {
            return NextResponse.json({ hasAffiliateCode: false });
        }

        return NextResponse.json({
            hasAffiliateCode: true,
            affiliate: {
                code: affiliateCode.code,
                commissionRate: affiliateCode.commissionRate.toString(),
                totalEarnings: affiliateCode.totalEarnings.toString(),
                totalReferrals: affiliateCode._count.referrals,
                isActive: affiliateCode.isActive,
            },
        });
    } catch (error) {
        console.error('Get affiliate error:', error);
        return NextResponse.json({ error: 'Failed to fetch affiliate' }, { status: 500 });
    }
}

// POST /api/affiliate - Create affiliate code for current user
export async function POST() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if already has affiliate code
        const existing = await prisma.affiliateCode.findUnique({
            where: { userId: session.userId },
        });

        if (existing) {
            return NextResponse.json({ error: 'You already have an affiliate code' }, { status: 400 });
        }

        // Generate unique code
        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        const baseCode = user?.walletAddress.slice(-6).toUpperCase() || 'REF';
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `${baseCode}${randomSuffix}`;

        const affiliateCode = await prisma.affiliateCode.create({
            data: {
                userId: session.userId,
                code,
            },
        });

        return NextResponse.json({
            affiliate: {
                code: affiliateCode.code,
                commissionRate: affiliateCode.commissionRate.toString(),
            },
        });
    } catch (error) {
        console.error('Create affiliate error:', error);
        return NextResponse.json({ error: 'Failed to create affiliate code' }, { status: 500 });
    }
}

// PUT /api/affiliate - Admin update affiliate settings
export async function PUT(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { userId, commissionRate, isActive } = body;

        const affiliateCode = await prisma.affiliateCode.update({
            where: { userId },
            data: {
                ...(commissionRate !== undefined && { commissionRate: parseFloat(commissionRate) }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json({ affiliateCode });
    } catch (error) {
        console.error('Update affiliate error:', error);
        return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 });
    }
}
