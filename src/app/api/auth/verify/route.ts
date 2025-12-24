import { NextResponse } from 'next/server';
import { verifySiweMessage, getOrCreateUser } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, signature } = body;

        if (!message || !signature) {
            return NextResponse.json(
                { error: 'Message and signature are required' },
                { status: 400 }
            );
        }

        // Verify SIWE signature
        const result = await verifySiweMessage(message, signature);

        if (!result.valid || !result.address) {
            return NextResponse.json(
                { error: result.error || 'Verification failed' },
                { status: 401 }
            );
        }

        // Get or create user
        const user = await getOrCreateUser(result.address);

        // Create session
        const session = await getSession();
        session.userId = user.id;
        session.walletAddress = user.walletAddress;
        session.isAdmin = user.isAdmin;
        session.isLoggedIn = true;
        await session.save();

        return NextResponse.json({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                creditBalance: user.creditBalance.toString(),
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        console.error('SIWE verification error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
