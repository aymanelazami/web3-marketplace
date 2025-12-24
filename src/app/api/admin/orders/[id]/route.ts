import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/admin/orders/:id - Update order status (fulfill, cancel)
export async function PUT(request: Request, { params }: RouteParams) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        const body = await request.json();
        const { status, fulfillmentNote } = body;

        const order = await prisma.order.findUnique({
            where: { id },
            include: { product: true, user: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Update order
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status,
                ...(fulfillmentNote && { fulfillmentNote }),
                ...(status === 'COMPLETED' && { fulfilledAt: new Date() }),
            },
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: `order_${status.toLowerCase()}`,
                entityType: 'order',
                entityId: id,
                detailsJson: JSON.stringify({
                    previousStatus: order.status,
                    newStatus: status,
                    fulfillmentNote
                }),
            },
        });

        return NextResponse.json({ order: updatedOrder });
    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

// POST /api/admin/orders/:id/refund - Initiate refund for order
export async function POST(request: Request, { params }: RouteParams) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        const body = await request.json();
        const { reason, refundAmount } = body;

        const order = await prisma.order.findUnique({
            where: { id },
            include: { user: true, product: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status === 'REFUNDED') {
            return NextResponse.json({ error: 'Order already refunded' }, { status: 400 });
        }

        const amount = refundAmount ? parseFloat(refundAmount) : parseFloat(order.totalCredits.toString());

        // Create refund and credit user in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create refund record
            const refund = await tx.refund.create({
                data: {
                    orderId: id,
                    userId: order.userId,
                    amountCredits: amount,
                    amountUsdt: amount, // 1:1 for credits
                    reason,
                    status: 'COMPLETED',
                    createdBy: auth.userId!,
                    approvedBy: auth.userId!,
                    completedAt: new Date(),
                },
            });

            // Credit user balance
            const newBalance = order.user.creditBalance.plus(amount);
            await tx.user.update({
                where: { id: order.userId },
                data: { creditBalance: newBalance },
            });

            // Create ledger entry
            await tx.ledgerTransaction.create({
                data: {
                    userId: order.userId,
                    type: 'REFUND',
                    amount: amount,
                    balanceAfter: newBalance,
                    referenceType: 'refund',
                    referenceId: refund.id,
                    idempotencyKey: `refund:${refund.id}`,
                },
            });

            // Update order status
            await tx.order.update({
                where: { id },
                data: { status: 'REFUNDED' },
            });

            // Restore product stock if applicable
            if (order.product && order.product.stock !== null) {
                await tx.product.update({
                    where: { id: order.productId },
                    data: { stock: order.product.stock + order.quantity },
                });
            }

            return refund;
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'refund_process',
                entityType: 'refund',
                entityId: result.id,
                detailsJson: JSON.stringify({ orderId: id, amount, reason }),
            },
        });

        return NextResponse.json({ refund: result, message: 'Refund processed successfully' });
    } catch (error) {
        console.error('Process refund error:', error);
        return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
    }
}
