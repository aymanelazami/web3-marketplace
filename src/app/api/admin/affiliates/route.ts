import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/affiliates - List all affiliate codes
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const affiliates = await (prisma as any).affiliateCode.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { referrals: true } },
            },
        });

        return NextResponse.json({
            affiliates: affiliates.map((a: any) => ({
                id: a.id,
                code: a.code,
                userId: a.userId,
                commissionRate: a.commissionRate.toString(),
                totalEarnings: a.totalEarnings.toString(),
                totalReferrals: a._count.referrals,
                isActive: a.isActive,
            })),
        });
    } catch (error) {
        console.error('Get affiliates error:', error);
        return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
    }
}
