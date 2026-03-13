import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Button from './Button';

const RenewModal = ({ isOpen, onClose, onSubmit, subscription, isLoading }) => {
    const [formData, setFormData] = useState({
        extraDays: '',
        extraSessions: '',
        pricePaid: '',
        totalPrice: ''
    });

    const subscriptionType = subscription?.plan?.type || subscription?.type;

    useEffect(() => {
        if (isOpen && subscription) {
            setFormData({
                extraDays: '',
                extraSessions: '',
                pricePaid: '',
                totalPrice: subscription?.plan?.price || subscription?.totalPrice || subscription?.pricePaid || ''
            });
        }
    }, [isOpen, subscription]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getNewEndDate = () => {
        if (!subscription || !subscription.endDate || formData.extraDays === '') return '';
        const currentEnd = new Date(subscription.endDate);
        currentEnd.setDate(currentEnd.getDate() + parseInt(formData.extraDays || 0, 10));
        return currentEnd.toLocaleDateString();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prepare payload based on plan type
        const payload = {
            pricePaid: Number(formData.pricePaid)
        };

        if (formData.totalPrice !== '') {
            payload.totalPrice = Number(formData.totalPrice);
        }

        if (subscriptionType === 'time_based') {
            payload.extraDays = Number(formData.extraDays);
        } else if (subscriptionType === 'session_based') {
            payload.extraSessions = Number(formData.extraSessions);
        }

        onSubmit(payload);
    };

    if (!isOpen || !subscription) return null;

    const isTimeBased = subscriptionType === 'time_based';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">Renew Subscription</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Current subscription summary */}
                <div className="detail-card">
                    <h3 className="detail-section-title">Current Subscription</h3>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {subscription.member?.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {subscription.plan?.name} · {isTimeBased ? `Ends ${new Date(subscription.endDate).toLocaleDateString()}` : `${subscription.remainingSessions} Sessions Left`}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {isTimeBased ? (
                            <>
                                <Input
                                    label="Extra Days"
                                    name="extraDays"
                                    type="number"
                                    min="1"
                                    value={formData.extraDays}
                                    onChange={handleChange}
                                    required
                                />
                                {formData.extraDays && (
                                    <div className="form-group">
                                        <label className="form-label">New Expected End Date</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={getNewEndDate()}
                                            disabled
                                            readOnly
                                            style={{
                                                paddingLeft: '1rem',
                                                opacity: 0.6,
                                                cursor: 'not-allowed'
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <Input
                                label="Extra Sessions"
                                name="extraSessions"
                                type="number"
                                min="1"
                                value={formData.extraSessions}
                                onChange={handleChange}
                                required
                            />
                        )}

                        <Input
                            label="Price Paid (EGP)"
                            name="pricePaid"
                            type="number"
                            min="0"
                            value={formData.pricePaid}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Total Price (EGP)"
                            name="totalPrice"
                            type="number"
                            min="0"
                            value={formData.totalPrice}
                            onChange={handleChange}
                        />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            If total price is higher than paid amount, the remaining balance will be added as a debt.
                        </p>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <Button type="submit" disabled={isLoading} style={{ width: 'auto' }}>
                            {isLoading ? 'Renewing...' : 'Renew Subscription'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RenewModal;
