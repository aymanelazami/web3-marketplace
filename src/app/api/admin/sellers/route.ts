import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/sellers - List all seller applications
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const sellers = await prisma.seller.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            sellers: sellers.map((s) => ({
                id: s.id,
                userId: s.userId,
                storeName: s.storeName,
                storeDescription: s.storeDescription,
                email: s.email,
                website: s.website,
                status: s.status,
                totalSales: s.totalSales.toString(),
                totalEarnings: s.totalEarnings.toString(),
                applicationNote: s.applicationNote,
                rejectionReason: s.rejectionReason,
                verifiedAt: s.verifiedAt?.toISOString(),
                createdAt: s.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Get sellers error:', error);
        return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 });
    }
}
