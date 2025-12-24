import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/ledger - List all ledger transactions
export async function GET(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const type = searchParams.get('type');

        const where = type ? { type } : {};

        const [transactions, total] = await Promise.all([
            prisma.ledgerTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: { walletAddress: true },
                    },
                },
            }),
            prisma.ledgerTransaction.count({ where }),
        ]);

        return NextResponse.json({
            transactions: transactions.map((t) => ({
                id: t.id,
                user: t.user,
                type: t.type,
                amount: t.amount.toString(),
                balanceAfter: t.balanceAfter.toString(),
                referenceType: t.referenceType,
                createdAt: t.createdAt.toISOString(),
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin get ledger error:', error);
        return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 });
    }
}
