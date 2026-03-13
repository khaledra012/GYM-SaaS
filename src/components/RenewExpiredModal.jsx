import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { plansAPI } from '../utils/api';

const RenewExpiredModal = ({ isOpen, onClose, onSubmit, subscription, isLoading }) => {
    const [formData, setFormData] = useState({
        mode: 'same_plan',
        planId: '',
        type: 'time_based',
        durationInDays: '',
        totalSessions: '',
        pricePaid: '',
        totalPrice: '',
        startDate: '',
        notes: ''
    });
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loadingPlans, setLoadingPlans] = useState(false);

    useEffect(() => {
        if (!isOpen || !subscription) return;

        const canUseSamePlan = subscription.source === 'plan' && subscription.plan?.id;
        setFormData({
            mode: canUseSamePlan ? 'same_plan' : 'new_plan',
            planId: '',
            type: 'time_based',
            durationInDays: '',
            totalSessions: '',
            pricePaid: '',
            totalPrice: canUseSamePlan ? (subscription.plan?.price || '') : '',
            startDate: '',
            notes: ''
        });
        setSelectedPlan(null);

        if (!canUseSamePlan && plans.length === 0) {
            loadPlans();
        }
    }, [isOpen, subscription]);

    useEffect(() => {
        if (isOpen && formData.mode === 'new_plan' && plans.length === 0) {
            loadPlans();
        }
    }, [isOpen, formData.mode]);

    const loadPlans = async () => {
        setLoadingPlans(true);
        try {
            const plansData = await plansAPI.getPlans();
            const plansList = Array.isArray(plansData.data)
                ? plansData.data
                : Array.isArray(plansData.plans)
                    ? plansData.plans
                    : Array.isArray(plansData)
                        ? plansData
                        : [];
            setPlans(plansList);
        } catch (error) {
            console.error('Failed to load plans', error);
            setPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'planId') {
            const plan = plans.find((item) => item.id.toString() === value);
            setSelectedPlan(plan || null);
            if (plan && plan.price) {
                setFormData((prev) => ({ ...prev, pricePaid: plan.price, totalPrice: plan.price }));
            }
        }
    };

    const switchMode = (mode) => {
        if (mode === 'same_plan') {
            setFormData((prev) => ({
                ...prev,
                mode,
                planId: '',
                pricePaid: '',
                totalPrice: subscription?.plan?.price || ''
            }));
            return;
        }

        if (mode === 'new_plan') {
            setFormData((prev) => ({
                ...prev,
                mode,
                type: 'time_based',
                durationInDays: '',
                totalSessions: '',
                pricePaid: selectedPlan?.price || '',
                totalPrice: selectedPlan?.price || ''
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            mode: 'manual',
            planId: '',
            pricePaid: '',
            totalPrice: ''
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (Number(formData.pricePaid) < 0) {
            alert('Paid amount cannot be negative.');
            return;
        }

        onSubmit({ ...formData });
    };

    if (!isOpen || !subscription) return null;

    const canUseSamePlan = subscription.source === 'plan' && subscription.plan?.id;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">Renew Expired Subscription</h2>
                    <button className="close-btn" onClick={onClose} type="button">
                        <X size={24} />
                    </button>
                </div>

                <div className="detail-card">
                    <h3 className="detail-section-title">Expired Subscription</h3>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{subscription.member?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {subscription.source === 'plan' ? subscription.plan?.name : 'Manual subscription'}
                        {' '}· expired on{' '}
                        {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Renewal Mode</label>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.25rem', borderRadius: '8px' }}>
                                {canUseSamePlan ? (
                                    <button
                                        type="button"
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: formData.mode === 'same_plan' ? 'var(--accent-neon)' : 'transparent',
                                            color: formData.mode === 'same_plan' ? '#000' : 'var(--text-muted)',
                                            fontWeight: formData.mode === 'same_plan' ? '600' : '400',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => switchMode('same_plan')}
                                    >
                                        Same Plan
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: formData.mode === 'new_plan' ? 'var(--accent-neon)' : 'transparent',
                                        color: formData.mode === 'new_plan' ? '#000' : 'var(--text-muted)',
                                        fontWeight: formData.mode === 'new_plan' ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => switchMode('new_plan')}
                                >
                                    New Plan
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: formData.mode === 'manual' ? 'var(--accent-neon)' : 'transparent',
                                        color: formData.mode === 'manual' ? '#000' : 'var(--text-muted)',
                                        fontWeight: formData.mode === 'manual' ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => switchMode('manual')}
                                >
                                    Manual
                                </button>
                            </div>
                        </div>

                        {formData.mode === 'same_plan' ? (
                            <div style={{ padding: '1rem', background: 'var(--accent-neon-light)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--accent-neon-border)' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>
                                    The subscription will be renewed using the previous plan settings.
                                </p>
                            </div>
                        ) : null}

                        {formData.mode === 'new_plan' ? (
                            <div className="form-group">
                                <label className="form-label">Plan</label>
                                <select
                                    name="planId"
                                    className="form-input"
                                    value={formData.planId}
                                    onChange={handleChange}
                                    required={formData.mode === 'new_plan'}
                                    disabled={loadingPlans}
                                    style={{ paddingLeft: '1rem' }}
                                >
                                    <option value="">{loadingPlans ? 'Loading plans...' : 'Select a plan'}</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - {Number(plan.price).toLocaleString('en-EG')} EGP
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        {formData.mode === 'manual' ? (
                            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--card-border)' }}>
                                <div className="form-group">
                                    <label className="form-label">Subscription Type</label>
                                    <select
                                        name="type"
                                        className="form-input"
                                        value={formData.type}
                                        onChange={handleChange}
                                        style={{ paddingLeft: '1rem' }}
                                    >
                                        <option value="time_based">Time Based</option>
                                        <option value="session_based">Session Based</option>
                                    </select>
                                </div>

                                {formData.type === 'time_based' ? (
                                    <Input
                                        label="Duration (Days)"
                                        name="durationInDays"
                                        type="number"
                                        min="1"
                                        placeholder="Example: 30"
                                        value={formData.durationInDays}
                                        onChange={handleChange}
                                        required
                                    />
                                ) : (
                                    <Input
                                        label="Total Sessions"
                                        name="totalSessions"
                                        type="number"
                                        min="1"
                                        placeholder="Example: 12"
                                        value={formData.totalSessions}
                                        onChange={handleChange}
                                        required
                                    />
                                )}
                            </div>
                        ) : null}

                        <Input
                            label="Start Date (optional)"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                        />

                        <Input
                            label="Paid Amount (EGP)"
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
                            If total price is higher than paid amount, the remaining balance will be recorded as a debt.
                        </p>

                        <Input
                            label="Notes (Optional)"
                            name="notes"
                            type="text"
                            value={formData.notes}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <Button type="submit" disabled={isLoading || loadingPlans} style={{ width: 'auto' }}>
                            {isLoading ? 'Renewing...' : 'Renew Subscription'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RenewExpiredModal;
