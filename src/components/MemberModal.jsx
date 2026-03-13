import React, { useEffect, useState } from 'react';
import { Eye, Printer, X } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import DebtDetailsModal from './DebtDetailsModal';
import { debtsAPI, membersAPI } from '../utils/api';

const parseMoney = (value) =>
    Number(value || 0).toLocaleString('en-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const extractDebtRows = (response) => {
    if (Array.isArray(response?.data?.debts)) return response.data.debts;
    if (Array.isArray(response?.debts)) return response.debts;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data?.debts)) return response.data.data.debts;
    return [];
};

const extractMemberFinance = (memberDetails, debtSummary) => ({
    totalDebtAmount: debtSummary?.totalOriginalAmount || memberDetails?.totalDebtAmount || '0.00',
    outstandingDebtAmount: debtSummary?.totalRemainingAmount || memberDetails?.outstandingDebtAmount || '0.00',
    outstandingDebtCount: debtSummary?.outstandingDebtsCount || memberDetails?.outstandingDebtCount || 0
});

const MemberModal = ({ isOpen, onClose, onSubmit, member, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        gender: 'male',
        status: 'active',
        membershipStart: ''
    });
    const [barcodeUrl, setBarcodeUrl] = useState(null);
    const [financialSummary, setFinancialSummary] = useState(null);
    const [memberDebts, setMemberDebts] = useState([]);
    const [loadingFinance, setLoadingFinance] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [isDebtDetailsOpen, setIsDebtDetailsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return undefined;

        if (member) {
            setFormData({
                name: member.name || '',
                phone: member.phone || '',
                gender: member.gender || 'male',
                status: member.status || 'active',
                membershipStart: member.membershipStart ? new Date(member.membershipStart).toISOString().split('T')[0] : ''
            });

            if (member.id) {
                loadBarcode(member.id);
                loadFinancialData(member.id);
            }
        } else {
            setFormData({
                name: '',
                phone: '',
                gender: 'male',
                status: 'active',
                membershipStart: new Date().toISOString().split('T')[0]
            });
            setBarcodeUrl(null);
            setFinancialSummary(null);
            setMemberDebts([]);
        }

        return () => {
            if (barcodeUrl) {
                URL.revokeObjectURL(barcodeUrl);
            }
        };
    }, [member, isOpen]);

    const loadBarcode = async (memberId) => {
        try {
            const url = await membersAPI.getMemberBarcodeSvg(memberId);
            setBarcodeUrl(url);
        } catch (error) {
            console.error('Failed to load barcode SVG:', error);
            setBarcodeUrl(null);
        }
    };

    const loadFinancialData = async (memberId) => {
        setLoadingFinance(true);
        try {
            const [memberDetails, debtSummary, debtsResponse] = await Promise.all([
                membersAPI.getMember(memberId).catch(() => null),
                debtsAPI.getMemberSummary(memberId).catch(() => null),
                debtsAPI.getMemberDebts(memberId, { limit: 20, page: 1 }).catch(() => null)
            ]);

            setFinancialSummary(extractMemberFinance(memberDetails, debtSummary?.data || debtSummary));
            setMemberDebts(extractDebtRows(debtsResponse));
        } catch (error) {
            console.error('Failed to load member finance data:', error);
            setFinancialSummary(null);
            setMemberDebts([]);
        } finally {
            setLoadingFinance(false);
        }
    };

    const handlePrintBarcode = () => {
        if (!member || !barcodeUrl) return;

        const gymName = localStorage.getItem('gymName') || 'NEON GYM';
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Barcode - ${member.name}</title>
                    <style>
                        @page { margin: 0; size: auto; }
                        body {
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            font-family: Arial, sans-serif;
                            background: #ffffff;
                        }
                        .label {
                            border: 1px solid #d4d4d8;
                            border-radius: 12px;
                            padding: 20px 28px;
                            text-align: center;
                        }
                        h2 { margin: 0 0 10px; font-size: 18px; letter-spacing: 1px; }
                        p { margin: 0 0 10px; }
                        img { height: 80px; width: auto; margin-bottom: 8px; }
                        .code { font-size: 22px; letter-spacing: 2px; font-weight: 700; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <h2>${gymName}</h2>
                        <p>${member.name}</p>
                        <img src="${barcodeUrl}" alt="Barcode" />
                        <div class="code">${member.code}</div>
                    </div>
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 400);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(formData);
    };

    const openDebtDetails = (debt) => {
        setSelectedDebt(debt);
        setIsDebtDetailsOpen(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className={`modal-content ${member ? 'wide' : ''}`} onClick={(event) => event.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="section-title">{member ? 'Member Profile' : 'Add New Member'}</h2>
                        <button className="close-btn" onClick={onClose} type="button">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {member ? (
                                <div className="detail-card">
                                    <div className="flex-between" style={{ gap: '1rem', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 className="detail-section-title">Member Identity</h3>
                                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                Review member details, barcode, and current debt profile.
                                            </p>
                                        </div>
                                        {barcodeUrl ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', padding: '0.75rem', borderRadius: '10px' }}>
                                                <img src={barcodeUrl} alt="Member Barcode" style={{ height: '60px', objectFit: 'contain' }} />
                                                <button
                                                    type="button"
                                                    onClick={handlePrintBarcode}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#000',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.8rem',
                                                        marginTop: '0.5rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    <Printer size={16} /> Print
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    {member.code ? (
                                        <div className="detail-row" style={{ marginTop: '1rem' }}>
                                            <span className="detail-label">Member Code</span>
                                            <span className="detail-value" style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>{member.code}</span>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {member ? (
                                <div className="detail-card">
                                    <h3 className="detail-section-title">Debt Summary</h3>
                                    {loadingFinance ? (
                                        <p style={{ color: 'var(--text-muted)' }}>Loading debt summary...</p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                                            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)' }}>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>Total Debt</div>
                                                <div style={{ fontSize: '1.15rem', fontWeight: '700' }}>{parseMoney(financialSummary?.totalDebtAmount)} EGP</div>
                                            </div>
                                            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)' }}>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>Outstanding</div>
                                                <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fbbf24' }}>{parseMoney(financialSummary?.outstandingDebtAmount)} EGP</div>
                                            </div>
                                            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)' }}>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>Open Debts</div>
                                                <div style={{ fontSize: '1.15rem', fontWeight: '700' }}>{financialSummary?.outstandingDebtCount || 0}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {member ? (
                                <div className="detail-card">
                                    <div className="flex-between" style={{ gap: '1rem', marginBottom: '1rem' }}>
                                        <h3 className="detail-section-title" style={{ marginBottom: 0 }}>Member Debts</h3>
                                        <span className="status-badge pending">{memberDebts.length} records</span>
                                    </div>

                                    {loadingFinance ? (
                                        <p style={{ color: 'var(--text-muted)' }}>Loading debts...</p>
                                    ) : memberDebts.length > 0 ? (
                                        <div className="table-container">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Title</th>
                                                        <th>Remaining</th>
                                                        <th>Status</th>
                                                        <th>Date</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {memberDebts.map((debt) => (
                                                        <tr key={debt.id}>
                                                            <td>{debt.title}</td>
                                                            <td style={{ color: '#fbbf24', fontWeight: '700' }}>{parseMoney(debt.remainingAmount)} EGP</td>
                                                            <td>
                                                                <span className={`status-badge ${debt.status}`}>{debt.statusLabel || debt.status}</span>
                                                            </td>
                                                            <td>{debt.localDate || '-'}</td>
                                                            <td>
                                                                <button className="btn-icon" type="button" onClick={() => openDebtDetails(debt)}>
                                                                    <Eye size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="empty-state" style={{ padding: '1rem 0' }}>
                                            <p>No debt records for this member.</p>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            <Input
                                label="Full Name"
                                name="name"
                                placeholder="e.g. Mostafa Ahmed"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                            <Input
                                label="Phone Number"
                                name="phone"
                                placeholder="e.g. 01012345678"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />

                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select
                                    name="gender"
                                    className="form-input"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    style={{ paddingLeft: '1rem' }}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    name="status"
                                    className="form-input"
                                    value={formData.status}
                                    onChange={handleChange}
                                    style={{ paddingLeft: '1rem' }}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    {member ? <option value="rejected">Rejected</option> : null}
                                </select>
                            </div>

                            <Input
                                label="Start Date"
                                name="membershipStart"
                                type="date"
                                value={formData.membershipStart}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </button>
                            <Button type="submit" disabled={isLoading} style={{ width: 'auto' }}>
                                {isLoading ? 'Saving...' : (member ? 'Update Member' : 'Add Member')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <DebtDetailsModal
                isOpen={isDebtDetailsOpen}
                onClose={() => setIsDebtDetailsOpen(false)}
                debt={selectedDebt}
            />
        </>
    );
};

export default MemberModal;
