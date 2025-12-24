import prisma from '@/lib/prisma';

// Seller commission rate (10%)
export const SELLER_COMMISSION_RATE = 0.10;

// Process seller commission on order completion
export async function processSellerCommission(
    orderId: string,
    productId: string,
    totalAmount: number
) {
    // Find the product's seller
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product?.sellerId) {
        // Not a seller product, skip commission
        return null;
    }

    const commissionAmount = totalAmount * SELLER_COMMISSION_RATE;
    const sellerEarnings = totalAmount - commissionAmount;

    // Update seller earnings
    const seller = await prisma.seller.findUnique({
        where: { userId: product.sellerId },
    });

    if (seller) {
        await prisma.seller.update({
            where: { userId: product.sellerId },
            data: {
                totalSales: { increment: totalAmount },
                totalEarnings: { increment: sellerEarnings },
            },
        });

        // Notify seller of sale
        await prisma.notification.create({
            data: {
                userId: product.sellerId,
                type: 'ORDER',
                title: '💰 New Sale!',
                message: `Your product "${product.name}" was sold for $${totalAmount.toFixed(2)}. You earned $${sellerEarnings.toFixed(2)} (after 10% platform fee).`,
            },
        });
    }

    return {
        commissionAmount,
        sellerEarnings,
        sellerId: product.sellerId,
    };
}

// Get admin's total commission earnings
export async function getAdminCommission() {
    const sellers = await prisma.seller.findMany({
        where: { status: 'APPROVED' },
    });

    const totalSales = sellers.reduce((sum, s) => sum + parseFloat(s.totalSales.toString()), 0);
    const totalSellerEarnings = sellers.reduce((sum, s) => sum + parseFloat(s.totalEarnings.toString()), 0);
    const adminCommission = totalSales - totalSellerEarnings;

    return {
        totalSales,
        totalSellerEarnings,
        adminCommission,
        commissionRate: SELLER_COMMISSION_RATE,
    };
}
