'use client';

import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface AnalyticsData {
    revenueChart: { date: string; value: number }[];
    usersChart: { date: string; value: number }[];
    depositsChart: { date: string; value: number }[];
    popularProducts: { name: string; orders: number; revenue: string }[];
    statusDistribution: { status: string; count: number }[];
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function AnalyticsView() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics');
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="analytics-loading">
                <div className="spinner" />
            </div>
        );
    }

    if (!data) {
        return <div className="analytics-error">Failed to load analytics</div>;
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const totalRevenue = data.revenueChart.reduce((sum, d) => sum + d.value, 0);
    const totalUsers = data.usersChart.reduce((sum, d) => sum + d.value, 0);
    const totalDeposits = data.depositsChart.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="analytics-view">
            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card revenue">
                    <span className="label">30-Day Revenue</span>
                    <span className="value">${totalRevenue.toLocaleString()}</span>
                </div>
                <div className="summary-card users">
                    <span className="label">New Users (30d)</span>
                    <span className="value">{totalUsers}</span>
                </div>
                <div className="summary-card deposits">
                    <span className="label">Total Deposits (30d)</span>
                    <span className="value">${totalDeposits.toLocaleString()}</span>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="chart-card">
                <h3>📈 Revenue Trend (30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" tickFormatter={formatDate} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                        <Tooltip
                            contentStyle={{ background: '#1e1e32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            labelStyle={{ color: 'white' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} dot={false} name="Revenue ($)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* User Growth and Deposits */}
            <div className="chart-row">
                <div className="chart-card half">
                    <h3>👥 User Signups</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.usersChart.slice(-14)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" tickFormatter={formatDate} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <Tooltip contentStyle={{ background: '#1e1e32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} name="New Users" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card half">
                    <h3>💰 Daily Deposits</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.depositsChart.slice(-14)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" tickFormatter={formatDate} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <Tooltip contentStyle={{ background: '#1e1e32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                            <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} name="Deposits ($)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Popular Products and Order Status */}
            <div className="chart-row">
                <div className="chart-card half">
                    <h3>🏆 Top Products</h3>
                    <div className="products-list">
                        {data.popularProducts.length === 0 ? (
                            <p className="no-data">No product data yet</p>
                        ) : (
                            data.popularProducts.map((product, index) => (
                                <div key={index} className="product-row">
                                    <span className="rank">#{index + 1}</span>
                                    <span className="name">{product.name}</span>
                                    <span className="orders">{product.orders} orders</span>
                                    <span className="revenue">${parseFloat(product.revenue).toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="chart-card half">
                    <h3>📊 Order Status</h3>
                    {data.statusDistribution.length === 0 ? (
                        <p className="no-data">No order data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={data.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="status"
                                >
                                    {data.statusDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1e1e32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <style jsx>{`
        .analytics-loading, .analytics-error {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: rgba(255, 255, 255, 0.6);
        }

        .analytics-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .summary-card {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
        }

        .summary-card .label {
          display: block;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .summary-card .value {
          font-size: 32px;
          font-weight: 700;
        }

        .summary-card.revenue .value { color: #8B5CF6; }
        .summary-card.users .value { color: #3B82F6; }
        .summary-card.deposits .value { color: #10B981; }

        .chart-card {
          background: linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 30, 60, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }

        .chart-card h3 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
          color: rgba(255, 255, 255, 0.9);
        }

        .chart-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .chart-card.half {
          min-height: 300px;
        }

        .products-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .product-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .product-row .rank {
          font-weight: 700;
          color: #8B5CF6;
          width: 30px;
        }

        .product-row .name {
          flex: 1;
          font-weight: 500;
        }

        .product-row .orders {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
        }

        .product-row .revenue {
          font-weight: 600;
          color: #10B981;
        }

        .no-data {
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
          padding: 40px;
        }

        @media (max-width: 768px) {
          .summary-cards, .chart-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
