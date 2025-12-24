import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/stats - Dashboard statistics
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            totalProducts,
            totalOrders,
            pendingOrders,
            usersToday,
            ordersToday,
            ordersThisWeek,
            totalCreditsInSystem,
            totalDeposits,
            totalPurchases,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.product.count({ where: { isActive: true } }),
            prisma.order.count(),
            prisma.order.count({ where: { status: 'PENDING' } }),
            prisma.user.count({ where: { createdAt: { gte: today } } }),
            prisma.order.count({ where: { createdAt: { gte: today } } }),
            prisma.order.count({ where: { createdAt: { gte: thisWeek } } }),
            prisma.user.aggregate({ _sum: { creditBalance: true } }),
            prisma.ledgerTransaction.aggregate({
                where: { type: 'DEPOSIT' },
                _sum: { amount: true },
            }),
            prisma.ledgerTransaction.aggregate({
                where: { type: 'PURCHASE' },
                _sum: { amount: true },
            }),
        ]);

        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { walletAddress: true } },
                product: { select: { name: true } },
            },
        });

        // Get recent users
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            stats: {
                totalUsers,
                totalProducts,
                totalOrders,
                pendingOrders,
                usersToday,
                ordersToday,
                ordersThisWeek,
                totalCreditsInSystem: totalCreditsInSystem._sum.creditBalance?.toString() || '0',
                totalDeposits: totalDeposits._sum.amount?.toString() || '0',
                totalPurchases: Math.abs(parseFloat(totalPurchases._sum.amount?.toString() || '0')).toString(),
            },
            recentOrders: recentOrders.map((o) => ({
                id: o.id,
                user: o.user.walletAddress,
                product: o.product.name,
                totalCredits: o.totalCredits.toString(),
                status: o.status,
                createdAt: o.createdAt.toISOString(),
            })),
            recentUsers: recentUsers.map((u) => ({
                id: u.id,
                walletAddress: u.walletAddress,
                creditBalance: u.creditBalance.toString(),
                createdAt: u.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Admin get stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
