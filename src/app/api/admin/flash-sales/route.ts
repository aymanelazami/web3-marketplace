import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/flash-sales - List all flash sales
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const flashSales = await prisma.flashSale.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const productIds = flashSales.map((s) => s.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        return NextResponse.json({
            flashSales: flashSales.map((s) => {
                const product = products.find((p) => p.id === s.productId);
                return {
                    id: s.id,
                    productId: s.productId,
                    productName: product?.name || 'Unknown',
                    originalPrice: s.originalPrice.toString(),
                    salePrice: s.salePrice.toString(),
                    discountPercent: s.discountPercent,
                    startTime: s.startTime.toISOString(),
                    endTime: s.endTime.toISOString(),
                    maxQuantity: s.maxQuantity,
                    soldQuantity: s.soldQuantity,
                    isActive: s.isActive,
                };
            }),
        });
    } catch (error) {
        console.error('Get flash sales error:', error);
        return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
    }
}

// POST /api/admin/flash-sales - Create flash sale
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { productId, discountPercent, startTime, endTime, maxQuantity } = body;

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const originalPrice = parseFloat(product.priceCredits.toString());
        const salePrice = originalPrice * (1 - discountPercent / 100);

        const flashSale = await prisma.flashSale.create({
            data: {
                productId,
                originalPrice,
                salePrice,
                discountPercent: parseInt(discountPercent),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                maxQuantity: maxQuantity ? parseInt(maxQuantity) : null,
            },
        });

        return NextResponse.json({ flashSale });
    } catch (error) {
        console.error('Create flash sale error:', error);
        return NextResponse.json({ error: 'Failed to create flash sale' }, { status: 500 });
    }
}
