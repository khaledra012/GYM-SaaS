import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Button from './Button';

const PlanModal = ({ isOpen, onClose, onSubmit, plan, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        type: 'time_based',
        durationInDays: '',
        sessionCount: '',
        description: ''
    });

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name || '',
                price: plan.price || '',
                type: plan.type || 'time_based',
                durationInDays: plan.durationInDays || '',
                sessionCount: plan.sessionCount || '',
                description: plan.description || ''
            });
        } else {
            setFormData({
                name: '',
                price: '',
                type: 'time_based',
                durationInDays: '',
                sessionCount: '',
                description: ''
            });
        }
    }, [plan, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            name: formData.name,
            price: Number(formData.price),
            description: formData.description || undefined
        };

        if (!plan) {
            // Only send type on create (backend forbids changing it)
            submitData.type = formData.type;
        }

        // Send only the relevant field based on type
        const activeType = plan ? plan.type : formData.type;
        if (activeType === 'time_based') {
            submitData.durationInDays = Number(formData.durationInDays);
        } else {
            submitData.sessionCount = Number(formData.sessionCount);
        }

        onSubmit(submitData);
    };

    if (!isOpen) return null;

    // When editing, the type is locked to the plan's original type
    const activeType = plan ? plan.type : formData.type;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">{plan ? 'Edit Plan' : 'Add New Plan'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <Input
                            label="Plan Name"
                            name="name"
                            placeholder="e.g. Monthly Premium"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <div className="form-group">
                            <label className="form-label">Plan Type</label>
                            <select
                                name="type"
                                className="form-input"
                                value={activeType}
                                onChange={handleChange}
                                disabled={!!plan}
                                style={{ paddingLeft: '1rem', opacity: plan ? 0.6 : 1 }}
                            >
                                <option value="time_based">باقة زمنية (أيام)</option>
                                <option value="session_based">باقة حصص</option>
                            </select>
                            {plan && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                    لا يمكن تغيير نوع الباقة بعد الإنشاء
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Price (EGP)"
                                name="price"
                                type="number"
                                placeholder="e.g. 500"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />

                            {activeType === 'time_based' ? (
                                <Input
                                    label="Duration (Days)"
                                    name="durationInDays"
                                    type="number"
                                    placeholder="e.g. 30"
                                    value={formData.durationInDays}
                                    onChange={handleChange}
                                    required
                                />
                            ) : (
                                <Input
                                    label="Session Count"
                                    name="sessionCount"
                                    type="number"
                                    placeholder="e.g. 12"
                                    value={formData.sessionCount}
                                    onChange={handleChange}
                                    required
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description (Optional)</label>
                            <textarea
                                name="description"
                                className="form-input"
                                placeholder="e.g. Full access to all machines + sauna"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                style={{ paddingLeft: '1rem', paddingTop: '0.75rem', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <Button type="submit" disabled={isLoading} style={{ width: 'auto' }}>
                            {isLoading ? 'Saving...' : (plan ? 'Update Plan' : 'Add Plan')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PlanModal;
