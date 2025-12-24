'use client';

import { useAuth } from '@/providers';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    description: string;
    priceCredits: string;
    imageUrl: string | null;
    stock: number | null;
}

export default function ProductDetailPage() {
    const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated && params.id) {
            fetchProduct();
        }
    }, [isAuthenticated, params.id]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data.product);
            } else {
                router.push('/dashboard');
            }
        } catch {
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!product) return;

        setPurchasing(true);
        setError(null);

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, quantity }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error === 'INSUFFICIENT_CREDITS') {
                    setError('Insufficient credits. Please deposit more USDT.');
                } else if (data.error === 'OUT_OF_STOCK') {
                    setError('This product is out of stock.');
                } else {
                    setError(data.error || 'Purchase failed. Please try again.');
                }
                return;
            }

            setSuccess(true);
            refreshUser(); // Update balance
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    if (isLoading || loading) {
        return (
            <main className="product-page-loading">
                <div className="spinner" />
            </main>
        );
    }

    if (!product) {
        return null;
    }

    const userBalance = parseFloat(user?.creditBalance || '0');
    const productPrice = parseFloat(product.priceCredits);
    const totalPrice = productPrice * quantity;
    const canAfford = userBalance >= totalPrice;
    const inStock = product.stock === null || product.stock > 0;
    const maxQuantity = product.stock ?? 10;

    const formatCredits = (credits: number) =>
        credits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <main className="product-page">
            {/* Header */}
            <header className="page-header">
                <Link href="/dashboard" className="back-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to Store
                </Link>
            </header>

            <div className="product-container">
                {/* Product Image */}
                <div className="product-image-wrapper">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="product-image" />
                    ) : (
                        <div className="product-image-placeholder">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                <path d="M21 15L16 10L4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                    )}
                    {!inStock && (
                        <div className="out-of-stock-overlay">
                            <span>Out of Stock</span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="product-info">
                    <h1 className="product-title">{product.name}</h1>

                    <div className="product-price">
                        <span className="price-amount">{formatCredits(productPrice)}</span>
                        <span className="price-label">credits</span>
                    </div>

                    <p className="product-description">{product.description}</p>

                    {/* Stock Status */}
                    {product.stock !== null && (
                        <div className="stock-info">
                            <span className={`stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}`}>
                                {inStock ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                        </div>
                    )}

                    {/* Quantity Selector */}
                    {inStock && maxQuantity > 1 && (
                        <div className="quantity-selector">
                            <label>Quantity</label>
                            <div className="quantity-controls">
                                <button
                                    className="qty-btn"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="qty-value">{quantity}</span>
                                <button
                                    className="qty-btn"
                                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                                    disabled={quantity >= maxQuantity}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Total */}
                    {quantity > 1 && (
                        <div className="total-price">
                            <span>Total:</span>
                            <span className="total-amount">{formatCredits(totalPrice)} credits</span>
                        </div>
                    )}

                    {/* Balance Check */}
                    <div className={`balance-info ${canAfford ? 'sufficient' : 'insufficient'}`}>
                        <span>Your balance:</span>
                        <span className="balance-amount">{formatCredits(userBalance)} credits</span>
                        {!canAfford && (
                            <span className="balance-warning">
                                (Need {formatCredits(totalPrice - userBalance)} more)
                            </span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="product-actions">
                        <button
                            className="btn btn-primary btn-large"
                            onClick={() => setShowPurchaseModal(true)}
                            disabled={!canAfford || !inStock}
                        >
                            {!inStock ? 'Out of Stock' : !canAfford ? 'Insufficient Credits' : 'Purchase Now'}
                        </button>
                        {!canAfford && (
                            <Link href="/dashboard" className="btn btn-secondary">
                                Deposit Credits
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Purchase Confirmation Modal */}
            {showPurchaseModal && (
                <div className="modal-overlay" onClick={() => !purchasing && setShowPurchaseModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        {success ? (
                            <>
                                <div className="success-icon">✓</div>
                                <h2>Purchase Successful!</h2>
                                <p>Your order has been placed and is being processed.</p>
                                <div className="modal-actions">
                                    <Link href="/dashboard" className="btn btn-primary">
                                        Back to Store
                                    </Link>
                                    <Link href="/orders" className="btn btn-secondary">
                                        View Orders
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2>Confirm Purchase</h2>
                                <div className="purchase-summary">
                                    <div className="summary-row">
                                        <span>Product</span>
                                        <span>{product.name}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Quantity</span>
                                        <span>{quantity}</span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>Total</span>
                                        <span>{formatCredits(totalPrice)} credits</span>
                                    </div>
                                    <div className="summary-row after">
                                        <span>Balance after</span>
                                        <span>{formatCredits(userBalance - totalPrice)} credits</span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="alert alert-error">{error}</div>
                                )}

                                <div className="modal-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowPurchaseModal(false)}
                                        disabled={purchasing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handlePurchase}
                                        disabled={purchasing}
                                    >
                                        {purchasing ? 'Processing...' : 'Confirm Purchase'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
        .product-page-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-page {
          min-height: 100vh;
          padding: 24px;
        }

        .page-header {
          max-width: 1000px;
          margin: 0 auto 32px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--color-text-primary);
        }

        .product-container {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
        }

        @media (max-width: 768px) {
          .product-container {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }

        .product-image-wrapper {
          position: relative;
          background: var(--color-bg-card);
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 1;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
        }

        .out-of-stock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #EF4444;
          font-size: 24px;
          font-weight: 700;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .product-title {
          font-size: 32px;
          font-weight: 700;
          line-height: 1.2;
        }

        .product-price {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .price-amount {
          font-size: 36px;
          font-weight: 700;
          background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .price-label {
          font-size: 16px;
          color: var(--color-text-secondary);
        }

        .product-description {
          font-size: 16px;
          line-height: 1.7;
          color: var(--color-text-secondary);
        }

        .stock-info {
          margin-top: 8px;
        }

        .stock-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .stock-badge.in-stock {
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
        }

        .stock-badge.out-of-stock {
          background: rgba(239, 68, 68, 0.2);
          color: #EF4444;
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .quantity-selector label {
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--color-bg-secondary);
          border-radius: 12px;
          padding: 4px;
        }

        .qty-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: var(--color-bg-hover);
          color: white;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .qty-btn:hover:not(:disabled) {
          background: var(--color-accent-primary);
        }

        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qty-value {
          min-width: 32px;
          text-align: center;
          font-size: 16px;
          font-weight: 600;
        }

        .total-price {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          background: var(--color-bg-secondary);
          border-radius: 12px;
          font-size: 16px;
        }

        .total-amount {
          font-weight: 700;
          color: var(--color-accent-primary);
        }

        .balance-info {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
        }

        .balance-info.sufficient {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .balance-info.insufficient {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .balance-amount {
          font-weight: 600;
        }

        .balance-warning {
          color: #EF4444;
        }

        .product-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .btn-large {
          flex: 1;
          padding: 16px 32px;
          font-size: 16px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-card {
          background: linear-gradient(135deg, #1e1e32 0%, #141e3c 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 32px;
          width: 100%;
          max-width: 420px;
          text-align: center;
        }

        .modal-card h2 {
          font-size: 24px;
          margin-bottom: 24px;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: white;
        }

        .purchase-summary {
          background: var(--color-bg-secondary);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          border-bottom: 1px solid var(--color-border);
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-row.total {
          font-weight: 700;
          font-size: 16px;
          color: var(--color-accent-primary);
        }

        .summary-row.after {
          color: var(--color-success);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-actions .btn {
          flex: 1;
        }
      `}</style>
        </main>
    );
}
