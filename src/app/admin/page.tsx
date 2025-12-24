'use client';

import { useAuth } from '@/providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import for charts (client-side only)
const AnalyticsView = dynamic(() => import('@/components/AnalyticsView'), { ssr: false });

// Types
interface Stats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    usersToday: number;
    ordersToday: number;
    ordersThisWeek: number;
    totalCreditsInSystem: string;
    totalDeposits: string;
    totalPurchases: string;
}

interface User {
    id: string;
    walletAddress: string;
    creditBalance: string;
    isAdmin: boolean;
    ordersCount: number;
    createdAt: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    priceCredits: string;
    imageUrl: string | null;
    stock: number | null;
    isActive: boolean;
}

interface Order {
    id: string;
    user: { walletAddress: string };
    product: { name: string };
    totalCredits: string;
    status: string;
    createdAt: string;
}

interface LedgerTransaction {
    id: string;
    user: { walletAddress: string };
    type: string;
    amount: string;
    balanceAfter: string;
    referenceType: string | null;
    createdAt: string;
}

type Tab = 'dashboard' | 'analytics' | 'users' | 'products' | 'orders' | 'wallet' | 'deposits' | 'coupons' | 'affiliates' | 'sellers' | 'vip-tiers' | 'settings';

export default function AdminPage() {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, user, router]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    }, []);

    const fetchLedger = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/ledger');
            if (res.ok) {
                const data = await res.json();
                setLedger(data.transactions);
            }
        } catch (error) {
            console.error('Failed to fetch ledger:', error);
        }
    }, []);

    useEffect(() => {
        if (user?.isAdmin) {
            fetchStats();
            fetchUsers();
            fetchProducts();
            fetchOrders();
            fetchLedger();
        }
    }, [user, fetchStats, fetchUsers, fetchProducts, fetchOrders, fetchLedger]);

    if (isLoading || !user?.isAdmin) {
        return (
            <main className="admin-loading">
                <div className="spinner" />
            </main>
        );
    }

    const truncateAddress = (address: string) =>
        `${address.slice(0, 6)}...${address.slice(-4)}`;

    const formatCredits = (credits: string) =>
        parseFloat(credits).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <Link href="/dashboard" className="sidebar-logo">
                        <svg viewBox="0 0 32 32" fill="none">
                            <rect width="32" height="32" rx="8" fill="url(#admin-logo)" />
                            <path d="M10 16L16 10L22 16L16 22L10 16Z" fill="white" fillOpacity="0.9" />
                            <defs>
                                <linearGradient id="admin-logo" x1="0" y1="0" x2="32" y2="32">
                                    <stop stopColor="#8B5CF6" />
                                    <stop offset="1" stopColor="#3B82F6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {sidebarOpen && <span>Admin Panel</span>}
                    </Link>
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavItem icon="📊" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!sidebarOpen} />
                    <NavItem icon="📈" label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} collapsed={!sidebarOpen} />
                    <NavItem icon="👥" label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} collapsed={!sidebarOpen} badge={users.length} />
                    <NavItem icon="📦" label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} collapsed={!sidebarOpen} badge={products.length} />
                    <NavItem icon="🛒" label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} collapsed={!sidebarOpen} badge={stats?.pendingOrders} />
                    <NavItem icon="💰" label="Wallet" active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} collapsed={!sidebarOpen} />
                    <NavItem icon="📥" label="Deposits" active={activeTab === 'deposits'} onClick={() => setActiveTab('deposits')} collapsed={!sidebarOpen} />
                    <div className="sidebar-divider" />
                    <NavItem icon="🎫" label="Coupons" active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} collapsed={!sidebarOpen} />
                    <NavItem icon="🔗" label="Affiliates" active={activeTab === 'affiliates'} onClick={() => setActiveTab('affiliates')} collapsed={!sidebarOpen} />
                    <NavItem icon="🏪" label="Sellers" active={activeTab === 'sellers'} onClick={() => setActiveTab('sellers')} collapsed={!sidebarOpen} />
                    <NavItem icon="🏆" label="VIP Tiers" active={activeTab === 'vip-tiers'} onClick={() => setActiveTab('vip-tiers')} collapsed={!sidebarOpen} />
                    <div className="sidebar-divider" />
                    <NavItem icon="⚙️" label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} collapsed={!sidebarOpen} />
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        {sidebarOpen && (
                            <>
                                <span className="user-badge-admin">Admin</span>
                                <span className="user-address">{truncateAddress(user.walletAddress)}</span>
                            </>
                        )}
                    </div>
                    <button className="btn-logout" onClick={logout} title="Disconnect">
                        🚪
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <h1>{getTabTitle(activeTab)}</h1>
                    <div className="header-actions">
                        {activeTab === 'products' && (
                            <button className="btn btn-primary" onClick={() => { }}>+ Add Product</button>
                        )}
                    </div>
                </header>

                <div className="admin-content">
                    {activeTab === 'dashboard' && (
                        <DashboardView stats={stats} users={users} orders={orders} formatCredits={formatCredits} truncateAddress={truncateAddress} formatDate={formatDate} />
                    )}
                    {activeTab === 'users' && (
                        <UsersView users={users} formatCredits={formatCredits} truncateAddress={truncateAddress} formatDate={formatDate} onRefresh={fetchUsers} />
                    )}
                    {activeTab === 'products' && (
                        <ProductsView products={products} formatCredits={formatCredits} onRefresh={fetchProducts} />
                    )}
                    {activeTab === 'orders' && (
                        <OrdersView orders={orders} formatCredits={formatCredits} truncateAddress={truncateAddress} formatDate={formatDate} />
                    )}
                    {activeTab === 'wallet' && (
                        <WalletView ledger={ledger} stats={stats} formatCredits={formatCredits} truncateAddress={truncateAddress} formatDate={formatDate} />
                    )}
                    {activeTab === 'deposits' && (
                        <DepositsView formatCredits={formatCredits} truncateAddress={truncateAddress} formatDate={formatDate} />
                    )}
                    {activeTab === 'analytics' && (
                        <AnalyticsView />
                    )}
                    {activeTab === 'coupons' && (
                        <CouponsView formatCredits={formatCredits} formatDate={formatDate} />
                    )}
                    {activeTab === 'affiliates' && (
                        <AffiliatesView formatCredits={formatCredits} truncateAddress={truncateAddress} />
                    )}
                    {activeTab === 'sellers' && (
                        <SellersView formatCredits={formatCredits} truncateAddress={truncateAddress} formatDate={formatDate} />
                    )}
                    {activeTab === 'vip-tiers' && (
                        <VipTiersView formatCredits={formatCredits} truncateAddress={truncateAddress} />
                    )}
                    {activeTab === 'settings' && (
                        <SettingsView />
                    )}
                </div>
            </main>

            <style jsx>{`
        .admin-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 260px;
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 100;
        }

        .sidebar.collapsed {
          width: 72px;
        }

        .sidebar-header {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 16px;
          color: white;
          text-decoration: none;
        }

        .sidebar-logo svg {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }

        .sidebar-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 12px 0;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }

        .user-badge-admin {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          color: #8B5CF6;
        }

        .user-address {
          font-size: 12px;
          font-family: monospace;
          color: rgba(255, 255, 255, 0.6);
        }

        .btn-logout {
          background: rgba(239, 68, 68, 0.2);
          border: none;
          color: #EF4444;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .admin-main {
          flex: 1;
          margin-left: 260px;
          transition: margin-left 0.3s ease;
        }

        .sidebar.collapsed + .admin-main {
          margin-left: 72px;
        }

        .admin-header {
          padding: 24px 32px;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .admin-header h1 {
          font-size: 24px;
          font-weight: 700;
        }

        .admin-content {
          padding: 32px;
        }

        @media (max-width: 1024px) {
          .sidebar {
            width: 72px;
          }

          .admin-main {
            margin-left: 72px;
          }
        }
      `}</style>
        </div>
    );
}

