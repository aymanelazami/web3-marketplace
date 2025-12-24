import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/users - List all users
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        });

        return NextResponse.json({
            users: users.map((u) => ({
                id: u.id,
                walletAddress: u.walletAddress,
                creditBalance: u.creditBalance.toString(),
                vipTier: u.vipTier || 'BRONZE',
                totalSpent: u.totalSpent?.toString() || '0',
                email: u.email,
                isAdmin: u.isAdmin,
                ordersCount: u._count.orders,
                createdAt: u.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Admin get users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST /api/admin/users - Create a new user
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { walletAddress, creditBalance, vipTier, isAdmin, email } = body;

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { walletAddress } });
        if (existing) {
            return NextResponse.json({ error: 'User with this wallet already exists' }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                walletAddress,
                creditBalance: creditBalance ? parseFloat(creditBalance) : 0,
                vipTier: vipTier || 'BRONZE',
                isAdmin: isAdmin || false,
                email: email || null,
            },
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'user_create',
                entityType: 'user',
                entityId: user.id,
                detailsJson: JSON.stringify({ walletAddress, creditBalance, vipTier, isAdmin }),
            },
        });

        return NextResponse.json({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                creditBalance: user.creditBalance.toString(),
                vipTier: user.vipTier,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
