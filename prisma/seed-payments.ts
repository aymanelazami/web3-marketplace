import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPaymentMethods() {
    console.log('Seeding payment methods...');

    const paymentMethods = [
        {
            currency: 'USDT',
            name: 'Tether USD',
            symbol: 'USDT',
            chain: 'ethereum',
            contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            depositAddress: process.env.USDT_DEPOSIT_ADDRESS || '0x0000000000000000000000000000000000000000',
            decimalPlaces: 6,
            usdRate: 1.0,
        },
        {
            currency: 'ETH',
            name: 'Ethereum',
            symbol: 'ETH',
            chain: 'ethereum',
            contractAddress: null,
            depositAddress: process.env.ETH_DEPOSIT_ADDRESS || '0x0000000000000000000000000000000000000000',
            decimalPlaces: 18,
            usdRate: 3500.0, // Example rate
        },
        {
            currency: 'BTC',
            name: 'Bitcoin',
            symbol: 'BTC',
            chain: 'bitcoin',
            contractAddress: null,
            depositAddress: process.env.BTC_DEPOSIT_ADDRESS || 'bc1q0000000000000000000000000000000000000',
            decimalPlaces: 8,
            usdRate: 100000.0, // Example rate
        },
    ];

    for (const method of paymentMethods) {
        await prisma.paymentMethod.upsert({
            where: {
                currency_chain: {
                    currency: method.currency,
                    chain: method.chain,
                },
            },
            create: method,
            update: {
                name: method.name,
                usdRate: method.usdRate,
            },
        });
        console.log(`Added/updated ${method.currency} on ${method.chain}`);
    }

    console.log('Payment methods seeded!');
}

seedPaymentMethods()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
