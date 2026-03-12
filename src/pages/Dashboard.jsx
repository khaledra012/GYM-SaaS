import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { membersAPI } from '../utils/api';

const DEFAULT_STATS = {
    totalMembers: 0,
    activeMembers: 0,
    expiringSoon: 0,
    newMembers: 0,
    todayCheckedInMembers: 0,
};

const normalizeDashboardData = (payload) => {
    const source = payload?.stats || payload?.data?.stats || payload?.data || payload || {};

    const expiringSoonItems = Array.isArray(source.expiringSoonItems)
        ? source.expiringSoonItems
        : Array.isArray(payload?.expiringSoonItems)
            ? payload.expiringSoonItems
            : Array.isArray(payload?.data?.expiringSoonItems)
                ? payload.data.expiringSoonItems
                : [];

    return {
        stats: {
            totalMembers: Number(source.totalMembers ?? source.total ?? 0),
            activeMembers: Number(source.activeMembers ?? source.active ?? 0),
            expiringSoon: Number(source.expiringSoon ?? expiringSoonItems.length ?? 0),
            newMembers: Number(source.newMembers ?? source.newThisMonth ?? 0),
            todayCheckedInMembers: Number(source.todayCheckedInMembers ?? source.todayCheckedIn ?? 0),
        },
        expiringSoonItems,
    };
};

const Dashboard = () => {
    const [stats, setStats] = useState(DEFAULT_STATS);
    const [expiringSubscriptions, setExpiringSubscriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const data = await membersAPI.getStats();
                const normalized = normalizeDashboardData(data);

                setStats(normalized.stats);
                setExpiringSubscriptions(normalized.expiringSoonItems);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setStats({
                    totalMembers: 128,
                    activeMembers: 94,
                    expiringSoon: 12,
                    newMembers: 8,
                    todayCheckedInMembers: 57,
                });
                setExpiringSubscriptions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statItems = [
        { icon: Users, label: 'Total Members', value: stats.totalMembers, trend: { type: 'up', value: 12 } },
        { icon: UserCheck, label: 'Active Now', value: stats.activeMembers, color: '#60a5fa' },
        { icon: CheckCircle, label: 'Today Checked In', value: stats.todayCheckedInMembers || 0, color: '#34d399' },
        { icon: Clock, label: 'Expiring Soon', value: stats.expiringSoon, color: '#fb923c' },
        { icon: TrendingUp, label: 'New This Month', value: stats.newMembers, color: '#c084fc' },
    ];

    return (
        <DashboardLayout>
            <header className="dashboard-header page-header">
                <h1 className="page-title">Dashboard Overview</h1>
                <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
            </header>

            <div className="stats-grid">
                {statItems.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <section className="dashboard-section mt-8">
                <div className="section-card glass-panel">
                    <div className="flex-between mb-6">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertTriangle size={22} color="#fb923c" />
                            <h2 className="section-title" style={{ margin: 0 }}>Expiring Soon</h2>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="empty-state">Loading...</div>
                    ) : expiringSubscriptions.length > 0 ? (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Expiry Date</th>
                                        <th>Remaining</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiringSubscriptions.map((sub) => {
                                        const isDays = sub.remainingUnit === 'days';
                                        const isUrgent = isDays ? sub.remainingValue <= 3 : sub.remainingValue <= 2;
                                        return (
                                            <tr key={sub.id}>
                                                <td style={{ color: 'var(--text-muted)' }}>{sub.member?.code || 'N/A'}</td>
                                                <td style={{ fontWeight: '600' }}>{sub.member?.name}</td>
                                                <td>{sub.member?.phone}</td>
                                                <td>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'Sessions'}</td>
                                                <td>
                                                    <span style={{
                                                        color: isUrgent ? '#ef4444' : '#fb923c',
                                                        fontWeight: '700',
                                                        background: isUrgent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 146, 60, 0.15)',
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {isDays
                                                            ? (sub.remainingValue <= 0 ? 'Today!' : `${sub.remainingValue} day${sub.remainingValue > 1 ? 's' : ''}`)
                                                            : `${sub.remainingValue} session${sub.remainingValue > 1 ? 's' : ''}`}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>🎉 No memberships are expiring right now.</p>
                        </div>
                    )}
                </div>
            </section>
        </DashboardLayout>
    );
};

export default Dashboard;
