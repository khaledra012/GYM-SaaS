import React, { useState, useEffect, useCallback } from 'react';
import { Building2, CheckCircle, XCircle, Clock, AlertTriangle, Search, ChevronLeft, ChevronRight, RefreshCw, Eye, CreditCard } from 'lucide-react';
import SuperAdminLayout from '../components/SuperAdminLayout';
import StatCard from '../components/StatCard';
import { platformAdminAPI } from '../utils/api';

const BILLING_LABELS = {
    trial: 'فترة تجربة',
    subscribed: 'مفعل',
    unsubscribed: 'غير مشترك'
};

const BILLING_COLORS = {
    trial: { bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.25)' },
    subscribed: { bg: 'var(--accent-neon-light)', color: 'var(--accent-neon)', border: 'var(--accent-neon-border)' },
    unsubscribed: { bg: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5', border: 'rgba(239, 68, 68, 0.25)' }
};

// ── Activation Modal ────────────────────────────────────────────────
const ActivateModal = ({ center, onClose, onConfirm }) => {
    const [mode, setMode] = useState('days'); // 'days' | 'date' | 'open'
    const [days, setDays] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const todayStr = new Date().toISOString().split('T')[0];

    const handleSubmit = async () => {
        setError('');
        let body = {};
        if (mode === 'days') {
            const n = parseInt(days, 10);
            if (!n || n < 1 || n > 3650) {
                setError('أدخل عدد أيام صحيح من 1 إلى 3650.');
                return;
            }
            body = { subscriptionDurationDays: n };
        } else if (mode === 'date') {
            if (!date) { setError('اختر تاريخ انتهاء الاشتراك.'); return; }
            if (new Date(date) <= new Date()) { setError('التاريخ يجب أن يكون في المستقبل.'); return; }
            body = { subscriptionEndsAt: new Date(date).toISOString() };
        }
        // mode === 'open' → body stays {}
        setLoading(true);
        await onConfirm(center.id, body);
        setLoading(false);
    };

    const btnStyle = (active) => ({
        flex: 1,
        padding: '10px 16px',
        borderRadius: '8px',
        border: `1px solid ${active ? 'rgba(167,139,250,0.6)' : 'var(--card-border)'}`,
        background: active ? 'rgba(167,139,250,0.15)' : 'transparent',
        color: active ? '#a78bfa' : 'var(--text-muted)',
        cursor: 'pointer',
        fontWeight: active ? 700 : 400,
        fontSize: '0.85rem',
        transition: 'all 0.2s',
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header rtl-text" style={{ flexDirection: 'row-reverse' }}>
                    <h3 className="section-title" style={{ fontSize: '1.15rem' }}>تفعيل مركز</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="rtl-text" style={{ padding: '0 0 1rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        تفعيل اشتراك: <strong style={{ color: '#f8fafc' }}>{center?.name}</strong>
                    </p>

                    {/* Mode selector */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                        <button style={btnStyle(mode === 'days')} onClick={() => setMode('days')}>
                            📅 عدد أيام
                        </button>
                        <button style={btnStyle(mode === 'date')} onClick={() => setMode('date')}>
                            📆 تاريخ محدد
                        </button>
                        <button style={btnStyle(mode === 'open')} onClick={() => setMode('open')}>
                            ∞ مفتوح
                        </button>
                    </div>

                    {/* Input based on mode */}
                    {mode === 'days' && (
                        <div className="form-group">
                            <label className="form-label">عدد أيام الاشتراك</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="مثال: 30 أو 365"
                                min={1}
                                max={3650}
                                value={days}
                                onChange={e => setDays(e.target.value)}
                                style={{ direction: 'rtl' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                سيبدأ الاشتراك من اليوم لمدة {days ? `${days} يوم` : '...'}
                            </p>
                        </div>
                    )}

                    {mode === 'date' && (
                        <div className="form-group">
                            <label className="form-label">تاريخ انتهاء الاشتراك</label>
                            <input
                                type="date"
                                className="form-input"
                                value={date}
                                min={todayStr}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                    )}

                    {mode === 'open' && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: 'rgba(167,139,250,0.08)',
                            border: '1px solid rgba(167,139,250,0.2)',
                            color: '#a78bfa',
                            fontSize: '0.9rem',
                        }}>
                            ⚡ تفعيل مدفوع بدون تاريخ انتهاء محدد (مفتوح حتى الإلغاء).
                        </div>
                    )}

                    {error && (
                        <p style={{ color: '#fca5a5', marginTop: '0.75rem', fontSize: '0.85rem' }}>{error}</p>
                    )}
                </div>

                <div className="modal-footer rtl-text" style={{ justifyContent: 'flex-start' }}>
                    <button className="btn btn-text" onClick={onClose} disabled={loading}>إلغاء</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'جاري التفعيل...' : '✅ تأكيد التفعيل'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ── Main Dashboard ──────────────────────────────────────────────────
const SuperAdminDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [centers, setCenters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    // Filters & pagination
    const [search, setSearch] = useState('');
    const [billingFilter, setBillingFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const limit = 20;

    // Modals
    const [activateModal, setActivateModal] = useState({ open: false, center: null });
    const [trialModal, setTrialModal] = useState({ open: false, centerId: null, centerName: '' });
    const [trialDate, setTrialDate] = useState('');
    const [detailsModal, setDetailsModal] = useState({ open: false, center: null });

    const fetchSummary = async () => {
        try {
            const res = await platformAdminAPI.getDashboardSummary();
            setSummary(res.data);
        } catch (err) {
            console.error('Failed to fetch summary:', err);
        }
    };

    const fetchCenters = useCallback(async () => {
        setTableLoading(true);
        try {
            const params = { page, limit };
            if (billingFilter) params.billingStatus = billingFilter;
            if (search.trim()) params.search = search.trim();
            const res = await platformAdminAPI.getCenters(params);
            setCenters(res.data || []);
            setPagination({ total: res.total || 0, pages: res.pages || 1 });
        } catch (err) {
            setError(err.message);
        } finally {
            setTableLoading(false);
            setIsLoading(false);
        }
    }, [page, billingFilter, search]);

    useEffect(() => { fetchSummary(); }, []);
    useEffect(() => { fetchCenters(); }, [fetchCenters]);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // ── Activate with modal ──
    const handleActivateConfirm = async (centerId, body) => {
        try {
            await platformAdminAPI.activateCenter(centerId, body);
            showAction('تم تفعيل المركز بنجاح ✅');
            setActivateModal({ open: false, center: null });
            fetchCenters();
            fetchSummary();
        } catch (err) {
            showAction(`❌ ${err.message}`);
        }
    };

    const handleDeactivate = async (id) => {
        try {
            await platformAdminAPI.deactivateCenter(id);
            showAction('تم إلغاء اشتراك المركز ❌');
            fetchCenters();
            fetchSummary();
        } catch (err) {
            showAction(`❌ ${err.message}`);
        }
    };

    const handleTrialExtend = async () => {
        if (!trialDate) return;
        try {
            await platformAdminAPI.updateBillingStatus(trialModal.centerId, {
                billingStatus: 'trial',
                trialEndsAt: new Date(trialDate).toISOString()
            });
            showAction('تم تمديد الفترة التجريبية ✅');
            setTrialModal({ open: false, centerId: null, centerName: '' });
            setTrialDate('');
            fetchCenters();
            fetchSummary();
        } catch (err) {
            showAction(`❌ ${err.message}`);
        }
    };

    const showAction = (msg) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(''), 4000);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const statItems = summary ? [
        { icon: Building2, label: 'إجمالي المراكز', value: summary.totalCenters, color: '#a78bfa' },
        { icon: Clock, label: 'فترة تجربة', value: summary.trialCenters, color: '#fbbf24' },
        { icon: CheckCircle, label: 'مفعل', value: summary.subscribedCenters, color: 'var(--accent-neon)' },
        { icon: XCircle, label: 'غير مشترك', value: summary.unsubscribedCenters, color: '#ef4444' },
        { icon: AlertTriangle, label: 'تجربة تنتهي قريباً', value: summary.trialsExpiringSoon, color: '#fb923c' },
        { icon: CreditCard, label: 'اشتراك ينتهي قريباً', value: summary.subscriptionsExpiringSoon ?? 0, color: '#f472b6' },
    ] : [];

    return (
        <SuperAdminLayout>
            <header className="dashboard-header page-header rtl-text">
                <h1 className="page-title">لوحة تحكم المشرف</h1>
                <p className="page-subtitle">إدارة مراكز الجيم والاشتراكات</p>
            </header>

            {/* Action Toast */}
            {actionMsg && (
                <div style={{
                    position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(167, 139, 250, 0.3)',
                    backdropFilter: 'blur(12px)', padding: '1rem 2rem', borderRadius: '12px',
                    zIndex: 9999, fontSize: '0.95rem', color: '#f8fafc',
                    animation: 'modalIn 0.3s ease', direction: 'rtl'
                }}>
                    {actionMsg}
                </div>
            )}

            {/* Summary Cards */}
            {!isLoading && summary && (
                <div className="stats-grid rtl-text">
                    {statItems.map((stat, i) => (
                        <StatCard key={i} {...stat} />
                    ))}
                </div>
            )}

            {/* Centers Table */}
            <section className="dashboard-section mt-8">
                <div className="section-card glass-panel">
                    <div className="flex-between mb-6 rtl-text" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Building2 size={22} color="#a78bfa" />
                            <h2 className="section-title" style={{ margin: 0 }}>قائمة المراكز</h2>
                        </div>
                        <button className="btn-icon" onClick={() => { fetchCenters(); fetchSummary(); }}
                            title="تحديث" style={{ border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="rtl-text" style={{ position: 'relative', flex: '1 1 260px' }}>
                            <Search size={16} className="input-icon" style={{ top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                className="form-input with-icon"
                                placeholder="بحث بالاسم أو الإيميل أو الموبايل..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                style={{ fontSize: '0.9rem' }}
                            />
                        </div>
                        <select
                            className="form-input rtl-text"
                            value={billingFilter}
                            onChange={(e) => { setBillingFilter(e.target.value); setPage(1); }}
                            style={{ flex: '0 0 180px', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            <option value="">كل الحالات</option>
                            <option value="trial">فترة تجربة</option>
                            <option value="subscribed">مفعل</option>
                            <option value="unsubscribed">غير مشترك</option>
                        </select>
                    </div>

                    {/* Table */}
                    {tableLoading ? (
                        <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                            <RefreshCw size={24} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
                            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
                        </div>
                    ) : error ? (
                        <div className="empty-state" style={{ color: '#fca5a5', textAlign: 'center', padding: '2rem' }}>{error}</div>
                    ) : centers.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p>لا توجد مراكز مطابقة</p>
                        </div>
                    ) : (
                        <div className="table-container rtl-text">
                            <table className="data-table" style={{ textAlign: 'right' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'right' }}>#</th>
                                        <th style={{ textAlign: 'right' }}>اسم المركز</th>
                                        <th style={{ textAlign: 'right' }}>الإيميل</th>
                                        <th style={{ textAlign: 'right' }}>الموبايل</th>
                                        <th style={{ textAlign: 'right' }}>الحالة</th>
                                        <th style={{ textAlign: 'center', color: '#60a5fa', fontSize: '0.85rem' }}>بداية الاشتراك</th>
                                        <th style={{ textAlign: 'center', color: '#a78bfa', fontSize: '0.85rem' }}>مدة الاشتراك</th>
                                        <th style={{ textAlign: 'center', color: '#fbbf24', fontSize: '0.85rem' }}>تجربة مجانية</th>
                                        <th style={{ textAlign: 'center', color: 'var(--accent-neon)', fontSize: '0.85rem' }}>باقي في الاشتراك</th>
                                        <th style={{ textAlign: 'right' }}>تاريخ التسجيل</th>
                                        <th style={{ textAlign: 'center' }}>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {centers.map((center, idx) => {
                                        const statusStyle = BILLING_COLORS[center.billingStatus] || BILLING_COLORS.unsubscribed;

                                        // Trial info directly from backend
                                        const trialEnd = center.trialEndsAt;
                                        const trialLeft = center.trialDaysLeft !== undefined ? center.trialDaysLeft : null;

                                        // Paid subscription info directly from backend
                                        const subEnd = center.subscriptionEndsAt;
                                        const subLeft = center.subscriptionDaysLeft !== undefined ? center.subscriptionDaysLeft : null;
                                        const subDuration = center.subscriptionDurationDays !== undefined ? center.subscriptionDurationDays : null;

                                        const DurationCell = ({ daysLeft, endDate, color, isTrial, billingStatus, durationDays }) => {
                                            // Handling open-ended subscriptions
                                            if (!isTrial && billingStatus === 'subscribed' && durationDays === null) {
                                                return <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>—</div>;
                                            }

                                            // If the center is on a free trial, don't show "Expired" for the paid subscription
                                            if (!isTrial && billingStatus === 'trial') {
                                                return <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>—</div>;
                                            }

                                            // If it's empty and not active
                                            if (daysLeft === null && !endDate) return <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>—</div>;

                                            const isExpired = daysLeft !== null && daysLeft <= 0;
                                            const barColor = isExpired ? '#ef4444' : (daysLeft !== null && daysLeft <= 3 ? '#ef4444' : daysLeft !== null && daysLeft <= 7 ? '#fb923c' : color);

                                            return (
                                                <div style={{ minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                                                    {daysLeft !== null ? (
                                                        <span style={{ fontSize: '0.85rem', color: barColor, fontWeight: 700 }}>
                                                            {isExpired ? 'منتهي' : `متبقي ${daysLeft} يوم`}
                                                        </span>
                                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&#8212;</span>}
                                                    {endDate ? (
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                            ينتهي: {formatDate(endDate)}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            );
                                        };

                                        // Total Duration & Start Date logic matching backend exactly
                                        let totalDurationStr = '—';
                                        let startDateStr = '—';

                                        if (center.billingStatus === 'subscribed') {
                                            startDateStr = center.subscriptionStartedAt ? formatDate(center.subscriptionStartedAt) : '—';
                                            if (center.subscriptionDurationDays !== null && center.subscriptionDurationDays !== undefined) {
                                                totalDurationStr = `${center.subscriptionDurationDays} يوم`;
                                            } else {
                                                // Strictly fallback to "مفتوح" based on null duration
                                                totalDurationStr = 'مفتوح';
                                            }
                                        }

                                        return (
                                            <tr key={center.id}>
                                                <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * limit + idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{center.name}</td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{center.email}</td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem', direction: 'ltr', textAlign: 'right' }}>{center.phone || '—'}</td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block', whiteSpace: 'nowrap',
                                                        padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem',
                                                        fontWeight: 600, background: statusStyle.bg, color: statusStyle.color,
                                                        border: `1px solid ${statusStyle.border}`
                                                    }}>
                                                        {BILLING_LABELS[center.billingStatus] || center.billingStatus}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{startDateStr}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalDurationStr}</td>
                                                <td style={{ textAlign: 'center' }}><DurationCell daysLeft={trialLeft} endDate={trialEnd} color="#fbbf24" isTrial={true} /></td>
                                                <td style={{ textAlign: 'center' }}><DurationCell daysLeft={subLeft} endDate={subEnd} color="var(--accent-neon)" isTrial={false} billingStatus={center.billingStatus} durationDays={subDuration} /></td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatDate(center.createdAt)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap' }}>
                                                        {/* View */}
                                                        <button className="btn-icon" title="تفاصيل"
                                                            onClick={() => setDetailsModal({ open: true, center })}>
                                                            <Eye size={15} />
                                                        </button>

                                                        {/* Activate */}
                                                        {center.billingStatus !== 'subscribed' && (
                                                            <button
                                                                className="btn-icon renew"
                                                                title="تفعيل"
                                                                onClick={() => setActivateModal({ open: true, center })}
                                                                style={{ fontSize: '0.7rem', fontWeight: 700, width: 'auto', padding: '0 10px' }}
                                                            >
                                                                تفعيل
                                                            </button>
                                                        )}

                                                        {/* Deactivate */}
                                                        {center.billingStatus !== 'unsubscribed' && (
                                                            <button
                                                                className="btn-icon delete"
                                                                title="إلغاء"
                                                                onClick={() => handleDeactivate(center.id)}
                                                                style={{ fontSize: '0.7rem', fontWeight: 700, width: 'auto', padding: '0 10px' }}
                                                            >
                                                                إلغاء
                                                            </button>
                                                        )}

                                                        {/* Extend trial */}
                                                        <button
                                                            className="btn-icon freeze"
                                                            title="تمديد تجربة"
                                                            onClick={() => setTrialModal({ open: true, centerId: center.id, centerName: center.name })}
                                                            style={{ fontSize: '0.7rem', fontWeight: 700, width: 'auto', padding: '0 10px' }}
                                                        >
                                                            تجربة
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', direction: 'ltr' }}>
                            <button className="btn-icon" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ opacity: page <= 1 ? 0.4 : 1 }}>
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {page} / {pagination.pages} <span style={{ margin: '0 0.5rem' }}>—</span> {pagination.total} مركز
                            </span>
                            <button className="btn-icon" disabled={page >= pagination.pages} onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} style={{ opacity: page >= pagination.pages ? 0.4 : 1 }}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Activate Modal */}
            {activateModal.open && (
                <ActivateModal
                    center={activateModal.center}
                    onClose={() => setActivateModal({ open: false, center: null })}
                    onConfirm={handleActivateConfirm}
                />
            )}

            {/* Trial Extension Modal */}
            {trialModal.open && (
                <div className="modal-overlay" onClick={() => setTrialModal({ open: false, centerId: null, centerName: '' })}>
                    <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header rtl-text" style={{ flexDirection: 'row-reverse' }}>
                            <h3 className="section-title" style={{ fontSize: '1.25rem' }}>تمديد الفترة التجريبية</h3>
                            <button className="close-btn" onClick={() => setTrialModal({ open: false, centerId: null, centerName: '' })}>✕</button>
                        </div>

                        <div className="rtl-text">
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                تمديد تجربة المركز: <strong style={{ color: '#f8fafc' }}>{trialModal.centerName}</strong>
                            </p>
                            <div className="form-group">
                                <label className="form-label">تاريخ انتهاء التجربة الجديد</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={trialDate}
                                    onChange={(e) => setTrialDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div className="modal-footer rtl-text" style={{ justifyContent: 'flex-start' }}>
                            <button className="btn btn-text" onClick={() => setTrialModal({ open: false, centerId: null, centerName: '' })}>إلغاء</button>
                            <button className="btn btn-primary" onClick={handleTrialExtend} disabled={!trialDate} style={{ opacity: !trialDate ? 0.5 : 1 }}>
                                تأكيد التمديد
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {detailsModal.open && detailsModal.center && (
                <div className="modal-overlay" onClick={() => setDetailsModal({ open: false, center: null })}>
                    <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header rtl-text" style={{ flexDirection: 'row-reverse' }}>
                            <h3 className="section-title" style={{ fontSize: '1.25rem' }}>تفاصيل المركز</h3>
                            <button className="close-btn" onClick={() => setDetailsModal({ open: false, center: null })}>✕</button>
                        </div>

                        <div className="rtl-text">
                            {(() => {
                                const c = detailsModal.center;
                                const statusStyle = BILLING_COLORS[c.billingStatus] || BILLING_COLORS.unsubscribed;
                                const rows = [
                                    ['الاسم', c.name],
                                    ['الإيميل', c.email],
                                    ['الموبايل', c.phone || '—'],
                                    ['المنطقة الزمنية', c.timezone || '—'],
                                    ['حالة الاشتراك', BILLING_LABELS[c.billingStatus] || c.billingStatus],
                                    ['بداية التجربة', formatDate(c.trialStartedAt)],
                                    ['نهاية التجربة', formatDate(c.trialEndsAt)],
                                    ['أيام تجربة متبقية', c.billingStatus === 'trial' && c.trialDaysLeft != null ? `${c.trialDaysLeft} يوم` : '—'],
                                    ['بداية الاشتراك المدفوع', formatDate(c.subscriptionStartedAt)],
                                    ['نهاية الاشتراك المدفوع', formatDate(c.subscriptionEndsAt)],
                                    ['أيام اشتراك متبقية', c.billingStatus === 'subscribed' && c.subscriptionDaysLeft != null ? `${c.subscriptionDaysLeft} يوم` : '—'],
                                    ['تاريخ التسجيل', formatDate(c.createdAt)],
                                ];
                                return (
                                    <div>
                                        <div style={{
                                            display: 'inline-block', marginBottom: '1.25rem',
                                            padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem',
                                            fontWeight: 600, background: statusStyle.bg, color: statusStyle.color,
                                            border: `1px solid ${statusStyle.border}`
                                        }}>
                                            {BILLING_LABELS[c.billingStatus]}
                                        </div>
                                        {rows.map(([label, val], i) => (
                                            <div key={i} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '0.65rem 0', borderBottom: i < rows.length - 1 ? '1px solid var(--card-border)' : 'none'
                                            }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
                                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="modal-footer rtl-text" style={{ justifyContent: 'flex-start' }}>
                            <button className="btn btn-primary" onClick={() => setDetailsModal({ open: false, center: null })}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
};

export default SuperAdminDashboard;
