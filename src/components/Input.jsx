import React from 'react';

const Input = ({ icon: Icon, label, ...props }) => {
    return (
        <div className="form-group">
            {label && <label className="form-label">{label}</label>}
            <div className="input-wrapper">
                <input
                    className={`form-input ${Icon ? 'with-icon' : ''}`}
                    {...props}
                />
                {Icon && <Icon className="input-icon" size={20} />}
            </div>
        </div>
    );
};

export default Input;
