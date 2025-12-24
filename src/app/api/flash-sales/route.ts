import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/flash-sales - Get active flash sales
export async function GET() {
    try {
        const now = new Date();

        const flashSales = await prisma.flashSale.findMany({
            where: {
                isActive: true,
                startTime: { lte: now },
                endTime: { gte: now },
            },
            orderBy: { endTime: 'asc' },
        });

        // Get product details
        const productIds = flashSales.map((s) => s.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
        });

        return NextResponse.json({
            flashSales: flashSales.map((s) => {
                const product = products.find((p) => p.id === s.productId);
                return {
                    id: s.id,
                    productId: s.productId,
                    product: product ? {
                        name: product.name,
                        imageUrl: product.imageUrl,
                        category: product.category,
                    } : null,
                    originalPrice: s.originalPrice.toString(),
                    salePrice: s.salePrice.toString(),
                    discountPercent: s.discountPercent,
                    startTime: s.startTime.toISOString(),
                    endTime: s.endTime.toISOString(),
                    maxQuantity: s.maxQuantity,
                    soldQuantity: s.soldQuantity,
                    remainingTime: s.endTime.getTime() - now.getTime(),
                };
            }),
        });
    } catch (error) {
        console.error('Get flash sales error:', error);
        return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
    }
}
