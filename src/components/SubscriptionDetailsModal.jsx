import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Snowflake, XCircle, Clock, CheckCircle, PauseCircle, AlertTriangle } from 'lucide-react';
import { subscriptionsAPI } from '../utils/api';

// Mock history data for development
const MOCK_HISTORY = [
    { id: 'h1', event: 'Subscription Created', createdAt: '2026-02-01', eventType: 'active' },
    { id: 'h2', event: 'Subscription Frozen', createdAt: '2026-02-15', eventType: 'frozen' },
    { id: 'h3', event: 'Subscription Unfrozen', createdAt: '2026-02-20', eventType: 'active' },
];

const SubscriptionDetailsModal = ({ isOpen, onClose, subscription, onRenew, onFreeze, onCancel, onDeduct }) => {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (isOpen && subscription) {
            fetchHistory();
        }
    }, [isOpen, subscription]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await subscriptionsAPI.getSubscriptionHistory(subscription.id);
            const events = Array.isArray(data.data) ? data.data
                : Array.isArray(data.history) ? data.history
                    : Array.isArray(data) ? data
                        : [];
            setHistory(events);
        } catch (error) {
            // Use mock history
            setHistory(MOCK_HISTORY);
        } finally {
            setLoadingHistory(false);
        }
    };

    const getTimelineIcon = (eventType) => {
        switch (eventType) {
            case 'active':
            case 'renewed': return <CheckCircle size={12} color="var(--accent-neon)" />;
            case 'frozen': return <PauseCircle size={12} color="#38bdf8" />;
            case 'cancelled': return <XCircle size={12} color="#ef4444" />;
            case 'expired': return <AlertTriangle size={12} color="#fb923c" />;
            case 'deducted': return <Clock size={12} color="#fb923c" />;
            default: return <Clock size={12} color="var(--text-muted)" />;
        }
    };

    if (!isOpen || !subscription) return null;

    const sub = subscription;
    const isTimeBased = sub.type === 'time_based';
    let daysLeft = 0;
    if (isTimeBased && sub.endDate) {
        daysLeft = Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">Subscription Details</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Member Info */}
                    <div className="detail-card">
                        <h3 className="detail-section-title">Member Information</h3>
                        <div className="detail-row">
                            <span className="detail-label">Name</span>
                            <span className="detail-value">{sub.member?.name}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{sub.member?.phone}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Code</span>
                            <span className="detail-value" style={{ letterSpacing: '2px', fontFamily: 'monospace' }}>{sub.member?.code}</span>
                        </div>
                    </div>

                    {/* Plan Info */}
                    <div className="detail-card">
                        <h3 className="detail-section-title">Plan Details</h3>
                        <div className="detail-row">
                            <span className="detail-label">Plan</span>
                            <span className="detail-value">{sub.source === 'manual' ? 'Manual Subscription' : (sub.plan?.name || 'Unknown')}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Price</span>
                            <span className="detail-value" style={{ color: 'var(--accent-neon)' }}>
                                {Number(sub.pricePaid || (sub.plan ? sub.plan.price : 0)).toLocaleString('en-EG')} EGP
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Type</span>
                            <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                                {sub.type === 'session_based' ? 'Session Based' : 'Time Based'}
                            </span>
                        </div>
                    </div>

                    {/* Subscription Info */}
                    <div className="detail-card">
                        <h3 className="detail-section-title">Subscription Status</h3>
                        <div className="detail-row">
                            <span className="detail-label">Start Date</span>
                            <span className="detail-value">{new Date(sub.startDate).toLocaleDateString()}</span>
                        </div>

                        {isTimeBased ? (
                            <div className="detail-row">
                                <span className="detail-label">End Date</span>
                                <span className="detail-value">{new Date(sub.endDate).toLocaleDateString()}</span>
                            </div>
                        ) : (
                            <>
                                <div className="detail-row">
                                    <span className="detail-label">Total Sessions</span>
                                    <span className="detail-value">{sub.totalSessions || (sub.plan ? sub.plan.sessionCount : 0)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Remaining Sessions</span>
                                    <span className="detail-value" style={{ color: sub.remainingSessions > 0 ? 'var(--accent-neon)' : '#ef4444' }}>
                                        {sub.remainingSessions}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="detail-row">
                            <span className="detail-label">Status</span>
                            <span className={`status-badge ${sub.status}`}>{sub.status}</span>
                        </div>
                        {sub.status === 'active' && isTimeBased && (
                            <div className="detail-row">
                                <span className="detail-label">Days Remaining</span>
                                <span className="detail-value" style={{
                                    color: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#fb923c' : 'var(--accent-neon)'
                                }}>
                                    {daysLeft <= 0 ? 'Expired today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''}`}
                                </span>
                            </div>
                        )}
                        {sub.status === 'frozen' && (
                            <>
                                <div className="detail-row">
                                    <span className="detail-label">Total Freeze Minutes</span>
                                    <span className="detail-value" style={{ color: '#38bdf8' }}>{sub.totalFreezeMinutes || 0} min</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Times Frozen</span>
                                    <span className="detail-value">{sub.freezeCount || 0}</span>
                                </div>
                            </>
                        )}
                        {sub.notes && (
                            <div className="detail-row" style={{ borderBottom: 'none' }}>
                                <span className="detail-label">Notes</span>
                                <span className="detail-value">{sub.notes}</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        {sub.status === 'active' && (
                            <button className="quick-action-btn renew" onClick={onRenew}>
                                <RefreshCw size={14} /> Renew
                            </button>
                        )}
                        {(sub.status === 'active' || sub.status === 'frozen') && (
                            <button className="quick-action-btn freeze" onClick={onFreeze}>
                                <Snowflake size={14} /> {sub.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                            </button>
                        )}
                        {sub.status === 'active' && !isTimeBased && (
                            <button className="quick-action-btn" onClick={onDeduct} style={{ color: '#fb923c', borderColor: 'rgba(251, 146, 60, 0.2)', background: 'rgba(251, 146, 60, 0.05)' }}>
                                <Clock size={14} /> Deduct
                            </button>
                        )}
                        {(sub.status === 'active' || sub.status === 'frozen') && (
                            <button className="quick-action-btn cancel" onClick={onCancel}>
                                <XCircle size={14} /> Cancel
                            </button>
                        )}
                    </div>

                    {/* History Timeline */}
                    <div className="detail-card" style={{ marginTop: '2rem' }}>
                        <h3 className="detail-section-title">Subscription History</h3>
                        {loadingHistory ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading history...</p>
                        ) : history.length > 0 ? (
                            <div className="timeline">
                                {history.map((item, idx) => (
                                    <div key={item.id || idx} className="timeline-item">
                                        <div className={`timeline-dot ${item.eventType || ''}`}>
                                            {getTimelineIcon(item.eventType)}
                                        </div>
                                        <div className="timeline-event">
                                            {item.notes || item.event || item.eventType}
                                        </div>
                                        <div className="timeline-date">
                                            {new Date(item.createdAt || item.date).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No history events found.</p>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-text" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionDetailsModal;
