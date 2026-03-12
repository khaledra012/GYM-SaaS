import React, { useState, useEffect } from 'react';
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
        startDate: '',
        notes: ''
    });

    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loadingPlans, setLoadingPlans] = useState(false);

    useEffect(() => {
        if (isOpen && subscription) {
            // Check if same_plan is viable initially
            const canUseSamePlan = subscription.source === 'plan' && subscription.plan?.id;

            setFormData({
                mode: canUseSamePlan ? 'same_plan' : 'new_plan',
                planId: '',
                type: 'time_based',
                durationInDays: '',
                totalSessions: '',
                pricePaid: '',
                startDate: '',
                notes: ''
            });
            setSelectedPlan(null);

            if (!canUseSamePlan && plans.length === 0) {
                loadPlans();
            }
        }
    }, [isOpen, subscription]);

    // Load plans if user switches to new_plan or if same_plan isn't viable and plans aren't loaded
    useEffect(() => {
        if (isOpen && formData.mode === 'new_plan' && plans.length === 0) {
            loadPlans();
        }
    }, [isOpen, formData.mode]);

    const loadPlans = async () => {
        setLoadingPlans(true);
        try {
            const plansData = await plansAPI.getPlans();
            const plansList = Array.isArray(plansData.data) ? plansData.data
                : Array.isArray(plansData.plans) ? plansData.plans
                    : Array.isArray(plansData) ? plansData
                        : [];
            setPlans(plansList);
        } catch (error) {
            console.error('Failed to load plans', error);
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'planId') {
            const plan = plans.find(p => p.id.toString() === value);
            setSelectedPlan(plan || null);
            if (plan && plan.price) {
                setFormData(prev => ({ ...prev, pricePaid: plan.price }));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (Number(formData.pricePaid) < 0) {
            alert('السعر المدفوع لا يمكن أن يكون سالباً');
            return;
        }

        const payload = { ...formData };
        onSubmit(payload);
    };

    if (!isOpen || !subscription) return null;

    const canUseSamePlan = subscription.source === 'plan' && subscription.plan?.id;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">إعادة تجديد اشتراك منتهي</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Current subscription summary */}
                <div className="detail-card">
                    <h3 className="detail-section-title">بيانات الاشتراك المنتهي</h3>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {subscription.member?.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {subscription.source === 'plan' ? subscription.plan?.name : 'اشتراك يدوي'}
                        {' '}· تم الانتهاء في {' '}
                        {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '—'}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Mode Selection */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">طريقة التجديد</label>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.25rem', borderRadius: '8px' }}>
                                {canUseSamePlan && (
                                    <button
                                        type="button"
                                        style={{
                                            flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none',
                                            background: formData.mode === 'same_plan' ? 'var(--accent-neon)' : 'transparent',
                                            color: formData.mode === 'same_plan' ? '#000' : 'var(--text-muted)',
                                            fontWeight: formData.mode === 'same_plan' ? '600' : '400',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onClick={() => setFormData(p => ({ ...p, mode: 'same_plan', pricePaid: '' }))}
                                    >
                                        نفس الباقة السابقة
                                    </button>
                                )}
                                <button
                                    type="button"
                                    style={{
                                        flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none',
                                        background: formData.mode === 'new_plan' ? 'var(--accent-neon)' : 'transparent',
                                        color: formData.mode === 'new_plan' ? '#000' : 'var(--text-muted)',
                                        fontWeight: formData.mode === 'new_plan' ? '600' : '400',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onClick={() => setFormData(p => ({ ...p, mode: 'new_plan', pricePaid: selectedPlan?.price || '' }))}
                                >
                                    باقة جديدة
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none',
                                        background: formData.mode === 'manual' ? 'var(--accent-neon)' : 'transparent',
                                        color: formData.mode === 'manual' ? '#000' : 'var(--text-muted)',
                                        fontWeight: formData.mode === 'manual' ? '600' : '400',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onClick={() => setFormData(p => ({ ...p, mode: 'manual', pricePaid: '' }))}
                                >
                                    إدخال يدوي
                                </button>
                            </div>
                        </div>

                        {formData.mode === 'same_plan' && (
                            <div style={{ padding: '1rem', background: 'var(--accent-neon-light)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--accent-neon-border)' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>
                                    سيتم تجديد اشتراك العضو تباعًا لخصائص باقته السابقة <strong>({subscription.plan?.name})</strong>.
                                </p>
                            </div>
                        )}

                        {formData.mode === 'new_plan' && (
                            <div className="form-group">
                                <label className="form-label">اختر الباقة</label>
                                <select
                                    name="planId"
                                    className="form-input"
                                    value={formData.planId}
                                    onChange={handleChange}
                                    required={formData.mode === 'new_plan'}
                                    disabled={loadingPlans}
                                    style={{ paddingLeft: '1rem' }}
                                >
                                    <option value="">
                                        {loadingPlans ? 'جاري تحميل الباقات...' : 'اختر باقة'}
                                    </option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} — {Number(p.price).toLocaleString('en-EG')} EGP
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {formData.mode === 'manual' && (
                            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--card-border)' }}>
                                <div className="form-group">
                                    <label className="form-label">نوع الاشتراك</label>
                                    <select
                                        name="type"
                                        className="form-input"
                                        value={formData.type}
                                        onChange={handleChange}
                                        style={{ paddingLeft: '1rem' }}
                                    >
                                        <option value="time_based">أيام (محدد المدة)</option>
                                        <option value="session_based">جلسات (محدد العدد)</option>
                                    </select>
                                </div>

                                {formData.type === 'time_based' ? (
                                    <Input
                                        label="المدة (بالأيام)"
                                        name="durationInDays"
                                        type="number"
                                        min="1"
                                        placeholder="مثال: 30"
                                        value={formData.durationInDays}
                                        onChange={handleChange}
                                        required={formData.mode === 'manual' && formData.type === 'time_based'}
                                    />
                                ) : (
                                    <Input
                                        label="عدد الجلسات"
                                        name="totalSessions"
                                        type="number"
                                        min="1"
                                        placeholder="مثال: 12"
                                        value={formData.totalSessions}
                                        onChange={handleChange}
                                        required={formData.mode === 'manual' && formData.type === 'session_based'}
                                    />
                                )}
                            </div>
                        )}

                        <Input
                            label="تاريخ البدء (اختياري، يترك فارغاً للبدء من اليوم)"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                        />

                        <Input
                            label="المبلغ المدفوع (EGP)"
                            name="pricePaid"
                            type="number"
                            min="0"
                            value={formData.pricePaid}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="ملاحظات (اختياري)"
                            name="notes"
                            type="text"
                            value={formData.notes}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                            إلغاء
                        </button>
                        <Button type="submit" disabled={isLoading || loadingPlans} style={{ width: 'auto' }}>
                            {isLoading ? 'جاري التجديد...' : 'تجديد الاشتراك'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RenewExpiredModal;
