import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Input from './Input';
import Button from './Button';

const DebtPaymentModal = ({ isOpen, onClose, onSubmit, debt, isLoading, isShiftOpen }) => {
    const [formData, setFormData] = useState({
        amount: '',
        type: 'cash',
        note: ''
    });

    useEffect(() => {
        if (!isOpen || !debt) return;

        setFormData({
            amount: debt.remainingAmount || debt.remainingAmountCents / 100 || '',
            type: 'cash',
            note: ''
        });
    }, [isOpen, debt]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (formData.type === 'cash' && !isShiftOpen) {
            return;
        }

        onSubmit(formData);
    };

    if (!isOpen || !debt) return null;

    const remainingAmount = debt.remainingAmount || (debt.remainingAmountCents / 100).toFixed(2);
    const needsOpenShift = formData.type === 'cash' && !isShiftOpen;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">Settle Debt</h2>
                    <button className="close-btn" onClick={onClose} type="button">
                        <X size={24} />
                    </button>
                </div>

                <div className="detail-card">
                    <h3 className="detail-section-title">Debt Summary</h3>
                    <div className="detail-row">
                        <span className="detail-label">Member</span>
                        <span className="detail-value">{debt.member?.name || '-'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Title</span>
                        <span className="detail-value">{debt.title}</span>
                    </div>
                    <div className="detail-row" style={{ borderBottom: 'none' }}>
                        <span className="detail-label">Remaining</span>
                        <span className="detail-value" style={{ color: '#fbbf24' }}>{remainingAmount} EGP</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <Input
                            label="Amount (EGP)"
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                        />

                        <div className="form-group">
                            <label className="form-label">Payment Type</label>
                            <select
                                className="form-input"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                style={{ paddingLeft: '1rem' }}
                            >
                                <option value="cash">Cash</option>
                                <option value="adjustment">Adjustment</option>
                            </select>
                        </div>

                        {needsOpenShift ? (
                            <div className="detail-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#fca5a5' }}>
                                    <AlertTriangle size={18} />
                                    <span>You need to open a shift before recording a cash payment.</span>
                                </div>
                            </div>
                        ) : null}

                        <div className="form-group">
                            <label className="form-label">Note</label>
                            <textarea
                                className="form-input"
                                name="note"
                                rows={3}
                                value={formData.note}
                                onChange={handleChange}
                                placeholder="Optional note"
                                style={{ paddingLeft: '1rem', paddingTop: '0.75rem', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <Button type="submit" disabled={isLoading || needsOpenShift} style={{ width: 'auto' }}>
                            {isLoading ? 'Saving...' : 'Confirm Payment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DebtPaymentModal;
