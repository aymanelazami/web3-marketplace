'use client';

import { useAuth } from '@/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

interface Product {
  id: string;
  name: string;
  description: string;
  priceCredits: string;
  imageUrl: string | null;
  stock: number | null;
}

interface Order {
  id: string;
  product: { name: string };
  totalCredits: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  if (isLoading || !user) {
    return (
      <main className="dashboard-loading">
        <div className="spinner" />
      </main>
    );
  }

  const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const formatCredits = (credits: string) => {
    const num = parseFloat(credits);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success';
      case 'PENDING':
      case 'PROCESSING':
        return 'badge-warning';
      case 'REFUNDED':
      case 'CANCELLED':
        return 'badge-error';
      default:
        return 'badge-info';
    }
  };

  return (
    <main className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
              <path d="M10 16L16 10L22 16L16 22L10 16Z" fill="white" fillOpacity="0.9" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
            <span>Web3 Store</span>
          </div>
        </div>
        <div className="header-right">
          {user.isAdmin && (
            <Link href="/admin" className="btn btn-ghost">
              Admin Panel
            </Link>
          )}
          <div className="user-badge">
            <span className="status-dot status-dot-success" />
            {truncateAddress(user.walletAddress)}
          </div>
          <button className="btn btn-ghost" onClick={logout}>
            Disconnect
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Balance Card */}
        <section className="balance-section">
          <div className="card-glass balance-card">
            <div className="balance-info">
              <span className="balance-label">Available Credits</span>
              <span className="balance-amount">{formatCredits(user.creditBalance)}</span>
              <span className="balance-usd">≈ ${formatCredits(user.creditBalance)} USDT</span>
            </div>
            <div className="balance-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowDepositModal(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Deposit USDT
              </button>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="products-section">
          <div className="section-header">
            <h2>Available Products</h2>
            <span className="section-count">{products.length} items</span>
          </div>
          <div className="products-grid">
            {products.length === 0 ? (
              <div className="empty-state">
                <p>No products available yet</p>
              </div>
            ) : (
              products.map((product) => {
                const canAfford = parseFloat(user.creditBalance) >= parseFloat(product.priceCredits);
                return (
                  <div key={product.id} className="card product-card">
                    <div className="product-image">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div className="product-image-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                            <path d="M21 15L16 10L4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                      {!canAfford && (
                        <div className="product-overlay">
                          <span>Insufficient credits</span>
                        </div>
                      )}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <div className="product-footer">
                        <span className="product-price">{formatCredits(product.priceCredits)} credits</span>
                        <Link
                          href={`/products/${product.id}`}
                          className={`btn btn-secondary ${!canAfford ? 'disabled' : ''}`}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="orders-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link href="/orders" className="btn btn-ghost">View All</Link>
          </div>
          {orders.length === 0 ? (
            <div className="card empty-state">
              <p>No orders yet. Start shopping!</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="card order-row">
                  <div className="order-product">{order.product.name}</div>
                  <div className="order-amount">{formatCredits(order.totalCredits)} credits</div>
                  <div className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</div>
                  <div className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} onSuccess={refreshUser} />
      )}

      <style jsx>{`
        .dashboard-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dashboard {
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          border-bottom: 1px solid var(--glass-border);
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 18px;
        }

        .logo svg {
          width: 32px;
          height: 32px;
        }

        .user-badge {
          display: flex;
          align-items: center;
          padding: 8px 14px;
          background: var(--color-bg-hover);
          border-radius: 8px;
          font-size: 14px;
          font-family: monospace;
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px;
        }

        .balance-section {
          margin-bottom: 40px;
          display: flex;
          justify-content: center;
        }

        .balance-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px;
          width: 100%;
          max-width: 500px;
        }

        .balance-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .balance-label {
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .balance-amount {
          font-size: 42px;
          font-weight: 700;
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .balance-usd {
          font-size: 14px;
          color: var(--color-text-muted);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 20px;
          font-weight: 600;
        }

        .section-count {
          font-size: 14px;
          color: var(--color-text-muted);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .product-card {
          padding: 0;
          overflow: hidden;
        }

        .product-image {
          height: 180px;
          background: var(--color-bg-secondary);
          position: relative;
        }

        .product-image img {
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
        }

        .product-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          font-size: 14px;
        }

        .product-info {
          padding: 20px;
        }

        .product-info h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .product-info p {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .product-price {
          font-weight: 600;
          color: var(--color-accent-primary);
        }

        .orders-section {
          margin-top: 40px;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-row {
          display: grid;
          grid-template-columns: 2fr 1fr 100px 100px;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
        }

        .order-product {
          font-weight: 500;
        }

        .order-amount {
          color: var(--color-text-secondary);
        }

        .order-date {
          font-size: 14px;
          color: var(--color-text-muted);
          text-align: right;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--color-text-muted);
        }

        .disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 12px 16px;
          }

          .dashboard-content {
            padding: 20px;
          }

          .balance-card {
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }

          .order-row {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  );
}

// Deposit Modal Component
function DepositModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'history'>('input');
  const [loading, setLoading] = useState(false);
  const [intentData, setIntentData] = useState<{ intentId: string; depositAddress: string; amount: string; expiresAt: string } | null>(null);
  const [deposits, setDeposits] = useState<{ id: string; expectedAmount: string; status: string; createdAt: string }[]>([]);
  const [error, setError] = useState('');
  const depositAddress = process.env.NEXT_PUBLIC_DEPOSIT_ADDRESS || '0x...';

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const res = await fetch('/api/deposits/intent');
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } catch (err) {
      console.error('Failed to fetch deposits:', err);
    }
  };

  const handleCreateIntent = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/deposits/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });
      if (res.ok) {
        const data = await res.json();
        setIntentData(data);
        setStep('confirm');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create deposit');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  const renderHeader = (title: string) => (
    <div className="modal-header">
      <h2>{title}</h2>
      <button className="btn btn-ghost modal-close" onClick={onClose}>✕</button>
    </div>
  );

  const renderTabs = () => (
    <div className="modal-tabs">
      <button
        className={`modal-tab ${step === 'input' ? 'active' : ''}`}
        onClick={() => setStep('input')}
      >
        New Deposit
      </button>
      <button
        className={`modal-tab ${step === 'history' ? 'active' : ''}`}
        onClick={() => setStep('history')}
      >
        History {deposits.length > 0 && <span className="tab-badge">{deposits.length}</span>}
      </button>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card-glass modal" onClick={(e) => e.stopPropagation()}>
        {step === 'input' && (
          <>
            {renderHeader('💰 Deposit USDT')}
            {renderTabs()}
            <div className="modal-body">
              <div className="form-group">
                <label>Amount to Deposit</label>
                <div className="amount-input-wrapper">
                  <span className="currency-prefix">$</span>
                  <input
                    type="number"
                    className="input amount-input"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                  <span className="currency-suffix">USDT</span>
                </div>
              </div>

              <div className="quick-amounts">
                {[10, 50, 100, 500].map((a) => (
                  <button key={a} className="btn-quick" onClick={() => setAmount(a.toString())}>
                    ${a}
                  </button>
                ))}
              </div>

              {error && <div className="alert alert-error">⚠️ {error}</div>}

              <button
                className="btn btn-primary btn-lg"
                onClick={handleCreateIntent}
                disabled={loading || !amount}
              >
                {loading ? 'Generating Intent...' : 'Create Deposit Intent →'}
              </button>

              <p className="modal-footer-note">
                Deposits are processed on the Ethereum network. <br />
                Typical confirmation time: ~3-5 minutes.
              </p>
            </div>
          </>
        )}

        {step === 'history' && (
          <>
            {renderHeader('📜 Deposit History')}
            {renderTabs()}
            <div className="modal-body">
              <div className="history-list">
                {deposits.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <p>No deposits recorded yet</p>
                  </div>
                ) : (
                  deposits.map((d) => (
                    <div key={d.id} className="history-item">
                      <div className="item-info">
                        <span className="item-amount">${d.expectedAmount} USDT</span>
                        <span className="item-date">{formatDate(d.createdAt)}</span>
                      </div>
                      <div className={`status-badge status-${d.status.toLowerCase()}`}>
                        {d.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            {renderHeader('✅ Confirm Deposit')}
            <div className="modal-body">
              <div className="alert alert-warning">
                <strong>⚠️ CAUTION:</strong>
                <ul>
                  <li>Send ONLY USDT via the <strong>Ethereum (ERC-20)</strong> network.</li>
                  <li>Sending any other token or using another network will result in <strong>PERMANENT LOSS</strong>.</li>
                </ul>
              </div>

              <div className="deposit-details-card">
                <div className="qr-container">
                  <div className="qr-box">
                    <QRCodeSVG value={depositAddress} size={160} level="H" />
                  </div>
                  <p className="qr-hint">Scan to pay with your mobile wallet</p>
                </div>

                <div className="address-section">
                  <label>Deposit Address</label>
                  <div className="address-copy-box">
                    <code>{depositAddress}</code>
                    <button
                      className="btn-copy"
                      onClick={() => navigator.clipboard.writeText(depositAddress)}
                      title="Copy Address"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="deposit-summary">
                  <div className="summary-row">
                    <span>Amount Due</span>
                    <strong>{amount} USDT</strong>
                  </div>
                  <div className="summary-row">
                    <span>Network</span>
                    <span className="badge-info">Ethereum (ERC-20)</span>
                  </div>
                </div>
              </div>

              <button className="btn btn-secondary btn-lg" onClick={onClose}>
                I have sent the payment
              </button>

              <p className="completion-note">
                Your credits will be added automatically once 12 network confirmations are reached.
              </p>
            </div>
          </>
        )}

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 24px;
          }

          .modal {
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: modalFadeIn 0.3s ease-out;
          }

          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 24px 16px;
          }

          .modal-header h2 {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(135deg, #fff 0%, #a5a5a5 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .modal-close {
            padding: 8px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
          }

          .modal-tabs {
            display: flex;
            gap: 4px;
            padding: 0 24px;
            margin-bottom: 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .modal-tab {
            padding: 12px 16px;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            position: relative;
            transition: all 0.2s;
          }

          .modal-tab.active {
            color: #8B5CF6;
          }

          .modal-tab.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: #8B5CF6;
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
          }

          .tab-badge {
            background: rgba(139, 92, 246, 0.2);
            color: #8B5CF6;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 11px;
            margin-left: 4px;
          }

          .modal-body {
            padding: 0 24px 24px;
          }

          .form-group {
            margin-bottom: 24px;
          }

          .form-group label {
            display: block;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 12px;
          }

          .amount-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0 16px;
            transition: border-color 0.2s;
          }

          .amount-input-wrapper:focus-within {
            border-color: #8B5CF6;
          }

          .currency-prefix {
            font-size: 20px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.4);
            margin-right: 8px;
          }

          .currency-suffix {
            font-size: 14px;
            font-weight: 700;
            color: #8B5CF6;
            margin-left: 8px;
          }

          .amount-input {
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            flex: 1;
            padding: 16px 0;
            font-size: 24px;
            font-weight: 700;
            color: white;
            width: 100%;
          }

          .quick-amounts {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .btn-quick {
            padding: 10px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-quick:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }

          .btn-lg {
            width: 100%;
            padding: 16px;
            font-size: 16px;
            font-weight: 700;
            border-radius: 12px;
          }

          .alert {
            padding: 16px;
            border-radius: 12px;
            font-size: 13px;
            margin-bottom: 24px;
            line-height: 1.5;
          }

          .alert-error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #EF4444;
          }

          .alert-warning {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.2);
            color: #F59E0B;
          }

          .alert ul {
            margin: 8px 0 0 20px;
            padding: 0;
          }

          .history-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 400px;
            overflow-y: auto;
          }

          .history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
          }

          .item-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .item-amount {
            font-size: 16px;
            font-weight: 700;
            color: white;
          }

          .item-date {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
          }

          .empty-state {
            text-align: center;
            padding: 48px 24px;
            color: rgba(255, 255, 255, 0.4);
          }

          .empty-icon {
            font-size: 40px;
            margin-bottom: 16px;
            opacity: 0.3;
          }

          .deposit-details-card {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
          }

          .qr-container {
            text-align: center;
            margin-bottom: 24px;
          }

          .qr-box {
            background: white;
            padding: 16px;
            border-radius: 16px;
            display: inline-block;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }

          .qr-hint {
            margin-top: 12px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
          }

          .address-section {
            margin-bottom: 20px;
          }

          .address-section label {
            display: block;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 8px;
          }

          .address-copy-box {
            display: flex;
            gap: 12px;
            background: rgba(255, 255, 255, 0.05);
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .address-copy-box code {
            flex: 1;
            font-size: 13px;
            font-family: monospace;
            word-break: break-all;
            color: #8B5CF6;
          }

          .btn-copy {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            filter: grayscale(1);
            transition: filter 0.2s;
          }

          .btn-copy:hover {
            filter: grayscale(0);
          }

          .deposit-summary {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 16px;
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
          }

          .summary-row span {
            color: rgba(255, 255, 255, 0.5);
          }

          .modal-footer-note, .completion-note {
            margin-top: 20px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
            text-align: center;
            line-height: 1.6;
          }
        `}</style>
      </div>
    </div>
  );
}
