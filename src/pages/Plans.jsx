import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import PlanModal from '../components/PlanModal';
import Button from '../components/Button';
import { plansAPI } from '../utils/api';

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const data = await plansAPI.getPlans();
            console.log('Plans API response:', data);
            // Handle all possible response shapes
            const plans = Array.isArray(data.data) ? data.data
                : Array.isArray(data.plans) ? data.plans
                    : Array.isArray(data.data?.plans) ? data.data.plans
                        : Array.isArray(data) ? data
                            : [];
            setPlans(plans);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            setPlans([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPlan = () => {
        setEditingPlan(null);
        setIsModalOpen(true);
    };

    const handleEditPlan = (plan) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleDeletePlan = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
            try {
                await plansAPI.deletePlan(id);
                fetchPlans();
            } catch (error) {
                alert(error.message || 'فشل حذف الخطة');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            if (editingPlan) {
                await plansAPI.updatePlan(editingPlan.id, formData);
            } else {
                await plansAPI.addPlan(formData);
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (error) {
            alert(error.message || 'فشل حفظ بيانات الخطة');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price) => {
        return Number(price).toLocaleString('en-EG');
    };

    const formatDuration = (plan) => {
        if (plan.type === 'session_based') {
            return `${plan.sessionCount} Session${plan.sessionCount > 1 ? 's' : ''}`;
        }
        const days = plan.durationInDays;
        if (!days) return '—';
        if (days >= 365) return `${Math.floor(days / 365)} Year${days >= 730 ? 's' : ''}`;
        if (days >= 30) return `${Math.floor(days / 30)} Month${days >= 60 ? 's' : ''}`;
        return `${days} Day${days > 1 ? 's' : ''}`;
    };

    const getTypeBadge = (type) => {
        if (type === 'session_based') {
            return <span className="status-badge active">باقة حصص</span>;
        }
        return <span className="status-badge pending">باقة زمنية</span>;
    };

    return (
        <DashboardLayout>
            <div className="flex-between page-header mb-8">
                <header>
                    <h1 className="page-title">Gym Plans</h1>
                    <p className="page-subtitle">Manage your membership packages and pricing.</p>
                </header>
                <Button onClick={handleAddPlan} style={{ width: 'auto', gap: '8px' }}>
                    <Plus size={20} />
                    Add New Plan
                </Button>
            </div>

            <section className="glass-panel">
                <div className="table-container">
                    {isLoading ? (
                        <div className="empty-state">Loading plans...</div>
                    ) : plans.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Plan Name</th>
                                    <th>Type</th>
                                    <th>Price</th>
                                    <th>Duration / Sessions</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((plan) => (
                                    <tr key={plan.id}>
                                        <td style={{ fontWeight: '600' }}>{plan.name}</td>
                                        <td>{getTypeBadge(plan.type)}</td>
                                        <td style={{ color: 'var(--accent-neon)' }}>{formatPrice(plan.price)} EGP</td>
                                        <td>{formatDuration(plan)}</td>
                                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={plan.description}>
                                            {plan.description || '—'}
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-icon" onClick={() => handleEditPlan(plan)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn-icon delete" onClick={() => handleDeletePlan(plan.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>No plans found. Click "Add New Plan" to create one.</p>
                        </div>
                    )}
                </div>
            </section>

            <PlanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                plan={editingPlan}
                isLoading={isSubmitting}
            />
        </DashboardLayout>
    );
};

export default Plans;
