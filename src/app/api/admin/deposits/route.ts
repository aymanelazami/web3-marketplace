import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/deposits - List all deposits
export async function GET(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where = status ? { status: status as 'PENDING' | 'CONFIRMING' | 'CONFIRMED' | 'CREDITED' | 'REORGED' } : {};

        const [deposits, total] = await Promise.all([
            prisma.onchainTransaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.onchainTransaction.count({ where }),
        ]);

        // Summary stats
        const [pendingCount, confirmedCount, creditedCount, totalCredited] = await Promise.all([
            prisma.onchainTransaction.count({ where: { status: 'PENDING' } }),
            prisma.onchainTransaction.count({ where: { status: 'CONFIRMED' } }),
            prisma.onchainTransaction.count({ where: { status: 'CREDITED' } }),
            prisma.onchainTransaction.aggregate({
                where: { status: 'CREDITED' },
                _sum: { amount: true },
            }),
        ]);

        return NextResponse.json({
            deposits: deposits.map((d) => ({
                id: d.id,
                txHash: d.txHash,
                fromAddress: d.fromAddress,
                amount: d.amount.toString(),
                blockNumber: d.blockNumber.toString(),
                confirmations: d.confirmations,
                status: d.status,
                creditedAt: d.creditedAt?.toISOString() || null,
                createdAt: d.createdAt.toISOString(),
            })),
            summary: {
                pending: pendingCount,
                confirmed: confirmedCount,
                credited: creditedCount,
                totalCredited: totalCredited._sum.amount?.toString() || '0',
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin get deposits error:', error);
        return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 });
    }
}

// POST /api/admin/deposits/scan - Manually trigger scanner
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        // Dynamic import to avoid loading heavy blockchain libs
        const { runDepositScanner } = await import('@/lib/depositScanner');
        const result = await runDepositScanner();

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'deposit_scan_manual',
                entityType: 'system',
                entityId: 'deposit-scanner',
                detailsJson: JSON.stringify(result),
            },
        });

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('Manual deposit scan error:', error);
        return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
    }
}
