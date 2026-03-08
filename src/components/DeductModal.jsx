import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Button from './Button';

const DeductModal = ({ isOpen, onClose, onSubmit, subscription, isLoading }) => {
    const [formData, setFormData] = useState({
        count: 1,
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                count: 1,
                notes: ''
            });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            count: Number(formData.count),
            notes: formData.notes
        });
    };

    if (!isOpen || !subscription || subscription.plan?.type !== 'session_based') return null;

    const remainingSessions = subscription.remainingSessions || 0;
    const canDeduct = formData.count > 0 && formData.count <= remainingSessions;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">Deduct Sessions</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="detail-card">
                    <h3 className="detail-section-title">Current Sessions</h3>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {subscription.member?.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--accent-neon)' }}>{remainingSessions}</strong> Sessions Remaining
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <Input
                            label="Number of Sessions to Deduct"
                            name="count"
                            type="number"
                            min="1"
                            max={remainingSessions}
                            value={formData.count}
                            onChange={handleChange}
                            required
                        />

                        {formData.count > remainingSessions && (
                            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '-10px', marginBottom: '15px' }}>
                                Cannot deduct more than remaining sessions ({remainingSessions}).
                            </div>
                        )}

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
                        <Button type="submit" disabled={isLoading || !canDeduct} style={{ width: 'auto' }}>
                            {isLoading ? 'Deducting...' : 'Confirm Deduction'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeductModal;
