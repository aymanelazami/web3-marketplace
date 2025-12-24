import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { getConfirmations } from '@/lib/depositScanner';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/deposits/:id/status
 * 
 * Check the status of a specific deposit intent
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const intent = await prisma.depositIntent.findUnique({
            where: { id },
            include: {
                onchainTransactions: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!intent) {
            return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
        }

        // Verify ownership
        if (intent.userId !== session.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get live confirmation count for pending transactions
        const transactions = await Promise.all(
            intent.onchainTransactions.map(async (tx) => {
                let confirmations = tx.confirmations;
                if (tx.status !== 'CREDITED') {
                    try {
                        confirmations = await getConfirmations(tx.blockNumber);
                    } catch {
                        // Keep existing confirmation count on error
                    }
                }
                return {
                    txHash: tx.txHash,
                    amount: tx.amount.toString(),
                    confirmations,
                    status: tx.status,
                    creditedAt: tx.creditedAt?.toISOString() || null,
                };
            })
        );

        return NextResponse.json({
            depositIntent: {
                id: intent.id,
                expectedAmount: intent.expectedAmount.toString(),
                status: intent.status,
                expiresAt: intent.expiresAt.toISOString(),
                createdAt: intent.createdAt.toISOString(),
            },
            transactions,
            confirmationThreshold: 12, // Ethereum
        });
    } catch (error) {
        console.error('Get deposit status error:', error);
        return NextResponse.json({ error: 'Failed to get deposit status' }, { status: 500 });
    }
}
