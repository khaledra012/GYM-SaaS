import React from 'react';
import Sidebar from './Sidebar';
import { AlertTriangle, Clock, MessageCircle } from 'lucide-react';

const DashboardLayout = ({ children }) => {
    const billingStatus = localStorage.getItem('billingStatus');
    const trialDaysLeft = parseInt(localStorage.getItem('trialDaysLeft'), 10);

    const renderBanner = () => {
        if (billingStatus === 'trial') {
            if (isNaN(trialDaysLeft) || trialDaysLeft > 2) return null;

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', marginTop: '4px' }}>
                            <span>— يرجى التواصل مع الدعم لتجديد الاشتراك للحفاظ على الحساب:</span>
                            <a
                                href="https://wa.me/201060508475"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: '#25D366',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <MessageCircle size={14} />
                                01060508475
                            </a>
                        </div>
                    )}
                </div>
            );
        }

        if (billingStatus === 'subscribed') {
            const rawDays = localStorage.getItem('subscriptionDaysLeft');
            const subscriptionDaysLeft = parseInt(rawDays, 10);

            // Don't show banner if there are more than 2 days left or if it's open-ended
            if (isNaN(subscriptionDaysLeft) || rawDays === 'undefined' || rawDays === 'null' || subscriptionDaysLeft > 2) {
                return null;
            }

            let bgColor = 'var(--accent-neon-light)';
            let borderColor = 'var(--accent-neon-border)';
            let textColor = 'var(--accent-neon)'; // Green for normal active
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', marginTop: '4px' }}>
                            <span>— يرجى التواصل مع الدعم لتجديد الاشتراك للحفاظ على الحساب:</span>
                            <a
                                href="https://wa.me/201060508475"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: '#25D366',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <MessageCircle size={14} />
                                01060508475
                            </a>
                        </div>
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
