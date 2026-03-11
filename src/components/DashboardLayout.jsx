import React from 'react';
import Sidebar from './Sidebar';
import { AlertTriangle, Clock } from 'lucide-react';

const DashboardLayout = ({ children }) => {
    const billingStatus = localStorage.getItem('billingStatus');
    const trialDaysLeft = parseInt(localStorage.getItem('trialDaysLeft'), 10);

    const renderBanner = () => {
        if (billingStatus === 'trial') {
            if (isNaN(trialDaysLeft)) return null;

            let bgColor = 'rgba(56, 189, 248, 0.1)';
            let borderColor = 'rgba(56, 189, 248, 0.3)';
            let textColor = '#38bdf8';
            let icon = <Clock size={18} style={{ flexShrink: 0 }} />;

            if (trialDaysLeft <= 3) {
                bgColor = 'rgba(239, 68, 68, 0.15)';
                borderColor = 'rgba(239, 68, 68, 0.4)';
                textColor = '#fca5a5';
                icon = <AlertTriangle size={18} style={{ flexShrink: 0 }} />;
            } else if (trialDaysLeft <= 7) {
                bgColor = 'rgba(251, 191, 36, 0.15)';
                borderColor = 'rgba(251, 191, 36, 0.4)';
                textColor = '#fcd34d';
            }

            return (
                <div style={{
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                    color: textColor,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    direction: 'rtl',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    {icon}
                    <span>
                        متبقي <strong style={{ fontSize: '1.1rem' }}>{trialDaysLeft}</strong>{' '}
                        {trialDaysLeft === 1 ? 'يوم' : trialDaysLeft === 2 ? 'يومين' : trialDaysLeft <= 10 ? 'أيام' : 'يوماً'} على انتهاء الفترة التجريبية للنظام.
                    </span>
                    {trialDaysLeft <= 3 && (
                        <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            — يرجى التواصل مع الدعم لتجديد الاشتراك لتجنب إيقاف الحساب.
                        </span>
                    )}
                </div>
            );
        }

        if (billingStatus === 'subscribed') {
            const rawDays = localStorage.getItem('subscriptionDaysLeft');
            const subscriptionDaysLeft = parseInt(rawDays, 10);

            // If subscriptionDaysLeft is NaN (e.g., from an open-ended subscription = null), return a different banner or skip
            if (isNaN(subscriptionDaysLeft) || rawDays === 'undefined' || rawDays === 'null') {
                return (
                    <div style={{
                        backgroundColor: 'rgba(57, 255, 20, 0.1)',
                        border: '1px solid rgba(57, 255, 20, 0.25)',
                        color: '#39ff14',
                        padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                        direction: 'rtl', fontWeight: '500', fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <Clock size={18} style={{ flexShrink: 0 }} />
                        <span>الاشتراك المدفوع للنظام مفعل ومفتوح.</span>
                    </div>
                );
            }

            let bgColor = 'rgba(57, 255, 20, 0.1)';
            let borderColor = 'rgba(57, 255, 20, 0.25)';
            let textColor = '#39ff14'; // Green for normal active
            let icon = <Clock size={18} style={{ flexShrink: 0 }} />;

            if (subscriptionDaysLeft <= 3) {
                bgColor = 'rgba(239, 68, 68, 0.15)';
                borderColor = 'rgba(239, 68, 68, 0.4)';
                textColor = '#fca5a5';
                icon = <AlertTriangle size={18} style={{ flexShrink: 0 }} />;
            } else if (subscriptionDaysLeft <= 7) {
                bgColor = 'rgba(251, 191, 36, 0.15)';
                borderColor = 'rgba(251, 191, 36, 0.4)';
                textColor = '#fcd34d';
            }

            return (
                <div style={{
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                    color: textColor,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    direction: 'rtl',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    {icon}
                    <span>
                        متبقي <strong style={{ fontSize: '1.1rem' }}>{subscriptionDaysLeft}</strong>{' '}
                        {subscriptionDaysLeft === 1 ? 'يوم' : subscriptionDaysLeft === 2 ? 'يومين' : subscriptionDaysLeft <= 10 ? 'أيام' : 'يوماً'} على انتهاء الاشتراك المدفوع للنظام.
                    </span>
                    {subscriptionDaysLeft <= 3 && (
                        <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            — يرجى التواصل مع الدعم لتجديد الاشتراك لتجنب إيقاف الحساب.
                        </span>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="dashboard-content">
                <div className="animated-bg"></div>
                <div className="content-wrapper">
                    {renderBanner()}
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