// Navigation Item
function NavItem({ icon, label, active, onClick, collapsed, badge }: {
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
    collapsed: boolean;
    badge?: number;
}) {
    return (
        <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
            <span className="nav-icon">{icon}</span>
            {!collapsed && <span className="nav-label">{label}</span>}
            {!collapsed && badge !== undefined && badge > 0 && (
                <span className="nav-badge">{badge}</span>
            )}
            <style jsx>{`
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .nav-item.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%);
          color: white;
        }

        .nav-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
        }

        .nav-badge {
          background: rgba(239, 68, 68, 0.8);
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
        }
      `}</style>
        </button>
    );
}

function getTabTitle(tab: Tab): string {
    const titles: Record<Tab, string> = {
        dashboard: 'Dashboard Overview',
        analytics: 'Analytics & Charts',
        users: 'User Management',
        products: 'Product Catalog',
        orders: 'Order Management',
        wallet: 'Internal Wallet & Ledger',
        deposits: 'Deposit Monitor',
        coupons: 'Coupon Management',
        affiliates: 'Affiliate Program',
        sellers: 'Seller Management',
        'vip-tiers': 'VIP Tiers & Rewards',
        settings: 'Settings',
    };
    return titles[tab];
}

// Dashboard View
function DashboardView({ stats, users, orders, formatCredits, truncateAddress, formatDate }: {
    stats: Stats | null;
    users: User[];
    orders: Order[];
    formatCredits: (n: string) => string;
    truncateAddress: (a: string) => string;
    formatDate: (d: string) => string;
}) {
    return (
        <div className="dashboard-view">
            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard label="Total Users" value={stats?.totalUsers || 0} icon="👥" trend={`+${stats?.usersToday || 0} today`} color="#8B5CF6" />
                <StatCard label="Total Orders" value={stats?.totalOrders || 0} icon="🛒" trend={`${stats?.ordersThisWeek || 0} this week`} color="#3B82F6" />
                <StatCard label="Active Products" value={stats?.totalProducts || 0} icon="📦" color="#10B981" />
                <StatCard label="Pending Orders" value={stats?.pendingOrders || 0} icon="⏳" color="#F59E0B" />
                <StatCard label="Credits in System" value={formatCredits(stats?.totalCreditsInSystem || '0')} icon="💰" color="#6366F1" isCredits />
                <StatCard label="Total Deposits" value={formatCredits(stats?.totalDeposits || '0')} icon="📥" color="#22C55E" isCredits />
            </div>

            {/* Recent Activity */}
            <div className="dashboard-grid">
                <div className="card-admin">
                    <h3>Recent Orders</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 5).map((order) => (
                                    <tr key={order.id}>
                                        <td className="mono">{truncateAddress(order.user.walletAddress)}</td>
                                        <td>{order.product.name}</td>
                                        <td>{formatCredits(order.totalCredits)}</td>
                                        <td><span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card-admin">
                    <h3>Recent Users</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Wallet</th>
                                    <th>Balance</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.slice(0, 5).map((u) => (
                                    <tr key={u.id}>
                                        <td className="mono">{truncateAddress(u.walletAddress)}</td>
                                        <td>{formatCredits(u.creditBalance)}</td>
                                        <td>{formatDate(u.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .dashboard-view {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .card-admin {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }

        .card-admin h3 {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 16px;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          text-align: left;
          padding: 12px 8px;
          font-size: 13px;
        }

        th {
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        td {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        tr:last-child td {
          border-bottom: none;
        }

        .mono {
          font-family: monospace;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-pending { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
        .status-processing { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }
        .status-completed { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .status-cancelled { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
      `}</style>
        </div>
    );
}

// Stat Card
function StatCard({ label, value, icon, trend, color, isCredits }: {
    label: string;
    value: number | string;
    icon: string;
    trend?: string;
    color: string;
    isCredits?: boolean;
}) {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: `${color}20`, color }}>{icon}</div>
            <div className="stat-content">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{isCredits ? `$${value}` : value}</span>
                {trend && <span className="stat-trend">{trend}</span>}
            </div>
            <style jsx>{`
        .stat-card {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .stat-trend {
          font-size: 11px;
          color: #10B981;
        }
      `}</style>
        </div>
    );
}

// Users View
function UsersView({ users, formatCredits, truncateAddress, formatDate, onRefresh }: {
    users: User[];
    formatCredits: (n: string) => string;
    truncateAddress: (a: string) => string;
    formatDate: (d: string) => string;
    onRefresh: () => void;
}) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [adjustment, setAdjustment] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAdjustBalance = async () => {
        if (!selectedUser || !adjustment) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creditAdjustment: adjustment, adjustmentReason: reason }),
            });
            if (res.ok) {
                onRefresh();
                setSelectedUser(null);
                setAdjustment('');
                setReason('');
            }
        } catch (error) {
            console.error('Failed to adjust balance:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAdmin = async (u: User) => {
        try {
            await fetch(`/api/admin/users/${u.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAdmin: !u.isAdmin }),
            });
            onRefresh();
        } catch (error) {
            console.error('Failed to toggle admin:', error);
        }
    };

    return (
        <div className="users-view">
            <div className="card-admin">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Wallet Address</th>
                                <th>Balance</th>
                                <th>Orders</th>
                                <th>Admin</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="mono">{u.walletAddress}</td>
                                    <td>${formatCredits(u.creditBalance)}</td>
                                    <td>{u.ordersCount}</td>
                                    <td>
                                        <button
                                            className={`toggle-btn ${u.isAdmin ? 'active' : ''}`}
                                            onClick={() => handleToggleAdmin(u)}
                                        >
                                            {u.isAdmin ? '✓ Admin' : 'User'}
                                        </button>
                                    </td>
                                    <td>{formatDate(u.createdAt)}</td>
                                    <td>
                                        <button className="btn-action" onClick={() => setSelectedUser(u)}>
                                            💰 Adjust
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Adjust Balance</h3>
                        <p className="mono">{selectedUser.walletAddress}</p>
                        <p>Current: ${formatCredits(selectedUser.creditBalance)}</p>
                        <div className="form-group">
                            <label>Amount (+/-)</label>
                            <input type="number" step="0.01" value={adjustment} onChange={(e) => setAdjustment(e.target.value)} placeholder="e.g. 100 or -50" className="input" />
                        </div>
                        <div className="form-group">
                            <label>Reason</label>
                            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Promotional credit" className="input" />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAdjustBalance} disabled={saving}>
                                {saving ? 'Saving...' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .users-view { margin: 0; }
        .card-admin {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }
        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 14px 12px; font-size: 13px; }
        th { color: rgba(255, 255, 255, 0.5); font-weight: 500; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        td { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .mono { font-family: monospace; font-size: 12px; }
        .toggle-btn {
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .toggle-btn.active {
          background: rgba(139, 92, 246, 0.3);
          border-color: #8B5CF6;
          color: #8B5CF6;
        }
        .btn-action {
          padding: 6px 12px;
          border-radius: 6px;
          background: rgba(59, 130, 246, 0.2);
          border: none;
          color: #3B82F6;
          font-size: 12px;
          cursor: pointer;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-card {
          background: linear-gradient(135deg, #1e1e32 0%, #141e3c 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 28px;
          width: 100%;
          max-width: 400px;
        }
        .modal-card h3 { margin-bottom: 12px; }
        .modal-card p { margin-bottom: 8px; font-size: 13px; color: rgba(255, 255, 255, 0.7); }
        .form-group { margin: 16px 0; }
        .form-group label { display: block; font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 6px; }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
      `}</style>
        </div>
    );
}

// Products View
function ProductsView({ products, formatCredits, onRefresh }: {
    products: Product[];
    formatCredits: (n: string) => string;
    onRefresh: () => void;
}) {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this product?')) return;
        try {
            await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            onRefresh();
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    };

    return (
        <div className="products-view">
            <div className="products-header">
                <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
                    + Add Product
                </button>
            </div>

            <div className="products-grid">
                {products.map((product) => (
                    <div key={product.id} className={`product-card ${!product.isActive ? 'inactive' : ''}`}>
                        <div className="product-image">
                            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>📦</span>}
                            {!product.isActive && <div className="inactive-overlay">Inactive</div>}
                        </div>
                        <div className="product-info">
                            <h4>{product.name}</h4>
                            <p>{product.description}</p>
                            <div className="product-meta">
                                <span className="price">${formatCredits(product.priceCredits)}</span>
                                <span className="stock">{product.stock !== null ? `${product.stock} in stock` : 'Unlimited'}</span>
                            </div>
                            <div className="product-actions">
                                <button className="btn-sm" onClick={() => { setEditingProduct(product); setShowModal(true); }}>Edit</button>
                                {product.isActive && <button className="btn-sm btn-danger" onClick={() => handleDelete(product.id)}>Deactivate</button>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <ProductModal
                    product={editingProduct}
                    onClose={() => setShowModal(false)}
                    onSave={() => { onRefresh(); setShowModal(false); }}
                />
            )}

            <style jsx>{`
        .products-view { display: flex; flex-direction: column; gap: 24px; }
        .products-header { display: flex; justify-content: flex-end; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .product-card {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
        }
        .product-card.inactive { opacity: 0.5; }
        .product-image {
          height: 140px;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          position: relative;
        }
        .product-image img { width: 100%; height: 100%; object-fit: cover; }
        .inactive-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #EF4444;
          font-weight: 600;
        }
        .product-info { padding: 16px; }
        .product-info h4 { font-size: 16px; margin-bottom: 8px; }
        .product-info p { font-size: 13px; color: rgba(255, 255, 255, 0.6); line-height: 1.5; margin-bottom: 12px; }
        .product-meta { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .price { font-weight: 600; color: #8B5CF6; }
        .stock { font-size: 12px; color: rgba(255, 255, 255, 0.5); }
        .product-actions { display: flex; gap: 8px; }
        .btn-sm { padding: 6px 12px; border-radius: 6px; background: rgba(255, 255, 255, 0.1); border: none; color: white; font-size: 12px; cursor: pointer; }
        .btn-sm:hover { background: rgba(255, 255, 255, 0.15); }
        .btn-danger { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
      `}</style>
        </div>
    );
}

// Product Modal
function ProductModal({ product, onClose, onSave }: { product: Product | null; onClose: () => void; onSave: () => void }) {
    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [priceCredits, setPriceCredits] = useState(product?.priceCredits || '');
    const [stock, setStock] = useState(product?.stock?.toString() || '');
    const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
    const [isActive, setIsActive] = useState(product?.isActive ?? true);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products';
            const method = product ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, priceCredits, stock: stock || null, imageUrl: imageUrl || null, isActive }),
            });
            if (res.ok) onSave();
        } catch (error) {
            console.error('Failed to save product:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <h3>{product ? 'Edit Product' : 'Add Product'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Price (Credits)</label>
                            <input className="input" type="number" step="0.01" value={priceCredits} onChange={(e) => setPriceCredits(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Stock</label>
                            <input className="input" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Unlimited" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Image URL</label>
                        <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    {product && (
                        <label className="checkbox-label">
                            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                            Product is active
                        </label>
                    )}
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
                <style jsx>{`
          .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
          .modal-card { background: linear-gradient(135deg, #1e1e32 0%, #141e3c 100%); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 28px; width: 100%; max-width: 500px; }
          .modal-card h3 { margin-bottom: 20px; }
          .form-group { margin-bottom: 16px; }
          .form-group label { display: block; font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 6px; }
          .form-group textarea { resize: vertical; }
          .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-top: 12px; cursor: pointer; }
          .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
        `}</style>
            </div>
        </div>
    );
}

// Orders View
function OrdersView({ orders, formatCredits, truncateAddress, formatDate }: {
    orders: Order[];
    formatCredits: (n: string) => string;
    truncateAddress: (a: string) => string;
    formatDate: (d: string) => string;
}) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    return (
        <div className="orders-view">
            <div className="card-admin">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td className="mono">{order.id.slice(0, 8)}...</td>
                                    <td className="mono">{truncateAddress(order.user.walletAddress)}</td>
                                    <td>{order.product.name}</td>
                                    <td>${formatCredits(order.totalCredits)}</td>
                                    <td><span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                                    <td>{formatDate(order.createdAt)}</td>
                                    <td>
                                        <button className="btn-action" onClick={() => setSelectedOrder(order)}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Order Details</h3>
                        <div className="order-details">
                            <div className="detail-item">
                                <label>Order ID</label>
                                <div className="value mono">{selectedOrder.id}</div>
                            </div>
                            <div className="detail-item">
                                <label>Customer Wallet</label>
                                <div className="value mono">{selectedOrder.user.walletAddress}</div>
                            </div>
                            <div className="detail-item">
                                <label>Product</label>
                                <div className="value">{selectedOrder.product.name}</div>
                            </div>
                            <div className="detail-item">
                                <label>Total Amount</label>
                                <div className="value">${formatCredits(selectedOrder.totalCredits)}</div>
                            </div>
                            <div className="detail-item">
                                <label>Status</label>
                                <div className="value">
                                    <span className={`status-badge status-${selectedOrder.status.toLowerCase()}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-item">
                                <label>Date</label>
                                <div className="value">{formatDate(selectedOrder.createdAt)}</div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .card-admin {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }
        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 14px 12px; font-size: 13px; }
        th { color: rgba(255, 255, 255, 0.5); font-weight: 500; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        td { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .mono { font-family: monospace; font-size: 12px; }
        .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .status-pending { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
        .status-processing { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }
        .status-completed { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .status-cancelled { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
        .btn-action { padding: 6px 12px; border-radius: 6px; background: rgba(59, 130, 246, 0.2); border: none; color: #3B82F6; font-size: 12px; cursor: pointer; }
        
        .order-details { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        .detail-item label { font-size: 12px; color: rgba(255, 255, 255, 0.5); display: block; margin-bottom: 4px; }
        .detail-item .value { font-size: 14px; color: white; }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-card {
          background: linear-gradient(135deg, #1e1e32 0%, #141e3c 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 28px;
          width: 100%;
          max-width: 500px;
        }
        .modal-card h3 { margin-bottom: 20px; }
      `}</style>
        </div>
    );
}

// Wallet View
function WalletView({ ledger, stats, formatCredits, truncateAddress, formatDate }: {
    ledger: LedgerTransaction[];
    stats: Stats | null;
    formatCredits: (n: string) => string;
    truncateAddress: (a: string) => string;
    formatDate: (d: string) => string;
}) {
    return (
        <div className="wallet-view">
            {/* Wallet Summary */}
            <div className="wallet-summary">
                <div className="summary-card">
                    <span className="label">Total Credits in System</span>
                    <span className="value">${formatCredits(stats?.totalCreditsInSystem || '0')}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Total Deposits</span>
                    <span className="value deposits">+${formatCredits(stats?.totalDeposits || '0')}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Total Purchases</span>
                    <span className="value purchases">-${formatCredits(stats?.totalPurchases || '0')}</span>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="card-admin">
                <h3>Transaction Ledger</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Balance After</th>
                                <th>Reference</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.map((tx) => (
                                <tr key={tx.id}>
                                    <td className="mono">{truncateAddress(tx.user.walletAddress)}</td>
                                    <td><span className={`type-badge type-${tx.type.toLowerCase()}`}>{tx.type}</span></td>
                                    <td className={parseFloat(tx.amount) >= 0 ? 'positive' : 'negative'}>
                                        {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatCredits(tx.amount)}
                                    </td>
                                    <td>${formatCredits(tx.balanceAfter)}</td>
                                    <td>{tx.referenceType || '-'}</td>
                                    <td>{formatDate(tx.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
        .wallet-view { display: flex; flex-direction: column; gap: 24px; }
        .wallet-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .summary-card {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
        }
        .summary-card .label { display: block; font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; }
        .summary-card .value { font-size: 28px; font-weight: 700; }
        .summary-card .deposits { color: #10B981; }
        .summary-card .purchases { color: #EF4444; }
        .card-admin {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }
        .card-admin h3 { font-size: 14px; font-weight: 600; text-transform: uppercase; color: rgba(255, 255, 255, 0.6); margin-bottom: 16px; }
        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 14px 12px; font-size: 13px; }
        th { color: rgba(255, 255, 255, 0.5); font-weight: 500; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        td { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .mono { font-family: monospace; font-size: 12px; }
        .type-badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .type-deposit { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .type-purchase { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
        .type-refund { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
        .type-adjustment { background: rgba(139, 92, 246, 0.2); color: #8B5CF6; }
        .positive { color: #10B981; }
        .negative { color: #EF4444; }
      `}</style>
        </div>
    );
}

// Settings View
function SettingsView() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading settings...</div>;
    }

    return (
        <div className="settings-view">
            {message && (
                <div className={`message ${message.type}`}>
                    {message.type === 'success' ? '✓' : '⚠'} {message.text}
                </div>
            )}

            <div className="card-admin">
                <h3>🏪 Store Configuration</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Store Name</label>
                        <input
                            className="input"
                            value={settings.storeName || ''}
                            onChange={(e) => handleChange('storeName', e.target.value)}
                        />
                    </div>
                    <div className="setting-item">
                        <label>Support Email</label>
                        <input
                            className="input"
                            type="email"
                            value={settings.supportEmail || ''}
                            onChange={(e) => handleChange('supportEmail', e.target.value)}
                        />
                    </div>
                    <div className="setting-item full">
                        <label>Store Description</label>
                        <textarea
                            className="input textarea"
                            value={settings.storeDescription || ''}
                            onChange={(e) => handleChange('storeDescription', e.target.value)}
                        />
                    </div>
                    <div className="setting-item full">
                        <label>Admin Wallet Address</label>
                        <input
                            className="input"
                            value={settings.adminWalletAddress || ''}
                            onChange={(e) => handleChange('adminWalletAddress', e.target.value)}
                            placeholder="0x..."
                        />
                    </div>
                </div>
            </div>

            <div className="card-admin" style={{ marginTop: '24px' }}>
                <h3>💳 Payment Settings</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Confirmation Threshold (blocks)</label>
                        <input
                            className="input"
                            type="number"
                            value={settings.confirmationThreshold || '12'}
                            onChange={(e) => handleChange('confirmationThreshold', e.target.value)}
                        />
                    </div>
                    <div className="setting-item">
                        <label>Min Deposit Amount ($)</label>
                        <input
                            className="input"
                            type="number"
                            step="0.01"
                            value={settings.minDepositAmount || '1'}
                            onChange={(e) => handleChange('minDepositAmount', e.target.value)}
                        />
                    </div>
                    <div className="setting-item">
                        <label>Max Withdrawal Limit ($)</label>
                        <input
                            className="input"
                            type="number"
                            value={settings.maxWithdrawalLimit || '10000'}
                            onChange={(e) => handleChange('maxWithdrawalLimit', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card-admin" style={{ marginTop: '24px' }}>
                <h3>💰 Commission & Fees</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Seller Commission Rate (%)</label>
                        <input
                            className="input"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={(parseFloat(settings.sellerCommissionRate || '0.10') * 100).toFixed(0)}
                            onChange={(e) => handleChange('sellerCommissionRate', (parseFloat(e.target.value) / 100).toString())}
                        />
                        <span className="hint">Currently: {parseFloat(settings.sellerCommissionRate || '0.10') * 100}% to platform</span>
                    </div>
                </div>
            </div>

            <div className="card-admin" style={{ marginTop: '24px' }}>
                <h3>🔧 System</h3>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Maintenance Mode</label>
                        <select
                            className="input"
                            value={settings.maintenanceMode || 'false'}
                            onChange={(e) => handleChange('maintenanceMode', e.target.value)}
                        >
                            <option value="false">Disabled</option>
                            <option value="true">Enabled (Site Offline)</option>
                        </select>
                    </div>
                </div>
            </div>

            <button
                className="btn btn-primary save-btn"
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? 'Saving...' : '💾 Save All Settings'}
            </button>

            <style jsx>{`
        .settings-view { max-width: 800px; }
        .message { padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
        .message.success { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .message.error { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
        .card-admin {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }
        .card-admin h3 { font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.8); margin-bottom: 20px; }
        .settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .setting-item label { display: block; font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 6px; }
        .setting-item.full { grid-column: 1 / -1; }
        .textarea { min-height: 80px; resize: vertical; }
        .hint { display: block; font-size: 11px; color: rgba(255, 255, 255, 0.4); margin-top: 4px; }
        .save-btn { margin-top: 24px; width: 100%; padding: 16px; font-size: 16px; }
        .loading-spinner { text-align: center; padding: 60px; color: rgba(255, 255, 255, 0.6); }
      `}</style>
        </div>
    );
}

// Deposits View
function DepositsView({ formatCredits, truncateAddress, formatDate }: {
    formatCredits: (n: string) => string;
    truncateAddress: (a: string) => string;
    formatDate: (d: string) => string;
}) {
    const [deposits, setDeposits] = useState<{
        id: string;
        txHash: string;
        fromAddress: string;
        amount: string;
        blockNumber: string;
        confirmations: number;
        status: string;
        creditedAt: string | null;
        createdAt: string;
    }[]>([]);
    const [summary, setSummary] = useState<{
        pending: number;
        confirmed: number;
        credited: number;
        totalCredited: string;
    } | null>(null);
    const [scanning, setScanning] = useState(false);
    const [lastScan, setLastScan] = useState<{
        scannedBlocks: number;
        newDeposits: number;
        creditedDeposits: number;
    } | null>(null);

    const fetchDeposits = async () => {
        try {
            const res = await fetch('/api/admin/deposits');
            if (res.ok) {
                const data = await res.json();
                setDeposits(data.deposits);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Failed to fetch deposits:', error);
        }
    };

    const triggerScan = async () => {
        setScanning(true);
        try {
            const res = await fetch('/api/admin/deposits', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setLastScan({
                    scannedBlocks: data.scannedBlocks,
                    newDeposits: data.newDeposits,
                    creditedDeposits: data.creditedDeposits,
                });
                fetchDeposits(); // Refresh list
            }
        } catch (error) {
            console.error('Scan failed:', error);
        } finally {
            setScanning(false);
        }
    };

    useEffect(() => {
        fetchDeposits();
    }, []);

    return (
        <div className="deposits-view">
            {/* Summary Cards */}
            <div className="deposits-summary">
                <div className="summary-card">
                    <span className="label">Pending</span>
                    <span className="value pending">{summary?.pending || 0}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Confirmed</span>
                    <span className="value confirmed">{summary?.confirmed || 0}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Credited</span>
                    <span className="value credited">{summary?.credited || 0}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Total Credited</span>
                    <span className="value">${formatCredits(summary?.totalCredited || '0')}</span>
                </div>
            </div>

            {/* Scanner Controls */}
            <div className="scanner-card card-admin">
                <div className="scanner-header">
                    <div>
                        <h3>🔍 Deposit Scanner</h3>
                        <p>Scans Ethereum blockchain for USDT transfers to your deposit address</p>
                    </div>
                    <button className="btn btn-primary" onClick={triggerScan} disabled={scanning}>
                        {scanning ? '⏳ Scanning...' : '🔄 Run Scanner'}
                    </button>
                </div>
                {lastScan && (
                    <div className="scan-result">
                        ✓ Scanned {lastScan.scannedBlocks} blocks | Found {lastScan.newDeposits} new deposits | Credited {lastScan.creditedDeposits}
                    </div>
                )}
            </div>

            {/* Deposits Table */}
            <div className="card-admin">
                <h3>On-Chain Transactions</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>TX Hash</th>
                                <th>From</th>
                                <th>Amount</th>
                                <th>Confirmations</th>
                                <th>Status</th>
                                <th>Detected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deposits.map((d) => (
                                <tr key={d.id}>
                                    <td className="mono">
                                        <a href={`https://etherscan.io/tx/${d.txHash}`} target="_blank" rel="noopener noreferrer">
                                            {d.txHash.slice(0, 10)}...
                                        </a>
                                    </td>
                                    <td className="mono">{truncateAddress(d.fromAddress)}</td>
                                    <td>${formatCredits(d.amount)}</td>
                                    <td>
                                        <span className={d.confirmations >= 12 ? 'confirmed' : 'pending'}>
                                            {d.confirmations}/12
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${d.status.toLowerCase()}`}>{d.status}</span>
                                    </td>
                                    <td>{formatDate(d.createdAt)}</td>
                                </tr>
                            ))}
                            {deposits.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                                        No deposits detected yet. Run the scanner to check for new deposits.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
        .deposits-view { display: flex; flex-direction: column; gap: 24px; }
        .deposits-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .summary-card {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        .summary-card .label { display: block; font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; }
        .summary-card .value { font-size: 28px; font-weight: 700; }
        .summary-card .pending { color: #F59E0B; }
        .summary-card .confirmed { color: #3B82F6; }
        .summary-card .credited { color: #10B981; }
        .card-admin {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }
        .card-admin h3 { font-size: 14px; font-weight: 600; text-transform: uppercase; color: rgba(255, 255, 255, 0.6); margin-bottom: 16px; }
        .scanner-card { }
        .scanner-header { display: flex; justify-content: space-between; align-items: center; }
        .scanner-header p { font-size: 13px; color: rgba(255, 255, 255, 0.5); margin-top: 4px; }
        .scan-result { margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; font-size: 13px; color: #10B981; }
        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px 8px; font-size: 13px; }
        th { color: rgba(255, 255, 255, 0.5); font-weight: 500; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        td { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .mono { font-family: monospace; font-size: 12px; }
        .mono a { color: #8B5CF6; text-decoration: none; }
        .confirmed { color: #10B981; }
        .pending { color: #F59E0B; }
        .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .status-pending { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
        .status-confirming { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }
        .status-confirmed { background: rgba(99, 102, 241, 0.2); color: #6366F1; }
        .status-credited { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .status-reorged { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
      `}</style>
        </div>
    );
}

// Coupons View
function CouponsView({ formatCredits, formatDate }: {
    formatCredits: (n: string) => string;
    formatDate: (d: string) => string;
}) {
    const [coupons, setCoupons] = useState<{
        id: string;
        code: string;
        discountType: string;
        discountValue: string;
        usageLimit: number | null;
        usageCount: number;
        validFrom: string;
        validUntil: string;
        isActive: boolean;
    }[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '10',
        usageLimit: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });

    const fetchCoupons = async () => {
        try {
            const res = await fetch('/api/admin/coupons');
            if (res.ok) {
                const data = await res.json();
                setCoupons(data.coupons);
            }
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreate = async () => {
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCoupon),
            });
            if (res.ok) {
                fetchCoupons();
                setShowCreate(false);
                setNewCoupon({
                    code: '',
                    discountType: 'PERCENTAGE',
                    discountValue: '10',
                    usageLimit: '',
                    validFrom: new Date().toISOString().split('T')[0],
                    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                });
            }
        } catch (error) {
            console.error('Failed to create coupon:', error);
        }
    };

    return (
        <div className="coupons-view">
            <div className="view-header">
                <h2>🎫 Discount Coupons</h2>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    {showCreate ? 'Cancel' : '+ Create Coupon'}
                </button>
            </div>

            {showCreate && (
                <div className="card-admin create-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Code</label>
                            <input
                                type="text"
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                placeholder="SUMMER20"
                            />
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select value={newCoupon.discountType} onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}>
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED">Fixed Amount</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Value {newCoupon.discountType === 'PERCENTAGE' ? '(%)' : '($)'}</label>
                            <input
                                type="number"
                                value={newCoupon.discountValue}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Usage Limit (optional)</label>
                            <input
                                type="number"
                                value={newCoupon.usageLimit}
                                onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                                placeholder="Unlimited"
                            />
                        </div>
                        <div className="form-group">
                            <label>Valid From</label>
                            <input type="date" value={newCoupon.validFrom} onChange={(e) => setNewCoupon({ ...newCoupon, validFrom: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Valid Until</label>
                            <input type="date" value={newCoupon.validUntil} onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })} />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleCreate}>Create Coupon</button>
                </div>
            )}

            <div className="card-admin">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Usage</th>
                            <th>Valid Period</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map((c) => (
                            <tr key={c.id}>
                                <td><code className="coupon-code">{c.code}</code></td>
                                <td>{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${formatCredits(c.discountValue)}`}</td>
                                <td>{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                                <td>{formatDate(c.validFrom)} - {formatDate(c.validUntil)}</td>
                                <td>
                                    <span className={`status-badge ${c.isActive && new Date(c.validUntil) > new Date() ? 'status-credited' : 'status-pending'}`}>
                                        {c.isActive && new Date(c.validUntil) > new Date() ? 'Active' : 'Expired'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>No coupons yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
        .coupons-view { display: flex; flex-direction: column; gap: 24px; }
        .view-header { display: flex; justify-content: space-between; align-items: center; }
        .card-admin { background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px; }
        .create-form { margin-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
        .form-group label { display: block; font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 6px; }
        .form-group input, .form-group select { width: 100%; padding: 10px 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px 8px; font-size: 13px; }
        th { color: rgba(255, 255, 255, 0.5); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        td { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .coupon-code { background: rgba(139, 92, 246, 0.2); padding: 4px 8px; border-radius: 4px; font-weight: 600; }
      `}</style>
        </div>
    );
}

// Affiliates View
function AffiliatesView({ formatCredits, truncateAddress }: {
    formatCredits: (n: string) => string;
    truncateAddress: (a: string) => string;
}) {
    const [affiliates, setAffiliates] = useState<{
        id: string;
        code: string;
        userId: string;
        commissionRate: string;
        totalEarnings: string;
        totalReferrals: number;
        isActive: boolean;
    }[]>([]);

    const fetchAffiliates = async () => {
        try {
            const res = await fetch('/api/admin/affiliates');
            if (res.ok) {
                const data = await res.json();
                setAffiliates(data.affiliates || []);
            }
        } catch (error) {
            console.error('Failed to fetch affiliates:', error);
        }
    };

    useEffect(() => {
        fetchAffiliates();
    }, []);

    return (
        <div className="affiliates-view">
            <div className="view-header">
                <h2>🔗 Affiliate Program</h2>
            </div>

            <div className="summary-cards">
                <div className="summary-card">
                    <span className="label">Total Affiliates</span>
                    <span className="value">{affiliates.length}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Active Affiliates</span>
                    <span className="value">{affiliates.filter(a => a.isActive).length}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Total Paid Out</span>
                    <span className="value">${formatCredits(affiliates.reduce((sum, a) => sum + parseFloat(a.totalEarnings), 0).toString())}</span>
                </div>
            </div>

            <div className="card-admin">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>User</th>
                            <th>Commission</th>
                            <th>Referrals</th>
                            <th>Earnings</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {affiliates.map((a) => (
                            <tr key={a.id}>
                                <td><code className="affiliate-code">{a.code}</code></td>
                                <td className="mono">{truncateAddress(a.userId)}</td>
                                <td>{(parseFloat(a.commissionRate) * 100).toFixed(0)}%</td>
                                <td>{a.totalReferrals}</td>
                                <td>${formatCredits(a.totalEarnings)}</td>
                                <td>
                                    <span className={`status-badge ${a.isActive ? 'status-credited' : 'status-pending'}`}>
                                        {a.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {affiliates.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No affiliates yet. Users can create affiliate codes from their dashboard.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
        .affiliates-view { display: flex; flex-direction: column; gap: 24px; }
        .view-header { display: flex; justify-content: space-between; align-items: center; }
        .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .summary-card { background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; text-align: center; }
        .summary-card .label { display: block; font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; }
        .summary-card .value { font-size: 28px; font-weight: 700; color: #8B5CF6; }
        .card-admin { background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px 8px; font-size: 13px; }
        th { color: rgba(255, 255, 255, 0.5); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        td { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .mono { font-family: monospace; }
        .affiliate-code { background: rgba(59, 130, 246, 0.2); padding: 4px 8px; border-radius: 4px; font-weight: 600; }
      `}</style>
        </div>
    );
}

// Sellers View
function SellersView({ formatCredits, truncateAddress, formatDate }: {
    formatCredits: (n: string) => string;
    truncateAddress: (a: string) => string;
    formatDate: (d: string) => string;
}) {
    const [sellers, setSellers] = useState<{
        id: string;
        userId: string;
        storeName: string;
        storeDescription: string | null;
        email: string | null;
        website: string | null;
        status: string;
        totalSales: string;
        totalEarnings: string;
        applicationNote: string | null;
        rejectionReason: string | null;
        verifiedAt: string | null;
        createdAt: string;
    }[]>([]);
    const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchSellers = async () => {
        try {
            const res = await fetch('/api/admin/sellers');
            if (res.ok) {
                const data = await res.json();
                setSellers(data.sellers || []);
            }
        } catch (error) {
            console.error('Failed to fetch sellers:', error);
        }
    };

    useEffect(() => {
        fetchSellers();
    }, []);

    const handleAction = async (id: string, status: string, rejectionReason?: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/sellers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejectionReason }),
            });
            if (res.ok) {
                fetchSellers();
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const pendingSellers = sellers.filter(s => s.status === 'PENDING');
    const approvedSellers = sellers.filter(s => s.status === 'APPROVED');
    const rejectedSellers = sellers.filter(s => s.status === 'REJECTED');

    return (
        <div className="sellers-view">
            <div className="view-header">
                <h2>🏪 Seller Management</h2>
            </div>

            <div className="summary-cards">
                <div className="summary-card">
                    <span className="label">Pending Applications</span>
                    <span className="value pending-color">{pendingSellers.length}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Approved Sellers</span>
                    <span className="value success-color">{approvedSellers.length}</span>
                </div>
                <div className="summary-card">
                    <span className="label">Total Sales</span>
                    <span className="value">${formatCredits(sellers.reduce((sum, s) => sum + parseFloat(s.totalSales), 0).toString())}</span>
                </div>
            </div>

            {pendingSellers.length > 0 && (
                <div className="section">
                    <h3>⏳ Pending Applications</h3>
                    <div className="card-admin">
                        <table>
                            <thead>
                                <tr>
                                    <th>Store Name</th>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Applied</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingSellers.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <strong>{s.storeName}</strong>
                                            {s.storeDescription && <div className="desc">{s.storeDescription.substring(0, 50)}...</div>}
                                        </td>
                                        <td className="mono">{truncateAddress(s.userId)}</td>
                                        <td>{s.email || '-'}</td>
                                        <td>{formatDate(s.createdAt)}</td>
                                        <td className="actions">
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleAction(s.id, 'APPROVED')}
                                                disabled={actionLoading === s.id}
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleAction(s.id, 'REJECTED', 'Application does not meet requirements')}
                                                disabled={actionLoading === s.id}
                                            >
                                                ✗ Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="section">
                <h3>✅ Approved Sellers</h3>
                <div className="card-admin">
                    <table>
                        <thead>
                            <tr>
                                <th>Store</th>
                                <th>User</th>
                                <th>Sales</th>
                                <th>Earnings</th>
                                <th>Verified</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedSellers.map((s) => (
                                <tr key={s.id}>
                                    <td><strong>{s.storeName}</strong></td>
                                    <td className="mono">{truncateAddress(s.userId)}</td>
                                    <td>${formatCredits(s.totalSales)}</td>
                                    <td>${formatCredits(s.totalEarnings)}</td>
                                    <td>{s.verifiedAt ? formatDate(s.verifiedAt) : '-'}</td>
                                    <td>
                                        <span className="status-badge status-credited">Active</span>
                                    </td>
                                </tr>
                            ))}
                            {approvedSellers.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No approved sellers yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
        .sellers-view { display: flex; flex-direction: column; gap: 24px; }
        .view-header { display: flex; justify-content: space-between; align-items: center; }
        .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .summary-card { background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; text-align: center; }
        .summary-card .label { display: block; font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; }
        .summary-card .value { font-size: 28px; font-weight: 700; color: #8B5CF6; }
        .pending-color { color: #F59E0B !important; }
        .success-color { color: #10B981 !important; }
        .section { margin-top: 16px; }
        .section h3 { margin-bottom: 16px; font-size: 16px; }
        .card-admin { background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px 8px; font-size: 13px; }
        th { color: rgba(255, 255, 255, 0.5); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        td { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .mono { font-family: monospace; }
        .desc { font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-top: 4px; }
        .actions { display: flex; gap: 8px; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .btn-success { background: #10B981; color: white; border: none; border-radius: 6px; cursor: pointer; }
        .btn-danger { background: #EF4444; color: white; border: none; border-radius: 6px; cursor: pointer; }
      `}</style>
        </div>
    );
}

// VIP Tiers View
function VipTiersView({ formatCredits, truncateAddress }: {
    formatCredits: (n: string) => string;
    truncateAddress: (a: string) => string;
}) {
    const [users, setUsers] = useState<{ id: string; walletAddress: string; vipTier: string; totalSpent: string; creditBalance: string }[]>([]);
    const [stats, setStats] = useState<{ bronze: number; silver: number; gold: number }>({ bronze: 0, silver: 0, gold: 0 });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                const userList = data.users || [];
                setUsers(userList);
                setStats({
                    bronze: userList.filter((u: { vipTier: string }) => (u.vipTier || 'BRONZE') === 'BRONZE').length,
                    silver: userList.filter((u: { vipTier: string }) => u.vipTier === 'SILVER').length,
                    gold: userList.filter((u: { vipTier: string }) => u.vipTier === 'GOLD').length,
                });
            }
        } catch (error) { console.error('Failed to fetch users:', error); }
    };

    const updateTier = async (userId: string, newTier: string) => {
        try {
            await fetch('/api/admin/users/' + userId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vipTier: newTier }),
            });
            fetchUsers();
        } catch (error) { console.error('Failed to update tier:', error); }
    };

    const tierColor = (tier: string) => {
        switch (tier) { case 'GOLD': return '#F59E0B'; case 'SILVER': return '#9CA3AF'; default: return '#CD7F32'; }
    };

    return (
        <div className="vip-view">
            <div className="view-header"><h2>🏆 VIP Tiers & Rewards</h2></div>

            <div className="tier-cards">
                <div className="tier-card bronze"><div className="tier-icon">🥉</div><div className="tier-name">Bronze</div><div className="tier-count">{stats.bronze} users</div><div className="tier-benefits">0% discount</div></div>
                <div className="tier-card silver"><div className="tier-icon">🥈</div><div className="tier-name">Silver</div><div className="tier-count">{stats.silver} users</div><div className="tier-benefits">5% discount</div></div>
                <div className="tier-card gold"><div className="tier-icon">🥇</div><div className="tier-name">Gold</div><div className="tier-count">{stats.gold} users</div><div className="tier-benefits">10% discount</div></div>
            </div>

            <div className="card-admin" style={{ marginTop: '24px' }}>
                <h3>Tier Thresholds</h3>
                <div className="thresholds">
                    <div className="threshold">🥉 Bronze: $0 - $99.99 spent</div>
                    <div className="threshold">🥈 Silver: $100 - $499.99 spent</div>
                    <div className="threshold">🥇 Gold: $500+ spent</div>
                </div>
            </div>

            <div className="card-admin" style={{ marginTop: '24px' }}>
                <h3>Users by Tier</h3>
                <table>
                    <thead><tr><th>User</th><th>Tier</th><th>Total Spent</th><th>Balance</th><th>Actions</th></tr></thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td className="mono">{truncateAddress(u.walletAddress)}</td>
                                <td><span style={{ color: tierColor(u.vipTier || 'BRONZE'), fontWeight: 600 }}>{u.vipTier || 'BRONZE'}</span></td>
                                <td>${formatCredits(u.totalSpent || '0')}</td>
                                <td>${formatCredits(u.creditBalance)}</td>
                                <td>
                                    <select className="input" style={{ padding: '4px 8px', fontSize: '12px' }} value={u.vipTier || 'BRONZE'} onChange={(e) => updateTier(u.id, e.target.value)}>
                                        <option value="BRONZE">Bronze</option><option value="SILVER">Silver</option><option value="GOLD">Gold</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
        .vip-view { display: flex; flex-direction: column; gap: 20px; }
        .view-header { display: flex; justify-content: space-between; align-items: center; }
        .tier-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .tier-card { background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px; text-align: center; }
        .tier-card.bronze { border-color: rgba(205, 127, 50, 0.4); }
        .tier-card.silver { border-color: rgba(156, 163, 175, 0.4); }
        .tier-card.gold { border-color: rgba(245, 158, 11, 0.4); }
        .tier-icon { font-size: 48px; margin-bottom: 12px; }
        .tier-name { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .tier-count { font-size: 24px; font-weight: 700; color: #8B5CF6; }
        .tier-benefits { font-size: 13px; color: rgba(255, 255, 255, 0.5); margin-top: 8px; }
        .card-admin { background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px; }
        .card-admin h3 { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: rgba(255, 255, 255, 0.8); }
        .thresholds { display: flex; flex-direction: column; gap: 12px; }
        .threshold { padding: 12px 16px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px 8px; font-size: 13px; }
        th { color: rgba(255, 255, 255, 0.5); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        td { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .mono { font-family: monospace; }
      `}</style>
        </div>
    );
}
