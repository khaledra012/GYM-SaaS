import React, { useState } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Button from './Button';

export const TRANSACTION_CATEGORIES = {
    pos_sales: "مبيعات (POS)",
    subscription: "اشتراكات",
    salaries: "رواتب ومكافآت",
    maintenance: "صيانة وتصليح",
    rent_utilities: "إيجار وفواتير",
    owner_draw: "سحب المالك",
    other: "أخرى"
};

const TransactionModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        type: 'IN',
        amount: '',
        category: 'other',
        description: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            amount: Number(formData.amount)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">إضافة معاملة يدوية</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">نوع المعاملة</label>
                                <select
                                    name="type"
                                    className="form-input"
                                    value={formData.type}
                                    onChange={handleChange}
                                    style={{ paddingLeft: '1rem' }}
                                >
                                    <option value="IN">وارد (دخل)</option>
                                    <option value="OUT">منصرف (مصروفات)</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Input
                                    label="المبلغ (EGP)"
                                    name="amount"
                                    type="number"
                                    placeholder="مثال: 150"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">التصنيف (Category)</label>
                            <select
                                name="category"
                                className="form-input"
                                value={formData.category}
                                onChange={handleChange}
                                style={{ paddingLeft: '1rem' }}
                            >
                                {Object.entries(TRANSACTION_CATEGORIES).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">الوصف (اختياري)</label>
                            <textarea
                                name="description"
                                className="form-input"
                                placeholder="تفاصيل المعاملة..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                style={{ paddingLeft: '1rem', paddingTop: '0.75rem', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                            إلغاء
                        </button>
                        <Button type="submit" disabled={isLoading} style={{ width: 'auto' }}>
                            {isLoading ? 'جاري الحفظ...' : 'حفظ المعاملة'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;
