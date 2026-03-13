import React, { useEffect, useState } from 'react';
import { Eye, Filter, Plus, Wallet } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import DebtCreateModal from '../components/DebtCreateModal';
import DebtPaymentModal from '../components/DebtPaymentModal';
import DebtDetailsModal from '../components/DebtDetailsModal';
import { accountingAPI, debtsAPI } from '../utils/api';
import { getTodayDateInCairo } from '../utils/date';

const extractDebtRows = (response) => {
    if (Array.isArray(response?.data?.debts)) return response.data.debts;
    if (Array.isArray(response?.debts)) return response.debts;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data?.debts)) return response.data.data.debts;
    return [];
};

const extractPagination = (response) => {
    return response?.pagination
        || response?.data?.pagination
        || response?.meta?.pagination
        || response?.data?.meta?.pagination
        || null;
};

const extractSummary = (response) => response?.data?.data || response?.data || response || null;

const parseMoney = (value, centsValue) => {
    const rawValue =
        value !== undefined && value !== null && value !== ''
            ? value
            : (centsValue !== undefined && centsValue !== null ? Number(centsValue) / 100 : 0);
    const number = Number(rawValue || 0);
    return number.toLocaleString('en-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const toEgyptDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(date);
};

const resolveDebtDate = (debt) => {
    return toEgyptDate(debt?.createdAt) || debt?.localDate || '-';
};

const getTodayDate = () => {
    return getTodayDateInCairo();
};

const buildDateParams = (startDate, endDate) => {
    if (startDate && endDate) {
        return { startDate, endDate };
    }
    if (startDate) {
        return { date: startDate };
    }
    if (endDate) {
        return { date: endDate };
    }
    return {};
};

const buildSummaryDateParams = (startDate, endDate) => {
    if (startDate && endDate) {
        return { startDate, endDate };
    }
    if (startDate) {
        return { startDate, endDate: startDate };
    }
    if (endDate) {
        return { startDate: endDate, endDate };
    }
    return {};
};

const AccountingDebts = () => {
    const [debts, setDebts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        outstandingOnly: 'false',
        startDate: getTodayDate(),
        endDate: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        totalPages: 1
    });

    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filters, pagination.page]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const dateParams = buildDateParams(filters.startDate, filters.endDate);
            const summaryDateParams = buildSummaryDateParams(filters.startDate, filters.endDate);
            const [debtsResponse, summaryResponse, shiftResponse] = await Promise.all([
                debtsAPI.getDebts({
                    search: filters.search,
                    status: filters.status,
                    outstandingOnly: String(filters.outstandingOnly),
                    page: pagination.page,
                    limit: pagination.limit,
                    ...dateParams
                }),
                debtsAPI.getSummary(summaryDateParams).catch(() => null),
                accountingAPI.getCurrentShift().catch(() => null)
            ]);

            setDebts(extractDebtRows(debtsResponse));
            setSummary(extractSummary(summaryResponse));
            setIsShiftOpen(Boolean(shiftResponse?.data || shiftResponse));
            const paginationPayload = extractPagination(debtsResponse);
            setPagination((prev) => ({
                ...prev,
                totalPages: debtsResponse?.totalPages
                    || paginationPayload?.totalPages
                    || paginationPayload?.pages
                    || 1
            }));
        } catch (error) {
            console.error('Failed to fetch debts module data:', error);
            setDebts([]);
            setSummary(null);
            setIsShiftOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setPagination((prev) => ({ ...prev, page: 1 }));
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setFilters((prev) => ({ ...prev, search: searchInput }));
    };

    const handleSearchKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    const handleCreateDebt = async (payload) => {
        setIsSubmitting(true);
        try {
            await debtsAPI.createDebt(payload);
            setIsCreateModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.message || 'Failed to create debt.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePayDebt = async (payload) => {
        if (!selectedDebt) return;

        setIsSubmitting(true);
        try {
            await debtsAPI.addPayment(selectedDebt.id, payload);
            setIsPaymentModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.message || 'Failed to record payment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openPaymentModal = (debt) => {
        setSelectedDebt(debt);
        setIsDetailsModalOpen(false);
        setIsPaymentModalOpen(true);
    };

    const openDetailsModal = (debt) => {
        setSelectedDebt(debt);
        setIsDetailsModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="flex-between page-header mb-8">
                <header>
                    <h1 className="page-title">Debts</h1>
                    <p className="page-subtitle">Track member balances, payments, and debt adjustments.</p>
                </header>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${isShiftOpen ? 'active' : 'inactive'}`}>
                        {isShiftOpen ? 'Shift Open' : 'Shift Closed'}
                    </span>
                    <Button onClick={() => setIsCreateModalOpen(true)} style={{ width: 'auto', gap: '8px' }}>
                        <Plus size={18} />
                        Add Debt
                    </Button>
                </div>
            </div>

            {summary ? (
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)' }}>
                            <Wallet size={24} />
                        </div>
                        <h3 className="stat-label">Total Debts</h3>
                        <p className="stat-value">{parseMoney(summary.totalOriginalAmount, summary.totalOriginalAmountCents)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>EGP</span></p>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper" style={{ color: 'var(--accent-neon)', background: 'var(--accent-neon-light)' }}>
                            <Wallet size={24} />
                        </div>
                        <h3 className="stat-label">Collected</h3>
                        <p className="stat-value">{parseMoney(summary.totalPaidAmount, summary.totalPaidAmountCents)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>EGP</span></p>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper" style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.12)' }}>
                            <Wallet size={24} />
                        </div>
                        <h3 className="stat-label">Outstanding</h3>
                        <p className="stat-value" style={{ color: '#fca5a5' }}>{parseMoney(summary.totalRemainingAmount, summary.totalRemainingAmountCents)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>EGP</span></p>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)' }}>
                            <Wallet size={24} />
                        </div>
                        <h3 className="stat-label">Members with Outstanding</h3>
                        <p className="stat-value">{summary.membersWithOutstandingDebtsCount || 0}</p>
                    </div>
                </div>
            ) : null}

            <section className="glass-panel">
                <div className="flex-between mb-6" style={{ gap: '1rem' }}>
                    <div className="search-wrapper" style={{ flexGrow: 1, position: 'relative', display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flexGrow: 1 }}>
                            <Input
                                placeholder="Search by member, title, phone..."
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                        </div>
                        <Button onClick={handleSearch} style={{ width: 'auto', padding: '0 1.5rem' }}>
                            Search
                        </Button>
                    </div>

                    <div className="filter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Filter size={18} color="var(--text-muted)" />
                        <select
                            className="form-input"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            style={{ width: '160px', paddingLeft: '1rem' }}
                        >
                            <option value="">All Statuses</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partially_paid">Partially Paid</option>
                            <option value="paid">Paid</option>
                        </select>
                        <select
                            className="form-input"
                            name="outstandingOnly"
                            value={filters.outstandingOnly}
                            onChange={handleFilterChange}
                            style={{ width: '180px', paddingLeft: '1rem' }}
                        >
                            <option value="true">Outstanding Only</option>
                            <option value="false">All Debts</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <Input
                        label="Start Date"
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                    />
                    <Input
                        label="End Date"
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                    />
                </div>

                {filters.outstandingOnly === 'true' ? (
                    <div
                        style={{
                            marginBottom: '1rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(251, 191, 36, 0.2)',
                            background: 'rgba(251, 191, 36, 0.08)',
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem'
                        }}
                    >
                        Showing only debts with remaining balances. If a subscription debt was settled, cancelled, or refunded, switch the filter to "All Debts".
                    </div>
                ) : null}

                <div className="table-container">
                    {isLoading ? (
                        <div className="empty-state">Loading debts...</div>
                    ) : debts.length > 0 ? (
                        <>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Source</th>
                                        <th>Title</th>
                                        <th>Original</th>
                                        <th>Paid</th>
                                        <th>Remaining</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Payments</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {debts.map((debt) => (
                                        <tr key={debt.id}>
                                            <td>
                                                <div style={{ fontWeight: '600' }}>{debt.member?.name || '-'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{debt.member?.phone || debt.member?.code || '-'}</div>
                                            </td>
                                            <td>{debt.sourceLabel || debt.source || '-'}</td>
                                            <td>{debt.title}</td>
                                            <td>{parseMoney(debt.originalAmount)} EGP</td>
                                            <td style={{ color: 'var(--accent-neon)', fontWeight: '700' }}>{parseMoney(debt.paidAmount)} EGP</td>
                                            <td style={{ color: '#fbbf24', fontWeight: '700' }}>{parseMoney(debt.remainingAmount)} EGP</td>
                                            <td>
                                                <span className={`status-badge ${debt.status}`}>
                                                    {debt.statusLabel || debt.status}
                                                </span>
                                            </td>
                                            <td>{resolveDebtDate(debt)}</td>
                                            <td>{debt.paymentsCount || 0}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="btn-icon" type="button" title="Details" onClick={() => openDetailsModal(debt)}>
                                                        <Eye size={16} />
                                                    </button>
                                                    {debt.canSettle && debt.status !== 'paid' ? (
                                                        <button className="btn-icon renew" type="button" title="Settle" onClick={() => openPaymentModal(debt)}>
                                                            <Wallet size={16} />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {pagination.totalPages > 1 ? (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem 0' }}>
                                    <button
                                        type="button"
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? 0.5 : 1 }}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page === pagination.totalPages ? 0.5 : 1 }}
                                    >
                                        Next
                                    </button>
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>No debts found for the current filters.</p>
                        </div>
                    )}
                </div>
            </section>

            <DebtCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateDebt}
                isLoading={isSubmitting}
            />

            <DebtPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSubmit={handlePayDebt}
                debt={selectedDebt}
                isLoading={isSubmitting}
                isShiftOpen={isShiftOpen}
            />

            <DebtDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                debt={selectedDebt}
                onPay={openPaymentModal}
            />
        </DashboardLayout>
    );
};

export default AccountingDebts;
