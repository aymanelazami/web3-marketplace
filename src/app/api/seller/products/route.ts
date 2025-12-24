import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// GET /api/seller/products - Get seller's products
export async function GET() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is approved seller
        const seller = await prisma.seller.findUnique({
            where: { userId: session.userId },
        });

        if (!seller || seller.status !== 'APPROVED') {
            return NextResponse.json({ error: 'Not an approved seller' }, { status: 403 });
        }

        const products = await prisma.product.findMany({
            where: { sellerId: session.userId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            products: products.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                priceCredits: p.priceCredits.toString(),
                imageUrl: p.imageUrl,
                category: p.category,
                productType: p.productType,
                stock: p.stock,
                isActive: p.isActive,
                nftContract: p.nftContract,
                nftTokenId: p.nftTokenId,
                createdAt: p.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Get seller products error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// POST /api/seller/products - Create a new product
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is approved seller
        const seller = await prisma.seller.findUnique({
            where: { userId: session.userId },
        });

        if (!seller || seller.status !== 'APPROVED') {
            return NextResponse.json({ error: 'Not an approved seller' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            description,
            priceCredits,
            imageUrl,
            fileUrl,
            category,
            productType,
            stock,
            nftContract,
            nftTokenId,
            nftChain
        } = body;

        if (!name || !description || !priceCredits) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                priceCredits: parseFloat(priceCredits),
                imageUrl,
                fileUrl,
                category: category || 'General',
                productType: productType || 'digital',
                stock: stock ? parseInt(stock) : null,
                sellerId: session.userId,
                nftContract,
                nftTokenId,
                nftChain,
                isActive: true,
            },
        });

        return NextResponse.json({
            message: 'Product created successfully',
            product: {
                id: product.id,
                name: product.name,
            },
        });
    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
