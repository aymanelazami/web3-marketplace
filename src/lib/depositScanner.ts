import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';
import prisma from './prisma';
import { config } from './config';

// USDT contract on Ethereum Mainnet
const USDT_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_DECIMALS = 6;

// Transfer event signature
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

// Public client for reading blockchain
const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'),
});

export interface DetectedTransfer {
    txHash: string;
    logIndex: number;
    fromAddress: string;
    toAddress: string;
    amount: string;
    blockNumber: bigint;
}

/**
 * Scan for USDT transfers to our deposit address
 */
export async function scanForDeposits(fromBlock: bigint, toBlock: bigint): Promise<DetectedTransfer[]> {
    const depositAddress = config.depositAddress?.toLowerCase();

    if (!depositAddress || depositAddress === '0x_your_treasury_address_here') {
        console.log('Deposit address not configured, skipping scan');
        return [];
    }

    try {
        const logs = await publicClient.getLogs({
            address: USDT_CONTRACT as `0x${string}`,
            event: TRANSFER_EVENT,
            fromBlock,
            toBlock,
            args: {
                to: depositAddress as `0x${string}`,
            },
        });

        return logs.map((log) => ({
            txHash: log.transactionHash,
            logIndex: log.logIndex,
            fromAddress: (log.args.from as string).toLowerCase(),
            toAddress: (log.args.to as string).toLowerCase(),
            amount: formatUnits(log.args.value as bigint, USDT_DECIMALS),
            blockNumber: log.blockNumber,
        }));
    } catch (error) {
        console.error('Error scanning for deposits:', error);
        return [];
    }
}

/**
 * Get current block number
 */
export async function getCurrentBlock(): Promise<bigint> {
    return await publicClient.getBlockNumber();
}

/**
 * Get number of confirmations for a block
 */
export async function getConfirmations(blockNumber: bigint): Promise<number> {
    const currentBlock = await getCurrentBlock();
    return Number(currentBlock - blockNumber);
}

/**
 * Process detected transfers - create onchain_transactions records
 */
export async function processDetectedTransfers(transfers: DetectedTransfer[]): Promise<number> {
    let processed = 0;

    for (const transfer of transfers) {
        try {
            // Check if already exists (idempotent)
            const existing = await prisma.onchainTransaction.findFirst({
                where: {
                    txHash: transfer.txHash,
                    logIndex: transfer.logIndex,
                },
            });

            if (existing) {
                continue; // Already processed
            }

            // Find matching deposit intent by from_address
            const intent = await prisma.depositIntent.findFirst({
                where: {
                    status: 'PENDING',
                    user: {
                        walletAddress: transfer.fromAddress,
                    },
                },
                include: { user: true },
                orderBy: { createdAt: 'desc' },
            });

            // Create onchain transaction record
            await prisma.onchainTransaction.create({
                data: {
                    txHash: transfer.txHash,
                    logIndex: transfer.logIndex,
                    fromAddress: transfer.fromAddress,
                    toAddress: transfer.toAddress,
                    amount: parseFloat(transfer.amount),
                    blockNumber: transfer.blockNumber,
                    status: 'PENDING',
                    depositIntentId: intent?.id || null,
                },
            });

            // Update deposit intent status if matched
            if (intent) {
                await prisma.depositIntent.update({
                    where: { id: intent.id },
                    data: { status: 'DETECTED' },
                });
            }

            processed++;
            console.log(`Detected deposit: ${transfer.txHash} - ${transfer.amount} USDT from ${transfer.fromAddress}`);
        } catch (error) {
            console.error(`Error processing transfer ${transfer.txHash}:`, error);
        }
    }

    return processed;
}

/**
 * Update confirmations and credit eligible deposits
 */
export async function processConfirmations(): Promise<{ updated: number; credited: number }> {
    let updated = 0;
    let credited = 0;

    // Get pending/confirming transactions
    const pendingTxs = await prisma.onchainTransaction.findMany({
        where: {
            status: { in: ['PENDING', 'CONFIRMING'] },
        },
    });

    for (const tx of pendingTxs) {
        try {
            const confirmations = await getConfirmations(tx.blockNumber);

            // Update confirmation count
            let newStatus = tx.status;
            if (confirmations >= config.confirmationThreshold) {
                newStatus = 'CONFIRMED';
            } else if (confirmations >= 6) {
                newStatus = 'CONFIRMING';
            }

            await prisma.onchainTransaction.update({
                where: { id: tx.id },
                data: { confirmations, status: newStatus },
            });

            updated++;

            // Credit user if confirmed and not yet credited
            if (newStatus === 'CONFIRMED' && tx.status !== 'CREDITED') {
                const creditResult = await creditUserDeposit(tx.id);
                if (creditResult) credited++;
            }
        } catch (error) {
            console.error(`Error updating confirmations for ${tx.txHash}:`, error);
        }
    }

    return { updated, credited };
}

