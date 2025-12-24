import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// GET /api/products - List active products
export async function GET() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const products = await prisma.product.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                description: true,
                priceCredits: true,
                imageUrl: true,
                stock: true,
            },
        });

        return NextResponse.json({
            products: products.map((p) => ({
                ...p,
                priceCredits: p.priceCredits.toString(),
            })),
        });
    } catch (error) {
        console.error('Get products error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
