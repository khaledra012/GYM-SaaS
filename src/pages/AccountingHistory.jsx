import React, { useState, useEffect } from 'react';
import { History, Calendar } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { accountingAPI } from '../utils/api';

const AccountingHistory = () => {
    const [shifts, setShifts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        startDate: today,
        endDate: today,
        status: 'closed' // Default to viewing closed shifts history
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await accountingAPI.getShiftsHistory({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            });
            const data = res.data || [];

            setShifts(data);
            if (res.totalPages) {
                setPagination(prev => ({
                    ...prev,
                    total: res.total,
                    totalPages: res.totalPages
                }));
            }
        } catch (error) {
            console.error('Failed to fetch shift history:', error);
            // If the endpoint doesn't exist yet, we'll swallow the visual error to avoid breaking the UI right away
            // and simply show an empty state.
            setShifts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, pagination.page]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPagination({ ...pagination, page: 1 }); // Reset page on filter change
    };

    const parseDecimal = (val) => {
        if (val === null || val === undefined) return '0.00';
        return Number(val).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getStatusBadge = (status) => {
        if (status === 'open') return <span className="status-badge active">مفتوحة</span>;
        return <span className="status-badge inactive" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-main)' }}>مغلقة</span>;
    };

    return (
        <DashboardLayout>
            <div className="flex-between page-header mb-8">
                <header>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <History size={28} className="text-neon" /> أرشيف الورديات
                    </h1>
                    <p className="page-subtitle">مراجعة الورديات السابقة والعجز/الزيادة في كل وردية مقفولة.</p>
                </header>
            </div>

            {/* Filters Section */}
            <div className="glass-panel mb-6" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <Input
                        label="من تاريخ"
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                    />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <Input
                        label="إلى تاريخ"
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                    />
                </div>
                <div style={{ flex: '1 1 150px' }} className="form-group mb-0">
                    <label className="form-label">حالة الوردية</label>
                    <select
                        name="status"
                        className="form-input"
                        value={filters.status}
                        onChange={handleFilterChange}
                        style={{ paddingLeft: '1rem' }}
                    >
                        <option value="">الكل</option>
                        <option value="closed">مغلقة</option>
                        <option value="open">مفتوحة</option>
                    </select>
                </div>
                <div>
                    <Button onClick={() => {
                        setFilters({ startDate: today, endDate: today, status: 'closed' });
                        setPagination({ ...pagination, page: 1 });
                    }} style={{ width: 'auto', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}>
                        مسح الفلاتر
                    </Button>
                </div>
            </div>

            {/* History Table */}
            <section className="glass-panel">
                <div className="table-container">
                    {isLoading ? (
                        <div className="empty-state">جاري تحميل الأرشيف...</div>
                    ) : shifts.length > 0 ? (
                        <>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>رقم الوردية</th>
                                        <th>التاريخ</th>
                                        <th>الحالة</th>
                                        <th>وقت الفتح</th>
                                        <th>وقت الإغلاق</th>
                                        <th>عهدة البداية</th>
                                        <th>المتوقع</th>
                                        <th>الفعلي</th>
                                        <th>العجز/الزيادة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shifts.map((shift) => (
                                        <tr key={shift.id}>
                                            <td style={{ color: 'var(--text-muted)' }}>#{shift.displayNumber || shift.id}</td>
                                            <td>{shift.localDate || new Date(shift.openedAt).toLocaleDateString()}</td>
                                            <td>{getStatusBadge(shift.status)}</td>
                                            <td>{new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>{shift.closedAt ? new Date(shift.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                            <td>{parseDecimal(shift.startingCash)}</td>
                                            <td style={{ color: '#38bdf8' }}>{shift.expectedEndingCash ? parseDecimal(shift.expectedEndingCash) : '—'}</td>
                                            <td style={{ fontWeight: 'bold' }}>{shift.actualEndingCash ? parseDecimal(shift.actualEndingCash) : '—'}</td>

                                            <td style={{
                                                fontWeight: 'bold',
                                                color: shift.discrepancy === null
                                                    ? 'var(--text-muted)'
                                                    : Number(shift.discrepancy) < 0
                                                        ? '#fca5a5' // Red for negative (Deficit)
                                                        : Number(shift.discrepancy) > 0
                                                            ? 'var(--accent-neon)' // Green for positive (Surplus)
                                                            : 'var(--text-main)' // Neutral for perfect match
                                            }}>
                                                {shift.discrepancy === null ? '—' : parseDecimal(shift.discrepancy)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem 0' }}>
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? 0.5 : 1 }}
                                    >
                                        السابق
                                    </button>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                        صفحة {pagination.page} من {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page === pagination.totalPages ? 0.5 : 1 }}
                                    >
                                        التالي
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>لا توجد ورديات سابقة تطابق بحثك أو قد يكون هذا المسار غير مُبرمج في الباك-إند بعد.</p>
                        </div>
                    )}
                </div>
            </section>
        </DashboardLayout>
    );
};

export default AccountingHistory;
