import React, { useEffect, useState } from 'react';
import { Plus, Search, Users, KeyRound } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { staffAPI } from '../utils/api';

const ROLE_FILTER_OPTIONS = [
    { value: '', label: 'All Roles' },
    { value: 'owner', label: 'Owner' },
    { value: 'manager', label: 'Manager' },
    { value: 'receptionist', label: 'Receptionist' },
];

const ROLE_FORM_OPTIONS = [
    { value: 'manager', label: 'Manager' },
    { value: 'receptionist', label: 'Receptionist' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const extractStaffRows = (response) => {
    if (Array.isArray(response?.data?.staff)) return response.data.staff;
    if (Array.isArray(response?.staff)) return response.staff;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const extractPagination = (response) => {
    return response?.pagination
        || response?.data?.pagination
        || null;
};

const DEFAULT_FORM = {
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'receptionist'
};

const Staff = () => {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        status: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        totalPages: 1
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [form, setForm] = useState(DEFAULT_FORM);

    useEffect(() => {
        fetchRows();
    }, [filters, pagination.page]);

    const fetchRows = async () => {
        setIsLoading(true);
        try {
            const response = await staffAPI.getStaff({
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search,
                role: filters.role,
                status: filters.status
            });

            setRows(extractStaffRows(response));
            const paginationPayload = extractPagination(response);
            setPagination((prev) => ({
                ...prev,
                totalPages: response?.totalPages || paginationPayload?.totalPages || 1
            }));
        } catch (error) {
            console.error('Failed to fetch staff list:', error);
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingRow(null);
        setForm(DEFAULT_FORM);
        setIsModalOpen(true);
    };

    const openEditModal = (row) => {
        setEditingRow(row);
        setForm({
            name: row.name || '',
            email: row.email || '',
            phone: row.phone || '',
            password: '',
            role: row.role === 'manager' ? 'manager' : 'receptionist'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingRow) {
                await staffAPI.updateStaff(editingRow.id, {
                    name: form.name,
                    email: form.email,
                    phone: form.phone || undefined,
                    role: form.role
                });
            } else {
                await staffAPI.createStaff({
                    name: form.name,
                    email: form.email,
                    phone: form.phone || undefined,
                    password: form.password,
                    role: form.role
                });
            }

            setIsModalOpen(false);
            fetchRows();
        } catch (error) {
            alert(error.message || 'Failed to save staff data.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (row) => {
        const nextStatus = row.status === 'active' ? 'inactive' : 'active';
        const confirmed = window.confirm(`Change ${row.name} to ${nextStatus}?`);
        if (!confirmed) return;

        try {
            await staffAPI.updateStaffStatus(row.id, nextStatus);
            fetchRows();
        } catch (error) {
            alert(error.message || 'Failed to update staff status.');
        }
    };

    const handleChangePassword = async (row) => {
        const password = window.prompt(`Enter a new password for ${row.name}:`);
        if (!password) return;

        try {
            await staffAPI.updateStaffPassword(row.id, password);
            alert('Password updated successfully.');
        } catch (error) {
            alert(error.message || 'Failed to update password.');
        }
    };

    const applySearch = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setFilters((prev) => ({ ...prev, search: searchInput }));
    };

    return (
        <DashboardLayout>
            <div className="flex-between page-header mb-8">
                <header>
                    <h1 className="page-title">Staff</h1>
                    <p className="page-subtitle">Manage managers and receptionists in your center.</p>
                </header>
                <Button onClick={openCreateModal} style={{ width: 'auto', gap: '8px' }}>
                    <Plus size={18} />
                    Add Staff
                </Button>
            </div>

            <section className="glass-panel">
                <div className="flex-between mb-6" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', flexGrow: 1 }}>
                        <Input
                            placeholder="Search by name/email/phone..."
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') applySearch();
                            }}
                        />
                        <Button onClick={applySearch} style={{ width: 'auto', padding: '0 1.25rem' }}>
                            <Search size={16} />
                        </Button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <select
                            className="form-input"
                            value={filters.role}
                            onChange={(event) => {
                                setPagination((prev) => ({ ...prev, page: 1 }));
                                setFilters((prev) => ({ ...prev, role: event.target.value }));
                            }}
                            style={{ minWidth: '170px', paddingLeft: '1rem' }}
                        >
                            {ROLE_FILTER_OPTIONS.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-input"
                            value={filters.status}
                            onChange={(event) => {
                                setPagination((prev) => ({ ...prev, page: 1 }));
                                setFilters((prev) => ({ ...prev, status: event.target.value }));
                            }}
                            style={{ minWidth: '170px', paddingLeft: '1rem' }}
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value || 'all'} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div className="empty-state">Loading staff...</div>
                    ) : rows.length > 0 ? (
                        <>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td style={{ fontWeight: 600 }}>{row.name}</td>
                                            <td>{row.email}</td>
                                            <td>{row.phone || '-'}</td>
                                            <td>{row.role}</td>
                                            <td>
                                                <span className={`status-badge ${row.status === 'active' ? 'active' : 'inactive'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="btn-icon" type="button" onClick={() => openEditModal(row)} title="Edit">
                                                        <Users size={16} />
                                                    </button>
                                                    <button className="btn-icon renew" type="button" onClick={() => handleToggleStatus(row)} title="Change status">
                                                        {row.status === 'active' ? 'Off' : 'On'}
                                                    </button>
                                                    <button className="btn-icon" type="button" onClick={() => handleChangePassword(row)} title="Reset password">
                                                        <KeyRound size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {pagination.totalPages > 1 ? (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? 0.5 : 1 }}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page === pagination.totalPages ? 0.5 : 1 }}
                                    >
                                        Next
                                    </button>
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>No staff found.</p>
                        </div>
                    )}
                </div>
            </section>

            {isModalOpen ? (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="section-title">{editingRow ? 'Edit Staff' : 'Add Staff'}</h2>
                            <button className="close-btn" type="button" onClick={() => setIsModalOpen(false)}>
                                X
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <Input
                                    label="Name"
                                    value={form.name}
                                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={form.email}
                                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                                    required
                                />
                                <Input
                                    label="Phone (optional)"
                                    value={form.phone}
                                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                                />

                                {!editingRow ? (
                                    <Input
                                        label="Password"
                                        type="password"
                                        value={form.password}
                                        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                                        required
                                    />
                                ) : null}

                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-input"
                                        value={form.role}
                                        onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                                        style={{ paddingLeft: '1rem' }}
                                        required
                                    >
                                        {ROLE_FORM_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-text" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </DashboardLayout>
    );
};

export default Staff;