/**
 * Credit user for a confirmed deposit (idempotent)
 */
export async function creditUserDeposit(onchainTxId: string): Promise<boolean> {
    const tx = await prisma.onchainTransaction.findUnique({
        where: { id: onchainTxId },
        include: { depositIntent: { include: { user: true } } },
    });

    if (!tx || tx.status === 'CREDITED') {
        return false;
    }

    // Find user by from_address
    let user = tx.depositIntent?.user;

    if (!user) {
        // Try to find user directly by from_address
        user = await prisma.user.findUnique({
            where: { walletAddress: tx.fromAddress },
        }) ?? undefined;
    }

    if (!user) {
        console.log(`No user found for deposit from ${tx.fromAddress}`);
        return false;
    }

    const amount = tx.amount;
    const idempotencyKey = `deposit:${tx.txHash}:${tx.logIndex}`;

    try {
        // Atomic transaction: credit user + create ledger entry
        const newBalance = user.creditBalance.plus(amount);

        await prisma.$transaction([
            // Create ledger entry (will fail on duplicate idempotency key)
            prisma.ledgerTransaction.create({
                data: {
                    userId: user.id,
                    type: 'DEPOSIT',
                    amount: amount,
                    balanceAfter: newBalance,
                    referenceType: 'deposit',
                    referenceId: tx.id,
                    idempotencyKey,
                },
            }),
            // Update user balance
            prisma.user.update({
                where: { id: user.id },
                data: { creditBalance: newBalance },
            }),
            // Mark transaction as credited
            prisma.onchainTransaction.update({
                where: { id: tx.id },
                data: { status: 'CREDITED', creditedAt: new Date() },
            }),
            // Update deposit intent if exists
            ...(tx.depositIntentId
                ? [
                    prisma.depositIntent.update({
                        where: { id: tx.depositIntentId },
                        data: { status: 'CREDITED' },
                    }),
                ]
                : []),
        ]);

        console.log(`Credited ${amount} to user ${user.walletAddress} for tx ${tx.txHash}`);
        return true;
    } catch (error: unknown) {
        // Check for unique constraint violation (already credited)
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            console.log(`Deposit ${tx.txHash} already credited (idempotent)`);
            return false;
        }
        console.error(`Error crediting deposit ${tx.txHash}:`, error);
        return false;
    }
}

/**
 * Get last scanned block from database
 */
export async function getLastScannedBlock(): Promise<bigint> {
    const latest = await prisma.onchainTransaction.findFirst({
        orderBy: { blockNumber: 'desc' },
        select: { blockNumber: true },
    });

    if (latest) {
        return BigInt(latest.blockNumber.toString());
    }

    // Default: start from recent block (last 1000 blocks)
    const currentBlock = await getCurrentBlock();
    return currentBlock - BigInt(1000);
}

/**
 * Main deposit scanner function - call periodically
 */
export async function runDepositScanner(): Promise<{
    scannedBlocks: number;
    newDeposits: number;
    updatedConfirmations: number;
    creditedDeposits: number;
}> {
    console.log('Starting deposit scanner...');

    const currentBlock = await getCurrentBlock();
    const lastScanned = await getLastScannedBlock();

    // Scan in chunks of 100 blocks
    const fromBlock = lastScanned + BigInt(1);
    const toBlock = currentBlock - BigInt(1); // Leave 1 block buffer

    if (fromBlock >= toBlock) {
        console.log('No new blocks to scan');
        return { scannedBlocks: 0, newDeposits: 0, updatedConfirmations: 0, creditedDeposits: 0 };
    }

    // Scan for new deposits
    const transfers = await scanForDeposits(fromBlock, toBlock);
    const newDeposits = await processDetectedTransfers(transfers);

    // Update confirmations and credit eligible deposits
    const { updated, credited } = await processConfirmations();

    const scannedBlocks = Number(toBlock - fromBlock + BigInt(1));
    console.log(`Scanned ${scannedBlocks} blocks, found ${newDeposits} new deposits, credited ${credited}`);

    return {
        scannedBlocks,
        newDeposits,
        updatedConfirmations: updated,
        creditedDeposits: credited,
    };
}
