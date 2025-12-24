import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// Default settings
const DEFAULT_SETTINGS = {
    storeName: 'Web3 Marketplace',
    storeDescription: 'The premier decentralized marketplace for digital products and NFTs',
    confirmationThreshold: '12',
    sellerCommissionRate: '0.10',
    minDepositAmount: '1',
    maxWithdrawalLimit: '10000',
    supportEmail: 'support@web3store.com',
    maintenanceMode: 'false',
    adminWalletAddress: '',
};

// GET /api/admin/settings - Get all settings
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const settings = await (prisma as any).setting.findMany();

        // Merge with defaults
        const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
        settings.forEach((s: any) => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json({ settings: settingsMap });
    } catch (error) {
        console.error('Get settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { settings } = body;

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
        }

        // Update each setting
        for (const [key, value] of Object.entries(settings)) {
            await (prisma as any).setting.upsert({
                where: { key },
                create: { key, value: String(value) },
                update: { value: String(value) },
            });
        }

        // Create audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'settings_update',
                entityType: 'settings',
                entityId: 'global',
                detailsJson: JSON.stringify({ updatedKeys: Object.keys(settings) }),
            },
        });

        return NextResponse.json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
