import React, { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import Input from './Input';
import Button from './Button';

const SubscriptionRefundModal = ({ isOpen, onClose, onSubmit, subscription, isLoading, isShiftOpen }) => {
    const [formData, setFormData] = useState({
        refundAmount: '',
        note: ''
    });

    useEffect(() => {
        if (!isOpen || !subscription) return;

        setFormData({
            refundAmount: subscription.pricePaid || '',
            note: ''
        });
    }, [isOpen, subscription]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isShiftOpen) return;
        onSubmit(formData);
    };

    if (!isOpen || !subscription) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">Subscription Refund</h2>
                    <button className="close-btn" onClick={onClose} type="button">
                        <X size={24} />
                    </button>
                </div>

                <div className="detail-card">
                    <h3 className="detail-section-title">Refund Summary</h3>
                    <div className="detail-row">
                        <span className="detail-label">Member</span>
                        <span className="detail-value">{subscription.member?.name || '-'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Subscription</span>
                        <span className="detail-value">{subscription.plan?.name || 'Manual subscription'}</span>
                    </div>
                    <div className="detail-row" style={{ borderBottom: 'none' }}>
                        <span className="detail-label">Paid Amount</span>
                        <span className="detail-value" style={{ color: 'var(--accent-neon)' }}>
                            {Number(subscription.pricePaid || 0).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <Input
                            label="Refund Amount (EGP)"
                            name="refundAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.refundAmount}
                            onChange={handleChange}
                            required
                        />

                        {!isShiftOpen ? (
                            <div className="detail-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
                                    <AlertTriangle size={18} />
                                    <span>You need an open shift before creating a refund.</span>
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
                                placeholder="Reason for refund"
                                style={{ paddingLeft: '1rem', paddingTop: '0.75rem', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <Button type="submit" disabled={isLoading || !isShiftOpen} style={{ width: 'auto', gap: '8px' }}>
                            <RotateCcw size={16} />
                            {isLoading ? 'Processing...' : 'Confirm Refund'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubscriptionRefundModal;
