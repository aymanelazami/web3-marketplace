import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/payment-methods - Get active payment methods
export async function GET() {
    try {
        const paymentMethods = await prisma.paymentMethod.findMany({
            where: { isActive: true },
            orderBy: { currency: 'asc' },
        });

        return NextResponse.json({
            paymentMethods: paymentMethods.map((m) => ({
                id: m.id,
                currency: m.currency,
                name: m.name,
                symbol: m.symbol,
                chain: m.chain,
                depositAddress: m.depositAddress,
                decimalPlaces: m.decimalPlaces,
                usdRate: m.usdRate?.toString() || null,
            })),
        });
    } catch (error) {
        console.error('Get payment methods error:', error);
        return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }
}

// POST /api/payment-methods - Admin: Add payment method
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { currency, name, symbol, chain, contractAddress, depositAddress, decimalPlaces } = body;

        const paymentMethod = await prisma.paymentMethod.create({
            data: {
                currency,
                name,
                symbol,
                chain,
                contractAddress,
                depositAddress,
                decimalPlaces: decimalPlaces || 18,
            },
        });

        return NextResponse.json({ paymentMethod });
    } catch (error) {
        console.error('Create payment method error:', error);
        return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
    }
}
