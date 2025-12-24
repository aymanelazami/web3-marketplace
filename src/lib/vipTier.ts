import prisma from '@/lib/prisma';

// VIP Tier thresholds
export const VIP_TIERS = {
    BRONZE: { min: 0, max: 100, discount: 0 },
    SILVER: { min: 100, max: 500, discount: 5 },
    GOLD: { min: 500, max: Infinity, discount: 10 },
};

// Calculate VIP tier based on total spent
export function calculateVipTier(totalSpent: number): string {
    if (totalSpent >= VIP_TIERS.GOLD.min) return 'GOLD';
    if (totalSpent >= VIP_TIERS.SILVER.min) return 'SILVER';
    return 'BRONZE';
}

// Get VIP discount percentage
export function getVipDiscount(tier: string): number {
    switch (tier) {
        case 'GOLD': return VIP_TIERS.GOLD.discount;
        case 'SILVER': return VIP_TIERS.SILVER.discount;
        default: return VIP_TIERS.BRONZE.discount;
    }
}

// Update user's VIP tier after purchase
export async function updateUserVipTier(userId: string, purchaseAmount: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const newTotalSpent = parseFloat(user.totalSpent.toString()) + purchaseAmount;
    const newTier = calculateVipTier(newTotalSpent);

    // Only update if tier changed
    if (user.vipTier !== newTier || newTotalSpent !== parseFloat(user.totalSpent.toString())) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                totalSpent: newTotalSpent,
                vipTier: newTier,
            },
        });

        // Notify user of tier upgrade
        if (user.vipTier !== newTier) {
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'PROMO',
                    title: `🎉 VIP Upgrade!`,
                    message: `Congratulations! You've been upgraded to ${newTier} tier. Enjoy ${getVipDiscount(newTier)}% off on all purchases!`,
                },
            });
        }
    }
}

// Calculate price with VIP discount
export function applyVipDiscount(price: number, tier: string): number {
    const discount = getVipDiscount(tier);
    return price * (1 - discount / 100);
}
