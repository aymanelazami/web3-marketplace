import { NextResponse } from 'next/server';
import { runDepositScanner } from '@/lib/depositScanner';

// Secret key to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret';

/**
 * POST /api/cron/scan-deposits
 * 
 * This endpoint should be called periodically (every 15-30 seconds) by:
 * - A cron job service (Vercel Cron, Railway, etc.)
 * - A scheduled task
 * - Manual trigger for testing
 * 
 * Security: Requires CRON_SECRET header
 */
export async function POST(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const providedSecret = authHeader?.replace('Bearer ', '');

        if (providedSecret !== CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Run the deposit scanner
        const result = await runDepositScanner();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...result,
        });
    } catch (error) {
        console.error('Deposit scanner error:', error);
        return NextResponse.json(
            { error: 'Scanner failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/cron/scan-deposits
 * 
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'deposit-scanner',
        message: 'Use POST with Bearer token to run scanner',
    });
}
