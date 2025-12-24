import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// GET /api/wishlist - Get user's wishlist
export async function GET() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const wishlistItems = await prisma.wishlist.findMany({
            where: { userId: session.userId },
            select: {
                id: true,
                productId: true,
                createdAt: true,
            },
        });

        // Get product details for wishlist items
        const productIds = wishlistItems.map((w) => w.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
        });

        const wishlist = wishlistItems.map((w) => {
            const product = products.find((p) => p.id === w.productId);
            return {
                id: w.id,
                productId: w.productId,
                product: product ? {
                    name: product.name,
                    priceCredits: product.priceCredits.toString(),
                    imageUrl: product.imageUrl,
                    stock: product.stock,
                } : null,
                addedAt: w.createdAt.toISOString(),
            };
        }).filter((w) => w.product !== null);

        return NextResponse.json({ wishlist });
    } catch (error) {
        console.error('Get wishlist error:', error);
        return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
    }
}

// POST /api/wishlist - Add to wishlist
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        // Check product exists
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product || !product.isActive) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Add to wishlist (upsert to handle duplicates)
        const wishlistItem = await prisma.wishlist.upsert({
            where: {
                userId_productId: {
                    userId: session.userId,
                    productId,
                },
            },
            create: {
                userId: session.userId,
                productId,
            },
            update: {},
        });

        return NextResponse.json({ wishlistItem, message: 'Added to wishlist' });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
    }
}

// DELETE /api/wishlist - Remove from wishlist
export async function DELETE(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        await prisma.wishlist.deleteMany({
            where: {
                userId: session.userId,
                productId,
            },
        });

        return NextResponse.json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
    }
}
