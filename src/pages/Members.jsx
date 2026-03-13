import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import MemberModal from '../components/MemberModal';
import Button from '../components/Button';
import { membersAPI } from '../utils/api';

const extractMemberRows = (response) => {
    if (Array.isArray(response?.data?.members)) return response.data.members;
    if (Array.isArray(response?.members)) return response.members;
    if (Array.isArray(response?.data?.data?.members)) return response.data.data.members;
    return [];
};

const Members = () => {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [memberStatusFilter, setMemberStatusFilter] = useState('all');
    const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('all');
    const [subscriptionTypeFilter, setSubscriptionTypeFilter] = useState('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, [searchTerm, memberStatusFilter, subscriptionStatusFilter, subscriptionTypeFilter]);

    const handleSearchClick = () => {
        setSearchTerm(searchInput);
        setSearchInput(''); // Clear input after search
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setSearchTerm(searchInput);
            setSearchInput(''); // Clear input after search
        }
    };

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (memberStatusFilter !== 'all') params.memberStatus = memberStatusFilter;
            if (subscriptionStatusFilter !== 'all') params.subscriptionStatus = subscriptionStatusFilter;
            if (subscriptionTypeFilter !== 'all') params.subscriptionType = subscriptionTypeFilter;

            const data = await membersAPI.getMembers(params);
            setMembers(extractMemberRows(data));
        } catch (error) {
            console.error('Failed to fetch members:', error);
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const BarcodeImage = ({ memberId, memberName, memberCode }) => {
        const [url, setUrl] = useState(null);
        useEffect(() => {
            if (!memberId) return;
            let currentUrl = null;
            membersAPI.getMemberBarcodeSvg(memberId)
                .then(fetchedUrl => {
                    currentUrl = fetchedUrl;
                    setUrl(fetchedUrl);
                })
                .catch(err => console.error('Error fetching barcode SVG', err));
            return () => {
                if (currentUrl) URL.revokeObjectURL(currentUrl);
            };
        }, [memberId]);

        const printBarcode = () => {
            const gymName = localStorage.getItem('gymName') || 'NEON GYM';
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Barcode - ${memberName}</title>
                        <style>
                            @page { margin: 0; size: auto; }
                            body { 
                                margin: 0; 
                                display: flex; 
                                flex-direction: column; 
                                align-items: center; 
                                justify-content: center;
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                text-align: center;
                                padding: 20px;
                            }
                            .label {
                                border: 1px solid #ddd;
                                padding: 15px 30px;
                                border-radius: 8px;
                                min-width: 250px;
                            }
                            h2 { margin: 0 0 10px 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
                            p.name { margin: 0 0 15px 0; font-size: 16px; font-weight: 600; }
                            img { height: 80px; width: auto; margin-bottom: 5px; }
                            p.code { margin: 0; font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 2px; }
                        </style>
                    </head>
                    <body>
                        <div class="label">
                            <h2>${gymName}</h2>
                            <p class="name">${memberName}</p>
                            <img src="${url}" />
                            <p class="code">${memberCode}</p>
                        </div>
                        <script>
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        };

        if (!url) return <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</span>;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <img src={url} alt="Barcode" style={{ height: '30px', objectFit: 'contain', background: 'white', padding: '2px', borderRadius: '4px' }} />
                <button
                    onClick={printBarcode}
                    title="Print Barcode"
                    style={{
                        background: 'none', border: 'none', color: 'var(--accent-neon)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                </button>
            </div>
        );
    };

    const handleAddMember = () => {
        setEditingMember(null);
        setIsModalOpen(true);
    };

    const handleEditMember = (member) => {
        setEditingMember(member);
        setIsModalOpen(true);
    };

    const handleDeleteMember = async (id) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            try {
                await membersAPI.deleteMember(id);
                fetchMembers();
            } catch (error) {
                alert(error.message || 'فشل حذف العضو');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            if (editingMember) {
                await membersAPI.updateMember(editingMember.id, formData);
            } else {
                await membersAPI.addMember(formData);
            }
            setIsModalOpen(false);
            fetchMembers(); // Re-fetch list to get the barcode and subscription statuses for new members
        } catch (error) {
            alert(error.message || 'فشل حفظ بيانات العضو');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex-between page-header mb-8">
                <header>
                    <h1 className="page-title">Gym Members</h1>
                    <p className="page-subtitle">Manage, search and filter your gym community.</p>
                </header>
                <Button onClick={handleAddMember} style={{ width: 'auto', gap: '8px' }}>
                    <Plus size={20} />
                    Add New Member
                </Button>
            </div>

            <section className="glass-panel">
                <div className="flex-between mb-6" style={{ gap: '1rem' }}>
                    <div className="search-wrapper" style={{ flexGrow: 1, position: 'relative', display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flexGrow: 1 }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                            <input
                                type="text"
                                className="form-input with-icon"
                                placeholder="Search by name, phone, or code..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <Button
                            onClick={handleSearchClick}
                            style={{ width: 'auto', padding: '0 1.5rem' }}
                        >
                            Search
                        </Button>
                    </div>

                    <div className="filter-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Filter size={20} color="var(--text-muted)" />

                        <select
                            className="form-input"
                            value={memberStatusFilter}
                            onChange={(e) => setMemberStatusFilter(e.target.value)}
                            style={{ width: '150px', paddingLeft: '1rem' }}
                        >
                            <option value="all">Member Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <select
                            className="form-input"
                            value={subscriptionStatusFilter}
                            onChange={(e) => setSubscriptionStatusFilter(e.target.value)}
                            style={{ width: '160px', paddingLeft: '1rem' }}
                        >
                            <option value="all">Sub Status</option>
                            <option value="active">Active</option>
                            <option value="frozen">Frozen</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            className="form-input"
                            value={subscriptionTypeFilter}
                            onChange={(e) => setSubscriptionTypeFilter(e.target.value)}
                            style={{ width: '150px', paddingLeft: '1rem' }}
                        >
                            <option value="all">Sub Type</option>
                            <option value="time_based">Time Based</option>
                            <option value="session_based">Session Based</option>
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div className="empty-state">Loading members...</div>
                    ) : members.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Gender</th>
                                    <th>Member Status</th>
                                    <th>Sub Status</th>
                                    <th>Type</th>
                                    <th>Join Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr key={member.id}>
                                        <td>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '1px' }}>
                                                {member.code || 'N/A'}
                                            </div>
                                            {member.id && <BarcodeImage
                                                memberId={member.id}
                                                memberName={member.name}
                                                memberCode={member.code}
                                            />}
                                        </td>
                                        <td style={{ fontWeight: '600' }}>{member.name}</td>
                                        <td>{member.phone}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{member.gender}</td>
                                        <td>
                                            <span className={`status-badge ${member.status || 'inactive'}`}>
                                                {member.status || 'inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${member.subscriptionStatus || 'inactive'}`}>
                                                {member.subscriptionStatus || 'none'}
                                            </span>
                                        </td>
                                        <td style={{ textTransform: 'capitalize' }}>
                                            {member.subscriptionType === 'session_based' ? 'Session Based'
                                                : member.subscriptionType === 'time_based' ? 'Time Based' : '—'}
                                        </td>
                                        <td>{member.membershipStart ? new Date(member.membershipStart).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-icon" onClick={() => handleEditMember(member)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn-icon delete" onClick={() => handleDeleteMember(member.id)}>
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
                            <p>No members found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </section>

            <MemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                member={editingMember}
                isLoading={isSubmitting}
            />
        </DashboardLayout>
    );
};

export default Members;
