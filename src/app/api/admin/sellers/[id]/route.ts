import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/admin/sellers/:id - Approve/reject seller application
export async function PUT(request: Request, { params }: RouteParams) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        const body = await request.json();
        const { status, rejectionReason, commissionRate } = body;

        const seller = await prisma.seller.findUnique({ where: { id } });
        if (!seller) {
            return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
        }

        const updated = await prisma.seller.update({
            where: { id },
            data: {
                status,
                ...(rejectionReason && { rejectionReason }),
                ...(commissionRate && { commissionRate: parseFloat(commissionRate) }),
                ...(status === 'APPROVED' && { verifiedAt: new Date() }),
            },
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: `seller_${status.toLowerCase()}`,
                entityType: 'seller',
                entityId: id,
                detailsJson: JSON.stringify({
                    previousStatus: seller.status,
                    newStatus: status,
                    rejectionReason
                }),
            },
        });

        return NextResponse.json({ seller: updated });
    } catch (error) {
        console.error('Update seller error:', error);
        return NextResponse.json({ error: 'Failed to update seller' }, { status: 500 });
    }
}
