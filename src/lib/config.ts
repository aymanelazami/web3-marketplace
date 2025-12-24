import { mainnet } from 'viem/chains';

export const config = {
    // Chain configuration - Ethereum Mainnet
    chain: mainnet,
    chainId: 1,

    // USDT on Ethereum Mainnet
    usdtContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`,
    usdtDecimals: 6,

    // Treasury address for deposits
    depositAddress: process.env.NEXT_PUBLIC_DEPOSIT_ADDRESS as `0x${string}`,

    // Confirmation threshold for idempotent crediting (Ethereum needs more confirmations)
    confirmationThreshold: 12,

    // Session settings
    sessionDuration: 15 * 60, // 15 minutes in seconds

    // Nonce settings
    nonceExpiry: 5 * 60 * 1000, // 5 minutes in milliseconds

    // Deposit intent settings
    depositIntentExpiry: 60 * 60 * 1000, // 1 hour in milliseconds

    // Rate limiting
    rateLimit: {
        authAttempts: 10, // per minute per IP
        depositIntents: 5, // per hour per user
    },

    // Admin wallets (from env)
    getAdminWallets: (): string[] => {
        const wallets = process.env.ADMIN_WALLETS || '';
        return wallets.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
    },
} as const;

export const SIWE_DOMAIN = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
export const SIWE_URI = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
