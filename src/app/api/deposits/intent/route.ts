import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { config } from '@/lib/config';

// POST /api/deposits/intent - Create deposit intent
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }

        // Check rate limit (max 5 pending intents per hour per user)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentIntents = await prisma.depositIntent.count({
            where: {
                userId: session.userId,
                createdAt: { gt: oneHourAgo },
            },
        });

        if (recentIntents >= config.rateLimit.depositIntents) {
            return NextResponse.json(
                { error: 'Too many deposit requests. Please wait.' },
                { status: 429 }
            );
        }

        const expiresAt = new Date(Date.now() + config.depositIntentExpiry);

        const intent = await prisma.depositIntent.create({
            data: {
                userId: session.userId,
                expectedAmount: amount,
                expiresAt,
            },
        });

        return NextResponse.json({
            intentId: intent.id,
            depositAddress: config.depositAddress,
            amount: intent.expectedAmount.toString(),
            network: 'Polygon',
            chainId: config.chainId,
            tokenContract: config.usdtContract,
            expiresAt: intent.expiresAt.toISOString(),
            warnings: [
                'Send only USDT on Polygon network',
                'Wrong network or token = permanent loss',
                'Verify address character-by-character',
                'Transaction is irreversible',
            ],
        });
    } catch (error) {
        console.error('Create deposit intent error:', error);
        return NextResponse.json({ error: 'Failed to create deposit intent' }, { status: 500 });
    }
}

// GET /api/deposits/intent - List user's deposit history
export async function GET() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const intents = await prisma.depositIntent.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                onchainTransactions: {
                    select: {
                        txHash: true,
                        amount: true,
                        status: true,
                        confirmations: true,
                    },
                },
            },
        });

        return NextResponse.json({
            deposits: intents.map((i) => ({
                id: i.id,
                expectedAmount: i.expectedAmount.toString(),
                status: i.status,
                createdAt: i.createdAt.toISOString(),
                expiresAt: i.expiresAt.toISOString(),
                transactions: i.onchainTransactions.map((tx) => ({
                    txHash: tx.txHash,
                    amount: tx.amount.toString(),
                    status: tx.status,
                    confirmations: tx.confirmations,
                })),
            })),
        });
    } catch (error) {
        console.error('Get deposits error:', error);
        return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 });
    }
}
