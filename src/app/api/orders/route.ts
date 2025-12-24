import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { updateUserVipTier, applyVipDiscount } from '@/lib/vipTier';
import { processSellerCommission } from '@/lib/sellerCommission';

// GET /api/orders - List user's orders
export async function GET() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    select: { name: true, imageUrl: true },
                },
            },
        });

        return NextResponse.json({
            orders: orders.map((o) => ({
                id: o.id,
                product: o.product,
                quantity: o.quantity,
                totalCredits: o.totalCredits.toString(),
                status: o.status,
                fulfillmentNote: o.fulfillmentNote,
                createdAt: o.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// POST /api/orders - Create new order
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, quantity = 1, paymentMethod = 'USDT' } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        // Get product
        const product = await prisma.product.findUnique({
            where: { id: productId, isActive: true },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Check stock
        if (product.stock !== null && product.stock < quantity) {
            return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
        }

        // Get user and check balance
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Calculate price with VIP discount
        let basePrice = parseFloat(product.priceCredits.toString()) * quantity;

        // Check for flash sale
        const flashSale = await prisma.flashSale.findFirst({
            where: {
                productId,
                isActive: true,
                startTime: { lte: new Date() },
                endTime: { gte: new Date() },
            },
        });

        if (flashSale) {
            basePrice = parseFloat(flashSale.salePrice.toString()) * quantity;
        }

        // Apply VIP discount
        const finalPrice = applyVipDiscount(basePrice, user.vipTier);

        if (user.creditBalance.lessThan(finalPrice)) {
            return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 400 });
        }

        // Create order and deduct credits atomically
        const idempotencyKey = `purchase:${crypto.randomUUID()}`;
        const newBalance = user.creditBalance.minus(finalPrice);

        const [order] = await prisma.$transaction([
            // Create order
            prisma.order.create({
                data: {
                    userId: session.userId,
                    productId,
                    quantity,
                    totalCredits: finalPrice,
                    status: 'PENDING',
                },
            }),
            // Deduct credits
            prisma.user.update({
                where: { id: session.userId },
                data: { creditBalance: newBalance },
            }),
            // Create ledger entry
            prisma.ledgerTransaction.create({
                data: {
                    userId: session.userId,
                    type: 'PURCHASE',
                    amount: -finalPrice,
                    balanceAfter: newBalance,
                    referenceType: 'order',
                    idempotencyKey,
                },
            }),
            // Decrement stock if applicable
            ...(product.stock !== null
                ? [
                    prisma.product.update({
                        where: { id: productId },
                        data: { stock: { decrement: quantity } },
                    }),
                ]
                : []),
        ]);

        // Update flash sale sold quantity
        if (flashSale) {
            await prisma.flashSale.update({
                where: { id: flashSale.id },
                data: { soldQuantity: { increment: quantity } },
            });
        }

        // Update VIP tier based on spending
        await updateUserVipTier(session.userId, finalPrice);

        // Process seller commission if applicable
        await processSellerCommission(order.id, productId, finalPrice);

        // Create order notification
        await prisma.notification.create({
            data: {
                userId: session.userId,
                type: 'ORDER',
                title: '🛒 Order Placed!',
                message: `Your order for "${product.name}" has been placed. Total: $${finalPrice.toFixed(2)}`,
                link: `/orders`,
            },
        });

        return NextResponse.json({
            order: {
                id: order.id,
                totalCredits: order.totalCredits.toString(),
                status: order.status,
            },
            newBalance: newBalance.toString(),
            vipTier: user.vipTier,
        });
    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
