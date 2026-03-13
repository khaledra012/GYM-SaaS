import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { membersAPI } from '../utils/api';

const extractMemberRows = (response) => {
    if (Array.isArray(response?.data?.members)) return response.data.members;
    if (Array.isArray(response?.members)) return response.members;
    if (Array.isArray(response?.data?.data?.members)) return response.data.data.members;
    return [];
};

const DebtCreateModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState('');
    const [formData, setFormData] = useState({
        memberId: '',
        title: '',
        note: '',
        amount: ''
    });

    useEffect(() => {
        if (!isOpen) return;

        setFormData({
            memberId: '',
            title: '',
            note: '',
            amount: ''
        });
        setMembersError('');
        loadMembers();
    }, [isOpen]);

    const loadMembers = async () => {
        setLoadingMembers(true);
        try {
            const response = await membersAPI.getMembers({ page: 1, limit: 200 });
            const rows = extractMemberRows(response);
            setMembers(rows);
            setMembersError(rows.length === 0 ? 'Backend returned no members for this account.' : '');
        } catch (error) {
            console.error('Failed to load members for debt creation:', error);
            setMembers([]);
            setMembersError(error.message || 'Failed to load members from backend.');
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit({
            ...formData,
            memberId: Number(formData.memberId)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">Create Manual Debt</h2>
                    <button className="close-btn" onClick={onClose} type="button">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Member</label>
                            <select
                                className="form-input"
                                name="memberId"
                                value={formData.memberId}
                                onChange={handleChange}
                                required
                                disabled={loadingMembers || members.length === 0}
                                style={{ paddingLeft: '1rem' }}
                            >
                                <option value="">
                                    {loadingMembers
                                        ? 'Loading members...'
                                        : members.length === 0
                                            ? 'No members available'
                                            : 'Select member'}
                                </option>
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} - {member.phone}
                                    </option>
                                ))}
                            </select>
                            {!loadingMembers && members.length === 0 ? (
                                <p style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    {membersError || 'No members were returned from the backend.'}
                                </p>
                            ) : null}
                        </div>

                        <Input
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Example: Gym T-shirt"
                            required
                        />

                        <Input
                            label="Amount (EGP)"
                            name="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            required
                        />

                        <div className="form-group">
                            <label className="form-label">Note</label>
                            <textarea
                                className="form-input"
                                name="note"
                                rows={3}
                                value={formData.note}
                                onChange={handleChange}
                                placeholder="Optional note"
                                style={{ paddingLeft: '1rem', paddingTop: '0.75rem', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-text" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <Button type="submit" disabled={isLoading || loadingMembers} style={{ width: 'auto' }}>
                            {isLoading ? 'Saving...' : 'Create Debt'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DebtCreateModal;
