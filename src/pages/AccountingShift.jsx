import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, LogIn, LogOut, Activity } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { accountingAPI, debtsAPI } from '../utils/api';

const EMPTY_DEBTS_SUMMARY = {
    totalOriginalAmountCents: 0,
    totalOriginalAmount: 0,
    totalRemainingAmountCents: 0,
    totalRemainingAmount: 0,
    membersWithOutstandingDebtsCount: 0,
    outstandingDebtsCount: 0
};

const extractDebtsSummaryPayload = (payload) => {
    if (!payload) return null;
    if (payload?.data?.data) return payload.data.data;
    if (payload?.data && !Array.isArray(payload.data)) return payload.data;
    return payload;
};

const readAmount = (summary, amountKey, centsKey) => {
    if (!summary) return 0;
    if (summary[amountKey] !== undefined && summary[amountKey] !== null) return summary[amountKey];
    if (summary[centsKey] !== undefined && summary[centsKey] !== null) return Number(summary[centsKey]) / 100;
    return 0;
};

const buildDebtsSummaryParams = (filterMode, dateSingle, dateRange) => {
    if (filterMode === 'single' && dateSingle) {
        return { startDate: dateSingle, endDate: dateSingle };
    }
    if (filterMode === 'range' && dateRange.startDate && dateRange.endDate) {
        return { startDate: dateRange.startDate, endDate: dateRange.endDate };
    }
    return {};
};

