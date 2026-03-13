import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { membersAPI, plansAPI } from '../utils/api';

const extractMemberRows = (response) => {
    if (Array.isArray(response?.data?.members)) return response.data.members;
    if (Array.isArray(response?.members)) return response.members;
    if (Array.isArray(response?.data?.data?.members)) return response.data.data.members;
    return [];
};

const SubscriptionModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        memberId: '',
        source: 'plan', // 'plan' or 'manual'
        planId: '',
        type: 'time_based', // for manual
        durationInDays: '', // for manual time_based
        totalSessions: '', // for manual session_based
        startDate: new Date().toISOString().split('T')[0],
        pricePaid: '',
        totalPrice: '',
        notes: ''
    });

    const [isNewMember, setIsNewMember] = useState(false);
    const [newMemberData, setNewMemberData] = useState({
        name: '',
        phone: '',
        gender: 'male',
        status: 'active'
    });

    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                memberId: '',
                source: 'plan',
                planId: '',
                type: 'time_based',
                durationInDays: '',
                totalSessions: '',
                startDate: new Date().toISOString().split('T')[0],
                pricePaid: '',
                totalPrice: '',
                notes: ''
            });
            setIsNewMember(false);
            setNewMemberData({
                name: '',
                phone: '',
                gender: 'male',
                status: 'active'
            });
            setSelectedPlan(null);
            setLoadError('');
            loadDropdownData();
        }
    }, [isOpen]);

    const loadDropdownData = async () => {
        setLoadingData(true);
        try {
            const [membersData, plansData] = await Promise.all([
                membersAPI.getMembers({ page: 1, limit: 200 }),
                plansAPI.getPlans()
            ]);
            setMembers(extractMemberRows(membersData));
            const plansList = Array.isArray(plansData.data) ? plansData.data
                : Array.isArray(plansData.plans) ? plansData.plans
                    : Array.isArray(plansData) ? plansData
                        : [];
            setPlans(plansList);
            setLoadError('');
        } catch (error) {
            console.error('Failed to load subscription modal data:', error);
            setMembers([]);
            setPlans([]);
            setLoadError(error.message || 'Failed to load members or plans.');
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'planId') {
            const plan = plans.find(p => p.id.toString() === value);
            setSelectedPlan(plan || null);
            if (plan && plan.price) {
                setFormData(prev => ({ ...prev, pricePaid: plan.price, totalPrice: plan.price }));
            }
        }
    };

    const handleNewMemberChange = (e) => {
        const { name, value } = e.target;
        setNewMemberData(prev => ({ ...prev, [name]: value }));
    };

    const getEndDate = () => {
        if (!formData.startDate) return '';

        if (formData.source === 'plan') {
            if (!selectedPlan) return '';
            if (selectedPlan.type === 'session_based') return 'Based on sessions';
            const start = new Date(formData.startDate);
            start.setDate(start.getDate() + (selectedPlan.durationInDays || 0));
            return start.toLocaleDateString();
        } else {
            if (formData.type === 'session_based') return 'Based on sessions';
            if (!formData.durationInDays) return '';
            const start = new Date(formData.startDate);
            start.setDate(start.getDate() + Number(formData.durationInDays));
            return start.toLocaleDateString();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isNewMember) {
            // Include both member info and subscription info
            onSubmit({
                isNewMember: true,
                memberData: {
                    ...newMemberData,
                    membershipStart: formData.startDate // typically matches sub start
                },
                subscriptionData: formData
            });
        } else {
            onSubmit({
                isNewMember: false,
                subscriptionData: formData
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">New Subscription</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Member Selection Toggle */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem', borderRadius: '12px' }}>
                            <button
                                type="button"
                                style={{
                                    flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                                    background: !isNewMember ? 'var(--accent-neon)' : 'transparent',
                                    color: !isNewMember ? '#000' : 'var(--text-muted)',
                                    fontWeight: !isNewMember ? '600' : '400',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onClick={() => setIsNewMember(false)}
                            >
                                Existing Member
                            </button>
                            <button
                                type="button"
                                style={{
                                    flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                                    background: isNewMember ? 'var(--accent-neon)' : 'transparent',
                                    color: isNewMember ? '#000' : 'var(--text-muted)',
                                    fontWeight: isNewMember ? '600' : '400',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onClick={() => setIsNewMember(true)}
                            >
                                New Member
                            </button>
                        </div>

                        {!isNewMember ? (
                            /* Member Dropdown */
                            <div className="form-group">
                                <label className="form-label">Select Member</label>
                                <select
                                    name="memberId"
                                    className="form-input"
                                    value={formData.memberId}
                                    onChange={handleChange}
                                    required={!isNewMember}
                                    disabled={loadingData || members.length === 0}
                                    style={{ paddingLeft: '1rem' }}
                                >
                                    <option value="">
                                        {loadingData ? 'Loading members...' : members.length === 0 ? 'No members available' : 'Select a member'}
                                    </option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} — {m.phone}
                                        </option>
                                    ))}
                                </select>
                                {!loadingData && members.length === 0 ? (
                                    <p style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        {loadError || 'No members were returned from the backend.'}
                                    </p>
                                ) : null}
                            </div>
                        ) : (
                            /* New Member Fields */
                            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--card-border)' }}>
                                <h3 className="detail-section-title" style={{ marginBottom: '1rem' }}>New Member Details</h3>
                                <Input
                                    label="Full Name"
                                    name="name"
                                    placeholder="e.g. Mostafa Ahmed"
                                    value={newMemberData.name}
                                    onChange={handleNewMemberChange}
                                    required={isNewMember}
                                />
                                <Input
                                    label="Phone Number"
                                    name="phone"
                                    placeholder="e.g. 01012345678"
                                    value={newMemberData.phone}
                                    onChange={handleNewMemberChange}
                                    required={isNewMember}
                                />
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select
                                        name="gender"
                                        className="form-input"
                                        value={newMemberData.gender}
                                        onChange={handleNewMemberChange}
                                        style={{ paddingLeft: '1rem' }}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Source Toggle */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Subscription Source</label>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.25rem', borderRadius: '8px' }}>
                                <button
                                    type="button"
                                    style={{
                                        flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none',
                                        background: formData.source === 'plan' ? 'var(--accent-neon)' : 'transparent',
                                        color: formData.source === 'plan' ? '#000' : 'var(--text-muted)',
                                        fontWeight: formData.source === 'plan' ? '600' : '400',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onClick={() => setFormData(p => ({ ...p, source: 'plan', pricePaid: selectedPlan?.price || '', totalPrice: selectedPlan?.price || '' }))}
                                >
                                    From Plan
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none',
                                        background: formData.source === 'manual' ? 'var(--accent-neon)' : 'transparent',
                                        color: formData.source === 'manual' ? '#000' : 'var(--text-muted)',
                                        fontWeight: formData.source === 'manual' ? '600' : '400',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onClick={() => setFormData(p => ({ ...p, source: 'manual', pricePaid: '', totalPrice: '' }))}
                                >
                                    Manual Entry
                                </button>
                            </div>
                        </div>

                        {formData.source === 'plan' ? (
                            /* Plan Dropdown */
                            <div className="form-group">
                                <label className="form-label">Plan</label>
                                <select
                                    name="planId"
                                    className="form-input"
                                    value={formData.planId}
                                    onChange={handleChange}
                                    required={formData.source === 'plan'}
                                    disabled={loadingData || plans.length === 0}
                                    style={{ paddingLeft: '1rem' }}
                                >
                                    <option value="">
                                        {loadingData ? 'Loading plans...' : plans.length === 0 ? 'No plans available' : 'Select a plan'}
                                    </option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} — {Number(p.price).toLocaleString('en-EG')} EGP
                                        </option>
                                    ))}
                                </select>
                                {!loadingData && plans.length === 0 ? (
                                    <p style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        {loadError || 'No plans were returned from the backend.'}
                                    </p>
                                ) : null}
                            </div>
                        ) : (
                            /* Manual Entry Fields */
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
                                        <option value="time_based">Time-Based (Days)</option>
                                        <option value="session_based">Session-Based (Count)</option>
                                    </select>
                                </div>

                                {formData.type === 'time_based' ? (
                                    <Input
                                        label="Duration (Days)"
                                        name="durationInDays"
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 30"
                                        value={formData.durationInDays}
                                        onChange={handleChange}
                                        required={formData.source === 'manual' && formData.type === 'time_based'}
                                    />
                                ) : (
                                    <Input
                                        label="Total Sessions"
                                        name="totalSessions"
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 12"
                                        value={formData.totalSessions}
                                        onChange={handleChange}
                                        required={formData.source === 'manual' && formData.type === 'session_based'}
                                    />
                                )}
                            </div>
                        )}

                        {/* Start Date */}
                        <Input
                            label="Start Date"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />

                        {/* Price Paid */}
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
                            If total price is higher than paid amount, a debt record will be created automatically.
                        </p>

                        {/* Notes */}
                        <Input
                            label="Notes (Optional)"
                            name="notes"
                            type="text"
                            value={formData.notes}
                            onChange={handleChange}
                        />

                        {/* Auto-calculated end date preview */}
                        {((formData.source === 'plan' && selectedPlan) || (formData.source === 'manual' && formData.type === 'time_based' && formData.durationInDays)) && (
                            <div className="form-group">
                                <label className="form-label">End Date (Auto-calculated)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={getEndDate()}
                                    disabled
                                    readOnly
                                    style={{
                                        paddingLeft: '1rem',
                                        opacity: 0.6,
                                        cursor: 'not-allowed'
                                    }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                    {formData.source === 'plan'
                                        ? (selectedPlan.type === 'time_based' ? `${selectedPlan.durationInDays} days from start date` : `${selectedPlan.sessionCount} sessions`)
                                        : `${formData.durationInDays} days from start date`
                                    }
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <Button type="submit" disabled={isLoading || loadingData} style={{ width: 'auto' }}>
                            {isLoading ? 'Creating...' : 'Create Subscription'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubscriptionModal;
