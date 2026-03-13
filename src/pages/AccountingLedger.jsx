import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import TransactionModal, { TRANSACTION_CATEGORIES } from '../components/TransactionModal';
import { accountingAPI } from '../utils/api';
import { getTodayDateInCairo } from '../utils/date';

const getTodayDate = () => getTodayDateInCairo();

const AccountingLedger = () => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [filterMode, setFilterMode] = useState('single'); // 'single' or 'range'
    const [filters, setFilters] = useState({
        date: getTodayDate(),
        startDate: getTodayDate(),
        endDate: '',
        type: '',
        category: ''
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
            // Check shift status
            const shiftRes = await accountingAPI.getCurrentShift();
            const shiftData = shiftRes.data || shiftRes;
            setIsShiftOpen(!!shiftData);

            // Fetch transactions
            const txParams = {
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            };

            // Clean up parameters based on filter mode
            if (filterMode === 'single') {
                delete txParams.startDate;
                delete txParams.endDate;
                if (!txParams.date) delete txParams.date;
            } else {
                delete txParams.date;
                if (!txParams.startDate) delete txParams.startDate;
                if (!txParams.endDate) delete txParams.endDate;
            }

            const txRes = await accountingAPI.getTransactions(txParams);
            const txData = txRes.data || [];

            setTransactions(txData);
            if (txRes.summary) setSummary(txRes.summary);
            if (txRes.totalPages) {
                setPagination(prev => ({
                    ...prev,
                    total: txRes.total,
                    totalPages: txRes.totalPages
                }));
            }
        } catch (error) {
            console.error('Failed to fetch ledger data:', error);
            setTransactions([]);
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

    const handleAddTransaction = async (data) => {
        setIsSubmitting(true);
        try {
            await accountingAPI.addTransaction(data);
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.message || 'فشل تسجيل المعاملة');
        } finally {
            setIsSubmitting(false);
        }
    };

    const parseDecimal = (val) => {
        if (val === null || val === undefined) return '0.00';
        return Number(val).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getTypeBadge = (type) => {
        if (type === 'IN') return <span className="status-badge active" style={{ width: '60px', display: 'inline-block', textAlign: 'center' }}>وارد</span>;
        return <span className="status-badge rejected" style={{ width: '60px', display: 'inline-block', textAlign: 'center' }}>منصرف</span>;
    };

    const getSourceLabel = (source) => {
        switch (source) {
            case 'manual': return 'يدوي';
            case 'automated': return 'آلي (نظام)';
            case 'automated_reversal': return 'آلي (عكس/إلغاء)';
            default: return source;
        }
    };

    const sanitizeTransactionDescription = (description) => {
        if (!description) return '-';
        const text = String(description);
        if (!/refund|\u0645\u0631\u062a\u062c\u0639/i.test(text)) return text;
        return text.replace(/\s*(?:\u0631\u0642\u0645\s*)?#\s*\d+\b/gi, '').trim();
    };

    return (
        <DashboardLayout>
            <div className="flex-between page-header mb-8">
                <header>
                    <h1 className="page-title">Safe Ledger</h1>
                    <p className="page-subtitle">Track safe ledger and daily transactions (In/Out).</p>
                </header>
                {isShiftOpen && (
                    <Button onClick={() => setIsModalOpen(true)} style={{ width: 'auto', gap: '8px' }}>
                        <Plus size={20} />
                        إضافة معاملة يدوية
                    </Button>
                )}
            </div>

            {/* Filters Section */}
            <div className="glass-panel mb-6" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '0 0 auto' }} className="form-group mb-0">
                    <label className="form-label">طريقة التصفية</label>
                    <select
                        className="form-input"
                        value={filterMode}
                        onChange={(e) => {
                            const mode = e.target.value;
                            setFilterMode(mode);
                            if (mode === 'range') {
                                setFilters((prev) => ({ ...prev, startDate: prev.startDate || getTodayDate() }));
                            } else {
                                setFilters((prev) => ({ ...prev, date: prev.date || getTodayDate() }));
                            }
                            setPagination({ ...pagination, page: 1 });
                        }}
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
                            name="date"
                            value={filters.date}
                            onChange={handleFilterChange}
                        />
                    </div>
                ) : (
                    <>
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
                    </>
                )}
                <div style={{ flex: '1 1 200px' }} className="form-group mb-0">
                    <label className="form-label">النوع</label>
                    <select
                        name="type"
                        className="form-input"
                        value={filters.type}
                        onChange={handleFilterChange}
                        style={{ paddingLeft: '1rem' }}
                    >
                        <option value="">الكل</option>
                        <option value="IN">وارد</option>
                        <option value="OUT">منصرف</option>
                    </select>
                </div>
                <div style={{ flex: '1 1 200px' }} className="form-group mb-0">
                    <label className="form-label">التصنيف</label>
                    <select
                        name="category"
                        className="form-input"
                        value={filters.category}
                        onChange={handleFilterChange}
                        style={{ paddingLeft: '1rem' }}
                    >
                        <option value="">الكل</option>
                        {Object.entries(TRANSACTION_CATEGORIES).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <Button onClick={() => {
                        setFilterMode('single');
                        setFilters({ date: getTodayDate(), startDate: getTodayDate(), endDate: '', type: '', category: '' });
                        setPagination({ ...pagination, page: 1 });
                    }} style={{ width: 'auto', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}>
                        مسح الفلاتر
                    </Button>
                </div>
            </div>

            {/* Summary Row */}
            {summary && (
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)', flexWrap: 'wrap', alignItems: 'center' }}>
                    {summary.periodType && (
                        <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>الفترة:</span>
                            <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 8px', fontSize: '0.8rem' }}>
                                {summary.periodType === 'single_day' ? 'يوم واحد' : 'مدة زمنية'}
                                {summary.dateFrom && summary.dateTo ? ` (${new Date(summary.dateFrom).toLocaleDateString('en-GB')} - ${new Date(summary.dateTo).toLocaleDateString('en-GB')})` : ''}
                            </span>
                        </div>
                    )}
                    <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: '8px' }}>إجمالي الوارد:</span>
                        <span style={{ color: 'var(--accent-neon)', fontWeight: 'bold' }}>{parseDecimal(summary.totalIn)}</span>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: '8px' }}>إجمالي المنصرف:</span>
                        <span style={{ color: '#fca5a5', fontWeight: 'bold' }}>{parseDecimal(summary.totalOut)}</span>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: '8px' }}>الصافي:</span>
                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{parseDecimal(summary.net)}</span>
                    </div>
                </div>
            )}

            {/* Ledger Table */}
            <section className="glass-panel">
                <div className="table-container">
                    {isLoading ? (
                        <div className="empty-state">جاري تحميل المعاملات...</div>
                    ) : transactions.length > 0 ? (
                        <>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>رقم الحركة</th>
                                        <th>الوقت</th>
                                        <th>النوع</th>
                                        <th>المبلغ</th>
                                        <th>التصنيف</th>
                                        <th>المصدر</th>
                                        <th>الوصف</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td style={{ color: 'var(--text-muted)' }}>#{tx.displayNumber || tx.id}</td>
                                            <td>{new Date(tx.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>{getTypeBadge(tx.type)}</td>
                                            <td style={{ fontWeight: 'bold', color: tx.type === 'IN' ? 'var(--accent-neon)' : '#fca5a5' }}>
                                                {parseDecimal(tx.amount)}
                                            </td>
                                            <td>{TRANSACTION_CATEGORIES[tx.category] || tx.category}</td>
                                            <td>
                                                <span style={{ fontSize: '0.8rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                                    {getSourceLabel(tx.source)}
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sanitizeTransactionDescription(tx.description)}>
                                                {sanitizeTransactionDescription(tx.description)}
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
                            <p>لا يوجد معاملات مسجلة تطابق بحثك.</p>
                        </div>
                    )}
                </div>
            </section>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddTransaction}
                isLoading={isSubmitting}
            />
        </DashboardLayout>
    );
};

export default AccountingLedger;

