import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// GET /api/reviews?productId=xxx - Get reviews for a product
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const reviews = await prisma.review.findMany({
            where: { productId, isVisible: true },
            include: {
                user: {
                    select: { walletAddress: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return NextResponse.json({
            reviews: reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                userAddress: r.user.walletAddress.slice(0, 6) + '...' + r.user.walletAddress.slice(-4),
                createdAt: r.createdAt.toISOString(),
            })),
            stats: {
                count: reviews.length,
                averageRating: Math.round(avgRating * 10) / 10,
            },
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

// POST /api/reviews - Create a review
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, rating, comment } = body;

        if (!productId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid rating (1-5 required)' }, { status: 400 });
        }

        // Check if user has purchased this product
        const hasPurchased = await prisma.order.findFirst({
            where: {
                userId: session.userId,
                productId,
                status: { in: ['COMPLETED', 'PENDING', 'PROCESSING'] },
            },
        });

        if (!hasPurchased) {
            return NextResponse.json({ error: 'You must purchase this product to review it' }, { status: 403 });
        }

        // Create or update review
        const review = await prisma.review.upsert({
            where: {
                userId_productId: {
                    userId: session.userId,
                    productId,
                },
            },
            create: {
                userId: session.userId,
                productId,
                rating,
                comment,
            },
            update: {
                rating,
                comment,
            },
        });

        return NextResponse.json({ review });
    } catch (error) {
        console.error('Create review error:', error);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}
