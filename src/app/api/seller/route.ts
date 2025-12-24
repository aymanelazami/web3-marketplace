import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/seller - Get current user's seller status
export async function GET() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const seller = await prisma.seller.findUnique({
            where: { userId: session.userId },
        });

        if (!seller) {
            return NextResponse.json({ isSeller: false });
        }

        return NextResponse.json({
            isSeller: true,
            seller: {
                id: seller.id,
                storeName: seller.storeName,
                storeDescription: seller.storeDescription,
                logoUrl: seller.logoUrl,
                status: seller.status,
                totalSales: seller.totalSales.toString(),
                totalEarnings: seller.totalEarnings.toString(),
                rating: seller.rating?.toString() || '0',
                reviewCount: seller.reviewCount,
                verifiedAt: seller.verifiedAt?.toISOString(),
            },
        });
    } catch (error) {
        console.error('Get seller error:', error);
        return NextResponse.json({ error: 'Failed to fetch seller' }, { status: 500 });
    }
}

// POST /api/seller - Apply to become a seller
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if already applied
        const existing = await prisma.seller.findUnique({
            where: { userId: session.userId },
        });

        if (existing) {
            return NextResponse.json({
                error: `You already have a seller application (Status: ${existing.status})`
            }, { status: 400 });
        }

        const body = await request.json();
        const { storeName, storeDescription, email, website, applicationNote } = body;

        if (!storeName) {
            return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
        }

        const seller = await prisma.seller.create({
            data: {
                userId: session.userId,
                storeName,
                storeDescription,
                email,
                website,
                applicationNote,
            },
        });

        return NextResponse.json({
            message: 'Seller application submitted successfully',
            seller: {
                id: seller.id,
                storeName: seller.storeName,
                status: seller.status,
            },
        });
    } catch (error) {
        console.error('Apply seller error:', error);
        return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }
}

// PUT /api/seller - Update seller profile (for approved sellers)
export async function PUT(request: Request) {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const seller = await prisma.seller.findUnique({
            where: { userId: session.userId },
        });

        if (!seller || seller.status !== 'APPROVED') {
            return NextResponse.json({ error: 'Not an approved seller' }, { status: 403 });
        }

        const body = await request.json();
        const { storeName, storeDescription, logoUrl, bannerUrl, email, website, socialLinks } = body;

        const updated = await prisma.seller.update({
            where: { userId: session.userId },
            data: {
                ...(storeName && { storeName }),
                ...(storeDescription !== undefined && { storeDescription }),
                ...(logoUrl !== undefined && { logoUrl }),
                ...(bannerUrl !== undefined && { bannerUrl }),
                ...(email !== undefined && { email }),
                ...(website !== undefined && { website }),
                ...(socialLinks !== undefined && { socialLinks }),
            },
        });

        return NextResponse.json({ seller: updated });
    } catch (error) {
        console.error('Update seller error:', error);
        return NextResponse.json({ error: 'Failed to update seller' }, { status: 500 });
    }
}
