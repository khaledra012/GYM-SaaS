import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, Shield } from 'lucide-react';

const SuperAdminLayout = ({ children }) => {
    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/platform-admin/login';
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar sa-sidebar">
                <div className="sidebar-header">
                    <Shield className="sidebar-logo-icon" style={{ color: '#a78bfa', filter: 'drop-shadow(0 0 5px rgba(167, 139, 250, 0.4))' }} />
                    <span className="sidebar-title" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        لوحة التحكم
                    </span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/platform-admin/dashboard"
                        className={({ isActive }) => `nav-link ${isActive ? 'active sa-active' : ''}`}
                    >
                        <LayoutDashboard size={20} />
                        <span>الرئيسية</span>
                    </NavLink>
                </nav>

                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} />
                    <span>تسجيل خروج</span>
                </button>
            </aside>

            <main className="dashboard-content">
                <div className="animated-bg"></div>
                <div className="content-wrapper" style={{ maxWidth: '1400px' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default SuperAdminLayout;
