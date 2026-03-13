import React, { useEffect, useState } from 'react';
import { Clock3, Receipt, Wallet, X } from 'lucide-react';
import Button from './Button';
import { debtsAPI } from '../utils/api';

const extractDebtPayload = (response, fallbackDebt) => {
    if (!response) return fallbackDebt;
    return response.data || response.debt || response;
};

const getPayments = (payload) => {
    if (Array.isArray(payload?.payments)) return payload.payments;
    if (Array.isArray(payload?.paymentHistory)) return payload.paymentHistory;
    if (Array.isArray(payload?.data?.payments)) return payload.data.payments;
    return [];
};

const toEgyptDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(date);
};

const resolveDate = (item) => {
    return toEgyptDate(item?.createdAt) || item?.localDate || '-';
};

const DebtDetailsModal = ({ isOpen, onClose, debt, onPay }) => {
    const [details, setDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !debt) return;
        loadDebtDetails();
    }, [isOpen, debt]);

    const loadDebtDetails = async () => {
        setIsLoading(true);
        try {
            const response = await debtsAPI.getDebt(debt.id);
            setDetails(extractDebtPayload(response, debt));
        } catch (error) {
            console.error('Failed to load debt details:', error);
            setDetails(debt);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !debt) return null;

    const payload = details || debt;
    const payments = getPayments(payload);
    const canSettle = payload.canSettle !== false && payload.status !== 'paid';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content wide" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">Debt Details</h2>
                    <button className="close-btn" onClick={onClose} type="button">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="detail-card">
                        <h3 className="detail-section-title">Overview</h3>
                        <div className="detail-row">
                            <span className="detail-label">Member</span>
                            <span className="detail-value">{payload.member?.name || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Source</span>
                            <span className="detail-value">{payload.sourceLabel || payload.source || '-'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Title</span>
                            <span className="detail-value">{payload.title}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Created On</span>
                            <span className="detail-value">{resolveDate(payload)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Status</span>
                            <span className={`status-badge ${payload.status}`}>{payload.statusLabel || payload.status}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Original Amount</span>
                            <span className="detail-value">{payload.originalAmount || (payload.originalAmountCents / 100).toFixed(2)} EGP</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Paid</span>
                            <span className="detail-value" style={{ color: 'var(--accent-neon)' }}>
                                {payload.paidAmount || (payload.paidAmountCents / 100).toFixed(2)} EGP
                            </span>
                        </div>
                        <div className="detail-row" style={{ borderBottom: 'none' }}>
                            <span className="detail-label">Remaining</span>
                            <span className="detail-value" style={{ color: '#fbbf24' }}>
                                {payload.remainingAmount || (payload.remainingAmountCents / 100).toFixed(2)} EGP
                            </span>
                        </div>
                    </div>

                    {payload.note ? (
                        <div className="detail-card">
                            <h3 className="detail-section-title">Note</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{payload.note}</p>
                        </div>
                    ) : null}

                    <div className="detail-card">
                        <div className="flex-between" style={{ gap: '1rem', marginBottom: '1rem' }}>
                            <h3 className="detail-section-title" style={{ marginBottom: 0 }}>Payment History</h3>
                            {canSettle && onPay ? (
                                <Button type="button" onClick={() => onPay(payload)} style={{ width: 'auto', gap: '8px' }}>
                                    <Wallet size={16} />
                                    Settle
                                </Button>
                            ) : null}
                        </div>

                        {isLoading ? (
                            <p style={{ color: 'var(--text-muted)' }}>Loading payment history...</p>
                        ) : payments.length > 0 ? (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Amount</th>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td style={{ fontWeight: '700' }}>
                                                    {payment.amount || (payment.amountCents / 100).toFixed(2)} EGP
                                                </td>
                                                <td>
                                                    <span
                                                        className={`status-badge ${payment.type === 'cash' ? 'active' : 'pending'}`}
                                                        style={{ textTransform: 'uppercase' }}
                                                    >
                                                        {payment.type}
                                                    </span>
                                                </td>
                                                <td>{resolveDate(payment)}</td>
                                                <td>{payment.note || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                                <Receipt size={18} />
                                <p>No payments recorded for this debt yet.</p>
                            </div>
                        )}
                    </div>

                    <div className="detail-card" style={{ marginBottom: 0 }}>
                        <h3 className="detail-section-title">Quick Facts</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <Clock3 size={18} color="#38bdf8" />
                                <span style={{ color: 'var(--text-muted)' }}>Payments count: {payload.paymentsCount || payments.length}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <Receipt size={18} color="#fbbf24" />
                                <span style={{ color: 'var(--text-muted)' }}>Reference: {payload.referenceType || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-text" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DebtDetailsModal;
