import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClass = variant === 'text' ? 'btn btn-text' : 'btn btn-primary';

    return (
        <button
            className={`${baseClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
