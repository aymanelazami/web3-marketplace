import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// PUT /api/admin/users/[id] - Update user (VIP tier, balance, etc.)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        const body = await request.json();
        const { vipTier, creditBalance, isAdmin } = body;

        const updateData: Record<string, unknown> = {};
        if (vipTier) updateData.vipTier = vipTier;
        if (creditBalance !== undefined) updateData.creditBalance = parseFloat(creditBalance);
        if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'user_update',
                entityType: 'user',
                entityId: id,
                detailsJson: JSON.stringify(body),
            },
        });

        return NextResponse.json({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                vipTier: user.vipTier,
                creditBalance: user.creditBalance.toString(),
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;

        await prisma.user.delete({ where: { id } });

        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'user_delete',
                entityType: 'user',
                entityId: id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
