import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/orders - List all orders
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: {
                    select: { walletAddress: true },
                },
                product: {
                    select: { name: true },
                },
            },
        });

        return NextResponse.json({
            orders: orders.map((o) => ({
                id: o.id,
                user: o.user,
                product: o.product,
                totalCredits: o.totalCredits.toString(),
                status: o.status,
                createdAt: o.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Admin get orders error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
