import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { membersAPI } from '../utils/api';

const MemberModal = ({ isOpen, onClose, onSubmit, member, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        gender: 'male',
        status: 'active',
        membershipStart: ''
    });

    const [barcodeUrl, setBarcodeUrl] = useState(null);

    useEffect(() => {
        if (member) {
            setFormData({
                name: member.name || '',
                phone: member.phone || '',
                gender: member.gender || 'male',
                status: member.status || 'active',
                membershipStart: member.membershipStart ? new Date(member.membershipStart).toISOString().split('T')[0] : ''
            });

            // Fetch barcode if editing
            if (member.id) {
                membersAPI.getMemberBarcodeSvg(member.id)
                    .then(url => setBarcodeUrl(url))
                    .catch(err => console.error('Failed to load barcode SVG:', err));
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
        }

        // Cleanup function to revoke the object URL to avoid memory leaks
        return () => {
            if (barcodeUrl) {
                URL.revokeObjectURL(barcodeUrl);
            }
        };
    }, [member, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // 'code' is intentionally NOT in formData — backend generates it automatically
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="section-title">{member ? 'Edit Member' : 'Add New Member'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">

                        {/* Code is read-only — shown only when editing an existing member */}
                        {member?.code && (
                            <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label">Member Code (Auto-generated)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={member.code}
                                        disabled
                                        readOnly
                                        style={{
                                            paddingLeft: '1rem',
                                            opacity: 0.6,
                                            cursor: 'not-allowed',
                                            letterSpacing: '2px',
                                            fontWeight: 700
                                        }}
                                    />
                                </div>
                                {barcodeUrl && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', padding: '0.5rem', borderRadius: '8px' }}>
                                        <img src={barcodeUrl} alt="Member Barcode" style={{ height: '60px', objectFit: 'contain' }} />
                                        <button
                                            type="button"
                                            onClick={() => handlePrintBarcode(member, barcodeUrl)}
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
                                            <Printer size={16} /> Print Label
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

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
                                {member && <option value="rejected">Rejected</option>}
                            </select>
                        </div>

                        <div className="form-group">
                            <Input
                                label="Start Date"
                                name="membershipStart"
                                type="date"
                                value={formData.membershipStart}
                                onChange={handleChange}
                                required
                            />
                        </div>
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
    );
};

export default MemberModal;
