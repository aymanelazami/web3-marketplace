import prisma from '@/lib/prisma';

// Create notification for a user
export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
) {
    return prisma.notification.create({
        data: { userId, type, title, message, link },
    });
}

// Create notifications for all users (e.g., promotions)
export async function broadcastNotification(
    type: string,
    title: string,
    message: string,
    link?: string
) {
    const users = await prisma.user.findMany({ select: { id: true } });

    await prisma.notification.createMany({
        data: users.map((u) => ({
            userId: u.id,
            type,
            title,
            message,
            link,
        })),
    });
}
