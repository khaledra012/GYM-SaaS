import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { checkinsAPI } from '../utils/api';
import { ClipboardList, Filter, Search } from 'lucide-react';
import Button from '../components/Button';

const TodayLog = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [reasonFilter, setReasonFilter] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [currentPage, statusFilter, reasonFilter, searchTerm]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const params = { page: currentPage, limit: 20 };

            if (statusFilter !== 'all') params.status = statusFilter;
            if (reasonFilter !== 'all') params.denyReasonCode = reasonFilter;
            if (searchTerm) params.memberCode = searchTerm; // Filtering by exact code usually for logs

            const response = await checkinsAPI.getTodayLog(params);

            setLogs(response.data || []);
            setTotalPages(response.totalPages || 1);
            setTotalLogs(response.total || 0);

        } catch (error) {
            console.error('Failed to fetch today logs:', error);
            setLogs([]);
            setTotalPages(1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchClick = () => {
        setCurrentPage(1);
        setSearchTerm(searchInput);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearchClick();
    };

    const getStatusStyle = (status) => {
        if (status === 'approved') {
            return { color: 'var(--accent-neon)', background: 'var(--accent-neon-light)' };
        }
        return { color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' };
    };

    return (
        <DashboardLayout>
            <div className="page-header mb-8">
                <header>
                    <h1 className="page-title">Today's Log</h1>
                    <p className="page-subtitle">History of all check-in attempts today. Total attempts: {totalLogs}</p>
                </header>
            </div>

            <section className="glass-panel">
                {/* Search & Filters */}
                <div className="flex-between mb-6" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="search-wrapper" style={{ flexGrow: 1, position: 'relative', display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flexGrow: 1 }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                            <input
                                type="text"
                                className="form-input with-icon"
                                placeholder="Search by member code..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <Button onClick={handleSearchClick} style={{ width: 'auto', padding: '0 1.5rem' }}>Search</Button>
                    </div>

                    <div className="filter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={20} color="var(--text-muted)" />

                        <select
                            className="form-input"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: '150px', paddingLeft: '1rem' }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                        </select>

                        <select
                            className="form-input"
                            value={reasonFilter}
                            onChange={(e) => { setReasonFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: '180px', paddingLeft: '1rem' }}
                            disabled={statusFilter === 'approved'}
                        >
                            <option value="all">All Deny Reasons</option>
                            <option value="member_not_found">Member Not Found</option>
                            <option value="member_inactive">Member Inactive</option>
                            <option value="no_subscription">No Subscription</option>
                            <option value="subscription_expired">Expired</option>
                            <option value="subscription_frozen">Frozen</option>
                            <option value="subscription_cancelled">Cancelled</option>
                            <option value="sessions_depleted">Sessions Depleted</option>
                            <option value="cooldown_active">Cooldown Active</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    {isLoading ? (
                        <div className="empty-state">Loading logs...</div>
                    ) : logs.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Member Code</th>
                                    <th>Member Details</th>
                                    <th>Status</th>
                                    <th>Details/Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const timeStr = new Date(log.checkinAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                    const st = getStatusStyle(log.status);

                                    return (
                                        <tr key={log.id}>
                                            <td style={{ fontWeight: '600' }}>{timeStr}</td>
                                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.memberCode}</td>
                                            <td>
                                                <div style={{ fontWeight: '500' }}>{log.member?.name || '—'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.member?.phone || ''}</div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    ...st,
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    textTransform: 'capitalize',
                                                    fontWeight: '600'
                                                }}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td style={{ color: log.status === 'denied' ? '#fb923c' : 'var(--text-muted)' }}>
                                                {log.status === 'denied' ? log.denyReasonMessage || log.denyReasonCode : 'Successfully checked in.'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <p>No check-in logs found for today matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
                        <Button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.05)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', border: '1px solid var(--card-border)' }}
                        >
                            Previous
                        </Button>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Page <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> of <strong style={{ color: 'var(--text-main)' }}>{totalPages}</strong>
                        </span>
                        <Button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.05)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)', border: '1px solid var(--card-border)' }}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </section>
        </DashboardLayout>
    );
};

export default TodayLog;
