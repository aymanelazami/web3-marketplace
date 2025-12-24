import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/analytics - Get chart data for analytics
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get daily revenue for last 30 days
        const revenueData = await prisma.ledgerTransaction.findMany({
            where: {
                type: 'PURCHASE',
                createdAt: { gte: thirtyDaysAgo },
            },
            select: {
                amount: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        // Get daily user signups for last 30 days
        const usersData = await prisma.user.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
            },
            select: {
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        // Get daily deposits for last 30 days
        const depositsData = await prisma.ledgerTransaction.findMany({
            where: {
                type: 'DEPOSIT',
                createdAt: { gte: thirtyDaysAgo },
            },
            select: {
                amount: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        // Aggregate by day
        const dailyRevenue = aggregateByDay(revenueData, 'amount', true);
        const dailyUsers = aggregateByDay(usersData, null, false);
        const dailyDeposits = aggregateByDay(depositsData, 'amount', false);

        // Get popular products
        const productOrders = await prisma.order.groupBy({
            by: ['productId'],
            _count: { id: true },
            _sum: { totalCredits: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });

        const productIds = productOrders.map((p) => p.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });

        const popularProducts = productOrders.map((po) => {
            const product = products.find((p) => p.id === po.productId);
            return {
                name: product?.name || 'Unknown',
                orders: po._count.id,
                revenue: po._sum.totalCredits?.toString() || '0',
            };
        });

        // Order status distribution
        const ordersByStatus = await prisma.order.groupBy({
            by: ['status'],
            _count: { id: true },
        });

        const statusDistribution = ordersByStatus.map((o) => ({
            status: o.status,
            count: o._count.id,
        }));

        return NextResponse.json({
            revenueChart: dailyRevenue,
            usersChart: dailyUsers,
            depositsChart: dailyDeposits,
            popularProducts,
            statusDistribution,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}

interface DataItem {
    createdAt: Date;
    amount?: { toString(): string } | null;
}

function aggregateByDay(data: DataItem[], amountField: string | null, negate: boolean): Array<{ date: string; value: number }> {
    const grouped: Record<string, number> = {};

    // Initialize all days in range
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        grouped[key] = 0;
    }

    // Aggregate data
    for (const item of data) {
        const key = item.createdAt.toISOString().split('T')[0];
        if (amountField && item.amount) {
            const val = parseFloat(item.amount.toString());
            grouped[key] = (grouped[key] || 0) + (negate ? Math.abs(val) : val);
        } else {
            grouped[key] = (grouped[key] || 0) + 1;
        }
    }

    return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }));
}
