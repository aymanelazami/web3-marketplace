import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function requireAdmin() {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
        return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    if (!session.isAdmin) {
        return { authorized: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    return { authorized: true, userId: session.userId, walletAddress: session.walletAddress };
}
