import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET /api/admin/products - List all products (including inactive)
export async function GET() {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            products: products.map((p) => ({
                ...p,
                priceCredits: p.priceCredits.toString(),
            })),
        });
    } catch (error) {
        console.error('Admin get products error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// POST /api/admin/products - Create new product
export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { name, description, priceCredits, imageUrl, stock } = body;

        if (!name || !description || !priceCredits) {
            return NextResponse.json({ error: 'Name, description, and price are required' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                priceCredits: parseFloat(priceCredits),
                imageUrl: imageUrl || null,
                stock: stock !== undefined ? parseInt(stock) : null,
            },
        });

        // Audit log
        await prisma.adminAuditLog.create({
            data: {
                adminId: auth.userId!,
                action: 'product_create',
                entityType: 'product',
                entityId: product.id,
                detailsJson: JSON.stringify({ name, priceCredits }),
            },
        });

        return NextResponse.json({
            product: {
                ...product,
                priceCredits: product.priceCredits.toString(),
            },
        });
    } catch (error) {
        console.error('Admin create product error:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
