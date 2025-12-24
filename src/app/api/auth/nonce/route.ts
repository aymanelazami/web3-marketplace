import { NextResponse } from 'next/server';
import { createNonce } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { walletAddress } = body;

        if (!walletAddress || typeof walletAddress !== 'string') {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        const { nonce, expiresAt } = await createNonce(walletAddress);

        return NextResponse.json({
            nonce,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error('Nonce generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate nonce' },
            { status: 500 }
        );
    }
}
