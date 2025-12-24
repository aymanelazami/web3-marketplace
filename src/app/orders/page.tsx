'use client';

import { useAuth } from '@/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
    id: string;
    product: {
        id: string;
        name: string;
        imageUrl: string | null;
    };
    quantity: number;
    totalCredits: string;
    status: string;
    fulfillmentNote: string | null;
    createdAt: string;
}

export default function OrdersPage() {
    const { isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
        }
    }, [isAuthenticated]);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || loading) {
        return (
            <main className="orders-loading">
                <div className="spinner" />
            </main>
        );
    }

    const formatCredits = (credits: string) =>
        parseFloat(credits).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'pending';
            case 'PROCESSING': return 'processing';
            case 'COMPLETED': return 'completed';
            case 'REFUNDED': return 'refunded';
            case 'CANCELLED': return 'cancelled';
            default: return 'pending';
        }
    };

    return (
        <main className="orders-page">
            {/* Header */}
            <header className="page-header">
                <div className="header-left">
                    <Link href="/dashboard" className="back-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Store
                    </Link>
                    <h1>Your Orders</h1>
                </div>
            </header>

            {/* Orders List */}
            <div className="orders-container">
                {orders.length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <h2>No orders yet</h2>
                        <p>Start shopping to see your orders here</p>
                        <Link href="/dashboard" className="btn btn-primary">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <div key={order.id} className="order-card">
                                <div className="order-image">
                                    {order.product.imageUrl ? (
                                        <img src={order.product.imageUrl} alt={order.product.name} />
                                    ) : (
                                        <div className="image-placeholder">📦</div>
                                    )}
                                </div>
                                <div className="order-details">
                                    <div className="order-header">
                                        <Link href={`/products/${order.product.id}`} className="product-name">
                                            {order.product.name}
                                        </Link>
                                        <span className={`status-badge ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="order-meta">
                                        <span>Qty: {order.quantity}</span>
                                        <span>•</span>
                                        <span>{formatCredits(order.totalCredits)} credits</span>
                                        <span>•</span>
                                        <span>{formatDate(order.createdAt)}</span>
                                    </div>
                                    {order.fulfillmentNote && (
                                        <div className="fulfillment-note">
                                            <strong>Note:</strong> {order.fulfillmentNote}
                                        </div>
                                    )}
                                </div>
                                <div className="order-id">
                                    <span className="id-label">Order ID</span>
                                    <span className="id-value">{order.id.slice(0, 8)}...</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
        .orders-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orders-page {
          min-height: 100vh;
          padding: 24px;
        }

        .page-header {
          max-width: 900px;
          margin: 0 auto 32px;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 16px;
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

        .page-header h1 {
          font-size: 28px;
          font-weight: 700;
        }

        .orders-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .empty-state {
          text-align: center;
          padding: 80px 24px;
          background: var(--glass-bg);
          border: 1px solid var(--color-border);
          border-radius: 20px;
        }

        .empty-state svg {
          color: var(--color-text-muted);
          margin-bottom: 24px;
        }

        .empty-state h2 {
          font-size: 20px;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: var(--color-text-secondary);
          margin-bottom: 24px;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .order-card {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.6) 0%, rgba(20, 30, 60, 0.6) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          transition: border-color 0.2s;
        }

        .order-card:hover {
          border-color: rgba(139, 92, 246, 0.3);
        }

        .order-image {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          background: var(--color-bg-secondary);
        }

        .order-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }

        .order-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: white;
          text-decoration: none;
        }

        .product-name:hover {
          color: var(--color-accent-primary);
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.pending { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
        .status-badge.processing { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }
        .status-badge.completed { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .status-badge.refunded { background: rgba(168, 85, 247, 0.2); color: #A855F7; }
        .status-badge.cancelled { background: rgba(239, 68, 68, 0.2); color: #EF4444; }

        .order-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .fulfillment-note {
          margin-top: 8px;
          padding: 10px 12px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .fulfillment-note strong {
          color: #10B981;
        }

        .order-id {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .id-label {
          font-size: 11px;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }

        .id-value {
          font-family: monospace;
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        @media (max-width: 640px) {
          .order-card {
            flex-direction: column;
          }

          .order-image {
            width: 100%;
            height: 120px;
          }

          .order-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .order-id {
            text-align: left;
            flex-direction: row;
            gap: 8px;
          }
        }
      `}</style>
        </main>
    );
}