const AccountingShift = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [debtsSummary, setDebtsSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [startingCash, setStartingCash] = useState('');
    const [actualEndingCash, setActualEndingCash] = useState('');

    // Filter states
    const [filterMode, setFilterMode] = useState('single'); // 'single' or 'range'
    const [dateSingle, setDateSingle] = useState(new Date().toISOString().split('T')[0]);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const fetchSummary = async () => {
        setIsLoading(true);
        try {
            const params = {};
            if (filterMode === 'single' && dateSingle) {
                params.date = dateSingle;
            } else if (filterMode === 'range' && dateRange.startDate && dateRange.endDate) {
                params.startDate = dateRange.startDate;
                params.endDate = dateRange.endDate;
            }
            const debtsSummaryParams = buildDebtsSummaryParams(filterMode, dateSingle, dateRange);

            const [dashboardResult, debtsResult] = await Promise.allSettled([
                accountingAPI.getDashboardSummary(params),
                debtsAPI.getSummary(debtsSummaryParams)
            ]);

            if (dashboardResult.status === 'fulfilled') {
                const dashboardData = dashboardResult.value?.data || dashboardResult.value;
                setSummaryData(dashboardData);
            } else {
                console.error('Failed to fetch accounting summary:', dashboardResult.reason);
                setSummaryData(null);
            }

            if (debtsResult.status === 'fulfilled') {
                setDebtsSummary(extractDebtsSummaryPayload(debtsResult.value));
            } else {
                console.error('Failed to fetch debts summary:', debtsResult.reason);
                setDebtsSummary(null);
            }
        } catch (error) {
            console.error('Failed to fetch accounting summary:', error);
            // Don't show an alert here necessarily, just show empty state
            setSummaryData(null);
            setDebtsSummary(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterMode, dateSingle, dateRange]);

    const handleOpenShift = async (e) => {
        e.preventDefault();
        if (!startingCash || Number(startingCash) < 0) {
            alert('الرجاء إدخال مبلغ صحيح للعهدة الافتتاحية');
            return;
        }
        setIsSubmitting(true);
        try {
            await accountingAPI.openShift(startingCash);
            setStartingCash('');
            fetchSummary();
        } catch (error) {
            alert(error.message || 'فشل فتح الوردية');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseShift = async (e) => {
        e.preventDefault();
        if (!actualEndingCash || Number(actualEndingCash) < 0) {
            alert('الرجاء إدخال عهدة الإغلاق الفعلية');
            return;
        }
        setIsSubmitting(true);
        try {
            await accountingAPI.closeShift(actualEndingCash);
            setActualEndingCash('');
            fetchSummary();
        } catch (error) {
            alert(error.message || 'فشل إغلاق الوردية');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper functions for formatting
    const parseDecimal = (val) => {
        if (val === null || val === undefined) return '0.00';
        return Number(val).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const visibleDebtsSummary = debtsSummary || summaryData?.debtsSummary || EMPTY_DEBTS_SUMMARY;
    const totalDebtPortfolio = readAmount(visibleDebtsSummary, 'totalOriginalAmount', 'totalOriginalAmountCents');
    const totalOutstandingDebt = readAmount(visibleDebtsSummary, 'totalRemainingAmount', 'totalRemainingAmountCents');

    return (
        <DashboardLayout>
            <div className="flex-between page-header mb-8">
                <header>
                    <h1 className="page-title">Summary & Shift</h1>
                    <p className="page-subtitle">Manage safe cash, open and close shifts, and daily financial summary.</p>
                </header>
                {/* Status Badge here */}
                {summaryData && (
                    <div className={`status-badge ${summaryData.hasOpenShift ? 'active' : 'inactive'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        {summaryData.hasOpenShift ? 'يوجد وردية مفتوحة' : 'لا يوجد وردية حالياً'}
                    </div>
                )}
            </div>

            {/* Filters Section */}
            <div className="glass-panel mb-6" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '0 0 auto' }} className="form-group mb-0">
                    <label className="form-label">طريقة التصفية</label>
                    <select
                        className="form-input"
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                        style={{ paddingLeft: '1rem', minWidth: '150px' }}
                    >
                        <option value="single">يوم محدد</option>
                        <option value="range">فترة زمنية</option>
                    </select>
                </div>

                {filterMode === 'single' ? (
                    <div style={{ flex: '1 1 200px' }}>
                        <Input
                            label="التاريخ"
                            type="date"
                            value={dateSingle}
                            onChange={(e) => setDateSingle(e.target.value)}
                        />
                    </div>
                ) : (
                    <>
                        <div style={{ flex: '1 1 200px' }}>
                            <Input
                                label="من تاريخ"
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <Input
                                label="إلى تاريخ"
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                    </>
                )}
            </div>

            {summaryData?.periodType && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>الفترة المعروضة:</span>
                    <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 12px' }}>
                        {summaryData.periodType === 'single_day' ? 'يوم واحد' : 'مدة زمنية'}
                        {summaryData.dateFrom && summaryData.dateTo ? ` (${new Date(summaryData.dateFrom).toLocaleDateString('en-GB')} - ${new Date(summaryData.dateTo).toLocaleDateString('en-GB')})` : ''}
                    </span>
                </div>
            )}

            {isLoading ? (
                <div className="glass-panel"><p>جاري التحميل...</p></div>
            ) : (
                <>
                    {/* Financial Summary Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ color: 'var(--accent-neon)', background: 'var(--accent-neon-light)' }}>
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="stat-label">إجمالي الدخل (Income)</h3>
                            <p className="stat-value">{parseDecimal(summaryData?.income)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>EGP</span></p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ color: '#ff3e3e', background: 'rgba(255, 62, 62, 0.1)' }}>
                                <TrendingDown size={24} />
                            </div>
                            <h3 className="stat-label">المصروفات (Expenses)</h3>
                            <p className="stat-value" style={{ color: '#fca5a5' }}>{parseDecimal(summaryData?.expenses)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>EGP</span></p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)' }}>
                                <Activity size={24} />
                            </div>
                            <h3 className="stat-label">الصافي (Net Profit)</h3>
                            <p className="stat-value" style={{ color: summaryData?.netProfit && Number(summaryData.netProfit) < 0 ? '#fca5a5' : '#38bdf8' }}>
                                {parseDecimal(summaryData?.netProfit)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>EGP</span>
                            </p>
                        </div>
                        <div className="stat-card" style={{ border: summaryData?.hasOpenShift ? '1px solid var(--accent-neon)' : '' }}>
                            <div className="stat-icon-wrapper" style={{ color: '#eab308', background: 'rgba(234, 179, 8, 0.1)' }}>
                                <Wallet size={24} />
                            </div>
                            <h3 className="stat-label">الدرج الحالي (Drawer Cash)</h3>
                            <p className="stat-value">
                                {summaryData?.currentDrawerCash !== null ? parseDecimal(summaryData?.currentDrawerCash) : '—'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>EGP</span>
                            </p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)' }}>
                                <Wallet size={24} />
                            </div>
                            <h3 className="stat-label">Debt Portfolio</h3>
                            <p className="stat-value">{parseDecimal(totalDebtPortfolio)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>EGP</span></p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.12)' }}>
                                <Wallet size={24} />
                            </div>
                            <h3 className="stat-label">Outstanding Debts</h3>
                            <p className="stat-value" style={{ color: '#fca5a5' }}>
                                {parseDecimal(totalOutstandingDebt)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>EGP</span>
                            </p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ color: 'var(--accent-neon)', background: 'var(--accent-neon-light)' }}>
                                <Wallet size={24} />
                            </div>
                            <h3 className="stat-label">Outstanding Members</h3>
                            <p className="stat-value">{visibleDebtsSummary.membersWithOutstandingDebtsCount || 0}</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)' }}>
                                <Wallet size={24} />
                            </div>
                            <h3 className="stat-label">Open Debt Records</h3>
                            <p className="stat-value">{visibleDebtsSummary.outstandingDebtsCount || 0}</p>
                        </div>
                    </div>

                    {/* Shift Management Section */}
                    <div className="glass-panel mt-6">
                        <h2 className="section-title mb-6" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={20} className="text-neon" /> إدارة الوردية
                        </h2>

                        {summaryData?.hasOpenShift ? (
                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--accent-neon-border)' }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>وردية حالية معلقة</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <div className="detail-card">
                                            <p className="detail-label">وقت الفتح</p>
                                            <p className="detail-value">{new Date(summaryData.currentShift.openedAt).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">عهدة البداية</p>
                                            <p className="detail-value">{parseDecimal(summaryData.currentShift.startingCash)} EGP</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label" style={{ color: '#38bdf8' }}>المتوقع في الدرج الآن</p>
                                            <p className="detail-value" style={{ color: '#38bdf8', fontSize: '1.2rem' }}>
                                                {parseDecimal(
                                                    Number(summaryData.currentShift.startingCash) +
                                                    Number(summaryData.income || 0) -
                                                    Number(summaryData.expenses || 0)
                                                )} EGP
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleCloseShift} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>إنهاء الوردية</h4>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                        لإغلاق الوردية، يرجى إدخال المبلغ الفعلي الموجود في الدرج حالياً. النظام سيقوم بحساب العجز أو الزيادة تلقائياً.
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <Input
                                                label="المبلغ الفعلي في الدرج (Actual Cash)"
                                                type="number"
                                                name="actualEndingCash"
                                                value={actualEndingCash}
                                                onChange={(e) => setActualEndingCash(e.target.value)}
                                                placeholder="أدخل المبلغ..."
                                                required
                                            />
                                        </div>
                                        <Button type="submit" disabled={isSubmitting} style={{ background: 'var(--bg-darker)', color: '#fca5a5', border: '1px solid #ef4444' }}>
                                            <LogOut size={16} style={{ marginRight: '8px' }} />
                                            {isSubmitting ? 'جاري الإغلاق...' : 'إغلاق الوردية'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>لا يوجد وردية مفتوحة الآن</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                    يجب فتح وردية جديدة قبل البدء بتسجيل المبيعات، الاشتراكات أو حركة الخزينة.
                                </p>

                                <form onSubmit={handleOpenShift} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>إنشاء وردية جديدة</h4>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <Input
                                                label="عهدة الدرج الافتتاحية (Starting Cash)"
                                                type="number"
                                                name="startingCash"
                                                value={startingCash}
                                                onChange={(e) => setStartingCash(e.target.value)}
                                                placeholder="مثال: 500"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" disabled={isSubmitting}>
                                            <LogIn size={16} style={{ marginRight: '8px' }} />
                                            {isSubmitting ? 'جاري الفتح...' : 'افتح الوردية'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </>
            )}
        </DashboardLayout>
    );
};

export default AccountingShift;
