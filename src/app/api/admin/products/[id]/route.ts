import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/admin/products/:id - Update product
export async function PUT(request: Request, { params }: RouteParams) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, priceCredits, imageUrl, stock, isActive } = body;

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(priceCredits !== undefined && { priceCredits: parseFloat(priceCredits) }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(stock !== undefined && { stock: stock === null ? null : parseInt(stock) }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'product_update',
                entityType: 'product',
                entityId: product.id,
                detailsJson: JSON.stringify(body),
            },
        });

        return NextResponse.json({
            product: {
                ...product,
                priceCredits: product.priceCredits.toString(),
            },
        });
    } catch (error) {
        console.error('Admin update product error:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

// DELETE /api/admin/products/:id - Deactivate product
export async function DELETE(request: Request, { params }: RouteParams) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;

        const product = await prisma.product.update({
            where: { id },
            data: { isActive: false },
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'product_delete',
                entityType: 'product',
                entityId: product.id,
                detailsJson: JSON.stringify({ deactivated: true }),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin delete product error:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
