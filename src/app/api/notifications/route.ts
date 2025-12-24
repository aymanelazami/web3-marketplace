import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// GET /api/notifications - Get user's notifications
export async function GET() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: session.userId, isRead: false },
        });

        return NextResponse.json({
            notifications: notifications.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                link: n.link,
                isRead: n.isRead,
                createdAt: n.createdAt.toISOString(),
            })),
            unreadCount,
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { notificationId, markAllRead } = body;

        if (markAllRead) {
            await prisma.notification.updateMany({
                where: { userId: session.userId, isRead: false },
                data: { isRead: true },
            });
        } else if (notificationId) {
            await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
