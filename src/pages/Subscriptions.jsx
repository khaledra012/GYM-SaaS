import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, RefreshCw, Snowflake, XCircle, Filter } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import SubscriptionModal from '../components/SubscriptionModal';
import SubscriptionDetailsModal from '../components/SubscriptionDetailsModal';
import RenewModal from '../components/RenewModal';
import DeductModal from '../components/DeductModal';
import Button from '../components/Button';
import { subscriptionsAPI, membersAPI } from '../utils/api';

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'frozen', label: 'Frozen' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'expired', label: 'Expired' },
    { key: 'expiring', label: 'Expiring Soon' },
];

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSubscriptions();
    }, [searchTerm, activeTab, currentPage]);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
            const params = { limit: 100, page: currentPage }; // Fetch up to 100 per page to satisfy limits
            if (searchTerm) params.search = searchTerm;
            // No longer filtering by activeTab on the server so we can get all counts correctly

            const data = await subscriptionsAPI.getSubscriptions(params);

            // Extract pagination info if available
            if (data.totalPages) {
                setTotalPages(data.totalPages);
            }

            const subs = Array.isArray(data.data) ? data.data
                : Array.isArray(data.subscriptions) ? data.subscriptions
                    : Array.isArray(data) ? data
                        : [];
            setSubscriptions(subs);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
            setSubscriptions([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchClick = () => {
        setCurrentPage(1); // Reset page on search
        setSearchTerm(searchInput);
        setSearchInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setCurrentPage(1); // Reset page on search
            setSearchTerm(searchInput);
            setSearchInput('');
        }
    };

    const handleViewDetails = (sub) => {
        setSelectedSubscription(sub);
        setIsDetailsModalOpen(true);
    };

    const handleRenew = (sub) => {
        setSelectedSubscription(sub);
        setIsRenewModalOpen(true);
    };

    const handleDeduct = (sub) => {
        setSelectedSubscription(sub);
        setIsDeductModalOpen(true);
    };

    const handleFreeze = async (sub) => {
        const action = sub.status === 'frozen' ? 'unfreeze' : 'freeze';
        if (window.confirm(`Are you sure you want to ${action} this subscription for ${sub.member.name}?`)) {
            try {
                if (action === 'freeze') {
                    await subscriptionsAPI.freezeSubscription(sub.id);
                } else {
                    await subscriptionsAPI.unfreezeSubscription(sub.id);
                }
                fetchSubscriptions();
            } catch (error) {
                if (error.status === 409) {
                    alert('البيانات اتغيّرت من مستخدم آخر، جاري إعادة التحميل...');
                    fetchSubscriptions();
                } else if (error.status === 400 && error.message.toLowerCase().includes('expire')) {
                    alert(error.message || 'Subscription is expired, refreshing data...');
                    fetchSubscriptions();
                } else {
                    alert(error.message || 'فشلت العملية');
                }
            }
        }
    };

    const handleCancel = async (sub) => {
        if (window.confirm(`Are you sure you want to cancel the subscription for ${sub.member.name}?`)) {
            try {
                await subscriptionsAPI.cancelSubscription(sub.id);
                fetchSubscriptions();
            } catch (error) {
                if (error.status === 409) {
                    alert('البيانات اتغيّرت من مستخدم آخر، جاري إعادة التحميل...');
                    fetchSubscriptions();
                } else if (error.status === 400 && error.message.toLowerCase().includes('expire')) {
                    alert(error.message || 'Subscription is expired, refreshing data...');
                    fetchSubscriptions();
                } else {
                    alert(error.message || 'فشل إلغاء الاشتراك');
                }
            }
        }
    };

    const handleCreateSubmit = async (payload) => {
        setIsSubmitting(true);
        try {
            if (payload.isNewMember) {
                // 1. Create the new member first
                const memberRes = await membersAPI.addMember(payload.memberData);
                // The backend typically returns { success: true, member: { id: ... } } or { data: { id: ... } }
                const newMemberId = memberRes.member?.id || memberRes.data?.id || memberRes.id;

                if (!newMemberId) {
                    throw new Error("Member created but failed to retrieve ID for subscription.");
                }

                // 2. Create the subscription using the new member ID
                const subData = { ...payload.subscriptionData, memberId: newMemberId };
                await subscriptionsAPI.addSubscription(subData);
            } else {
                // Existing member flow
                await subscriptionsAPI.addSubscription(payload.subscriptionData);
            }

            setIsCreateModalOpen(false);
            fetchSubscriptions();
        } catch (error) {
            alert(error.message || 'فشل إنشاء الاشتراك');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRenewSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            await subscriptionsAPI.renewSubscription(selectedSubscription.id, formData);
            setIsRenewModalOpen(false);
            fetchSubscriptions();
        } catch (error) {
            if (error.status === 409) {
                alert('البيانات اتغيّرت من مستخدم آخر، جاري إعادة التحميل...');
                setIsRenewModalOpen(false);
                fetchSubscriptions();
            } else if (error.status === 400 && error.message.toLowerCase().includes('expire')) {
                alert(error.message || 'Subscription is expired, refreshing data...');
                setIsRenewModalOpen(false);
                fetchSubscriptions();
            } else {
                alert(error.message || 'فشل تجديد الاشتراك');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeductSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            await subscriptionsAPI.deductSessions(selectedSubscription.id, formData);
            setIsDeductModalOpen(false);
            fetchSubscriptions();
        } catch (error) {
            if (error.status === 409) {
                alert('البيانات اتغيّرت من مستخدم آخر، جاري إعادة التحميل...');
                setIsDeductModalOpen(false);
                fetchSubscriptions();
            } else if (error.status === 400 && error.message.toLowerCase().includes('expire')) {
                alert(error.message || 'Subscription is expired, refreshing data...');
                setIsDeductModalOpen(false);
                fetchSubscriptions();
            } else {
                alert(error.message || 'فشل خصم الجلسات');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        return <span className={`status-badge ${status}`}>{status}</span>;
    };

    const getDaysRemaining = (endDate) => {
        const now = new Date();
        const end = new Date(endDate);
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    const searchedSubs = searchTerm ? subscriptions.filter(sub => {
        const query = searchTerm.toLowerCase();
        return (
            sub.member?.name?.toLowerCase().includes(query) ||
            sub.member?.phone?.includes(searchTerm) ||
            sub.member?.code?.toLowerCase().includes(query)
        );
    }) : subscriptions;

    // Tab counts from actual API data
    const getTabCount = (tabStatus) => {
        if (tabStatus === 'all') return searchedSubs.length;
        if (tabStatus === 'expiring') {
            const now = new Date();
            const soon = new Date();
            soon.setDate(now.getDate() + 7);
            return searchedSubs.filter(s => {
                if (s.status !== 'active') return false;

                if (s.type === 'session_based' || s.plan?.type === 'session_based') {
                    return s.remainingSessions > 0 && s.remainingSessions <= 2;
                } else {
                    if (!s.endDate) return false;
                    const end = new Date(s.endDate);
                    return end >= now && end <= soon;
                }
            }).length;
        }
        return searchedSubs.filter(s => s.status === tabStatus).length;
    };

    const tabCounts = {
        all: getTabCount('all'),
        active: getTabCount('active'),
        frozen: getTabCount('frozen'),
        cancelled: getTabCount('cancelled'),
        expired: getTabCount('expired'),
        expiring: getTabCount('expiring'),
    };

    // Filter by plan, source, and tab (client-side)
    const getDisplayedSubs = () => {
        let list = searchedSubs;

        if (sourceFilter !== 'all') {
            list = list.filter(sub => sub.source === sourceFilter);
        }

        if (planFilter !== 'all') {
            list = list.filter(sub => sub.plan?.name === planFilter);
        }

        if (activeTab === 'all') return list;

        if (activeTab === 'expiring') {
            const now = new Date();
            const soon = new Date();
            soon.setDate(now.getDate() + 7);
            return list.filter(s => {
                if (s.status !== 'active') return false;

                if (s.type === 'session_based' || s.plan?.type === 'session_based') {
                    return s.remainingSessions > 0 && s.remainingSessions <= 2;
                } else {
                    if (!s.endDate) return false;
                    const end = new Date(s.endDate);
                    return end >= now && end <= soon;
                }
            });
        }

        return list.filter(sub => sub.status === activeTab);
    };

    const displayedSubs = getDisplayedSubs();

    // Unique plans for filter dropdown
    const uniquePlans = [...new Set(subscriptions.map(s => s.plan?.name).filter(Boolean))];

    return (
        <DashboardLayout>
            <div className="flex-between page-header mb-8">
                <header>
                    <h1 className="page-title">Subscriptions</h1>
                    <p className="page-subtitle">Manage all member subscriptions, renewals and freezes.</p>
                </header>
                <Button onClick={() => setIsCreateModalOpen(true)} style={{ width: 'auto', gap: '8px' }}>
                    <Plus size={20} />
                    New Subscription
                </Button>
            </div>

            {/* Tabs */}
            <div className="tabs-bar">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                        <span className="tab-count">{tabCounts[tab.key] || 0}</span>
                    </button>
                ))}
            </div>

            <section className="glass-panel">
                {/* Search & Filters */}
                <div className="flex-between mb-6" style={{ gap: '1rem' }}>
                    <div className="search-wrapper" style={{ flexGrow: 1, position: 'relative', display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flexGrow: 1 }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                            <input
                                type="text"
                                className="form-input with-icon"
                                placeholder="Search by member name, phone, or code..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <Button
                            onClick={handleSearchClick}
                            style={{ width: 'auto', padding: '0 1.5rem' }}
                        >
                            Search
                        </Button>
                    </div>

                    <div className="filter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={20} color="var(--text-muted)" />
                        <select
                            className="form-input"
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            style={{ width: '150px', paddingLeft: '1rem' }}
                        >
                            <option value="all">All Sources</option>
                            <option value="plan">From Plan</option>
                            <option value="manual">Manual</option>
                        </select>
                        <select
                            className="form-input"
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            style={{ width: '180px', paddingLeft: '1rem' }}
                            disabled={sourceFilter === 'manual'}
                        >
                            <option value="all">All Plans</option>
                            {uniquePlans.map(plan => (
                                <option key={plan} value={plan}>{plan}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    {isLoading ? (
                        <div className="empty-state">Loading subscriptions...</div>
                    ) : displayedSubs.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Plan</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th style={{ textAlign: 'center' }}>Remaining (Days/Sessions)</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedSubs.map((sub) => {
                                    const daysLeft = getDaysRemaining(sub.endDate);
                                    return (
                                        <tr key={sub.id}>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{sub.member?.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.member?.phone}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '500' }}>
                                                    {sub.source === 'manual' ? (
                                                        <span style={{ color: 'var(--accent-neon)', border: '1px solid var(--accent-neon)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                                                            Manual
                                                        </span>
                                                    ) : (
                                                        sub.plan?.name || 'Unknown Plan'
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    {Number(sub.pricePaid || 0).toLocaleString('en-EG')} EGP
                                                </div>
                                            </td>
                                            <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                                            <td>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {sub.type === 'session_based' ? (
                                                    sub.status === 'active' || sub.status === 'expired' ? (
                                                        <span style={{ fontWeight: '600', color: sub.remainingSessions > 0 ? 'var(--accent-neon)' : '#ef4444' }}>
                                                            {sub.remainingSessions || 0} Sessions
                                                        </span>
                                                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                ) : (
                                                    sub.status === 'active' ? (
                                                        <span style={{
                                                            color: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#fb923c' : 'var(--accent-neon)',
                                                            fontWeight: '700',
                                                            background: daysLeft <= 3 ? 'rgba(239, 68, 68, 0.15)' : daysLeft <= 7 ? 'rgba(251, 146, 60, 0.15)' : 'rgba(57, 255, 20, 0.1)',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            {daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                    )
                                                )}
                                            </td>
                                            <td>{getStatusBadge(sub.status)}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="btn-icon" title="View Details" onClick={() => handleViewDetails(sub)}>
                                                        <Eye size={16} />
                                                    </button>
                                                    {sub.status === 'active' && (
                                                        <button className="btn-icon renew" title="Renew" onClick={() => handleRenew(sub)}>
                                                            <RefreshCw size={16} />
                                                        </button>
                                                    )}
                                                    {(sub.status === 'active' || sub.status === 'frozen') && (
                                                        <button className="btn-icon freeze" title={sub.status === 'frozen' ? 'Unfreeze' : 'Freeze'} onClick={() => handleFreeze(sub)}>
                                                            <Snowflake size={16} />
                                                        </button>
                                                    )}
                                                    {sub.status === 'active' && (
                                                        <button className="btn-icon delete" title="Cancel" onClick={() => handleCancel(sub)}>
                                                            <XCircle size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>No subscriptions found matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
                        <Button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.05)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', border: '1px solid var(--card-border)' }}
                        >
                            Previous
                        </Button>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Page <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> of <strong style={{ color: 'var(--text-main)' }}>{totalPages}</strong>
                        </span>
                        <Button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.05)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)', border: '1px solid var(--card-border)' }}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </section>

            {/* Modals */}
            <SubscriptionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
                isLoading={isSubmitting}
            />

            {selectedSubscription && (
                <>
                    <SubscriptionDetailsModal
                        isOpen={isDetailsModalOpen}
                        onClose={() => setIsDetailsModalOpen(false)}
                        subscription={selectedSubscription}
                        onRenew={() => { setIsDetailsModalOpen(false); handleRenew(selectedSubscription); }}
                        onFreeze={() => { setIsDetailsModalOpen(false); handleFreeze(selectedSubscription); }}
                        onCancel={() => { setIsDetailsModalOpen(false); handleCancel(selectedSubscription); }}
                        onDeduct={() => { setIsDetailsModalOpen(false); handleDeduct(selectedSubscription); }}
                    />

                    <RenewModal
                        isOpen={isRenewModalOpen}
                        onClose={() => setIsRenewModalOpen(false)}
                        onSubmit={handleRenewSubmit}
                        subscription={selectedSubscription}
                        isLoading={isSubmitting}
                    />

                    <DeductModal
                        isOpen={isDeductModalOpen}
                        onClose={() => setIsDeductModalOpen(false)}
                        onSubmit={handleDeductSubmit}
                        subscription={selectedSubscription}
                        isLoading={isSubmitting}
                    />
                </>
            )}
        </DashboardLayout>
    );
};

export default Subscriptions;
