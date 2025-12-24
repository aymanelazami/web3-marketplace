import { SiweMessage } from 'siwe';
import { randomBytes } from 'crypto';
import prisma from './prisma';
import { config } from './config';

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Create and store a nonce for SIWE authentication
 */
export async function createNonce(walletAddress: string): Promise<{ nonce: string; expiresAt: Date }> {
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + config.nonceExpiry);

    await prisma.authNonce.create({
        data: {
            walletAddress: walletAddress.toLowerCase(),
            nonce,
            expiresAt,
        },
    });

    return { nonce, expiresAt };
}

/**
 * Verify a SIWE message signature
 */
export async function verifySiweMessage(
    message: string,
    signature: string
): Promise<{ valid: boolean; address?: string; error?: string }> {
    try {
        const siweMessage = new SiweMessage(message);
        const { data: verified } = await siweMessage.verify({ signature });

        if (!verified) {
            return { valid: false, error: 'Invalid signature' };
        }

        // Verify nonce is valid and not used
        const nonce = await prisma.authNonce.findFirst({
            where: {
                walletAddress: siweMessage.address.toLowerCase(),
                nonce: siweMessage.nonce,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });

        if (!nonce) {
            return { valid: false, error: 'Invalid or expired nonce' };
        }

        // Mark nonce as used
        await prisma.authNonce.update({
            where: { id: nonce.id },
            data: { used: true },
        });

        return { valid: true, address: siweMessage.address.toLowerCase() };
    } catch (error) {
        console.error('SIWE verification error:', error);
        return { valid: false, error: 'Verification failed' };
    }
}

/**
 * Get or create a user by wallet address
 */
export async function getOrCreateUser(walletAddress: string) {
    const address = walletAddress.toLowerCase();
    const adminWallets = config.getAdminWallets();
    const isAdmin = adminWallets.includes(address);

    let user = await prisma.user.findUnique({
        where: { walletAddress: address },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                walletAddress: address,
                isAdmin,
            },
        });
    } else if (user.isAdmin !== isAdmin) {
        // Update admin status if changed in env
        user = await prisma.user.update({
            where: { id: user.id },
            data: { isAdmin },
        });
    }

    return user;
}

/**
 * Clean up expired nonces (call periodically)
 */
export async function cleanupExpiredNonces(): Promise<number> {
    const result = await prisma.authNonce.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { used: true },
            ],
        },
    });
    return result.count;
}
