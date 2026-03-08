import React from 'react';
import { Dumbbell } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="auth-container">
            {/* Dynamic Background */}
            <div className="animated-bg"></div>

            <div className="auth-card">
                <div className="auth-header text-center">
                    <Dumbbell className="logo-icon" />
                    <h1 className="auth-title">{title}</h1>
                    {subtitle && <p className="auth-subtitle">{subtitle}</p>}
                </div>

                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
