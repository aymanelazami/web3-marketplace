import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/products/:id - Get single product
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product || !product.isActive) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({
            product: {
                id: product.id,
                name: product.name,
                description: product.description,
                priceCredits: product.priceCredits.toString(),
                imageUrl: product.imageUrl,
                stock: product.stock,
                isActive: product.isActive,
            },
        });
    } catch (error) {
        console.error('Get product error:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}
