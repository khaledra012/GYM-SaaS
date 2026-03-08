import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Package, LogOut, Dumbbell, ScanBarcode, ClipboardList, Wallet, ChevronDown, ChevronRight } from 'lucide-react';

const Sidebar = () => {
    const gymName = localStorage.getItem('gymName') || 'NEON GYM';
    const location = useLocation();

    // Check if any accounting route is active
    const isAccountingActive = location.pathname.startsWith('/accounting');
    const [isAccountingOpen, setIsAccountingOpen] = useState(isAccountingActive);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('gymName');
        window.location.href = '/login';
    };

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/checkin', icon: ScanBarcode, label: 'Check-in Desk' },
        { path: '/today-log', icon: ClipboardList, label: 'Today\'s Log' },
        { path: '/members', icon: Users, label: 'Members' },
        { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
        { path: '/plans', icon: Package, label: 'Plans' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Dumbbell className="sidebar-logo-icon" />
                <span className="sidebar-title">{gymName}</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                {/* Accounting Dropdown */}
                <div className={`nav-item-has-children ${isAccountingOpen ? 'open' : ''}`}>
                    <div
                        className={`nav-link nav-link-main ${isAccountingActive ? 'active-parent' : ''}`}
                        onClick={() => setIsAccountingOpen(!isAccountingOpen)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Wallet size={20} />
                            <span>المالية والخزنة</span>
                        </div>
                        {isAccountingOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>

                    <div className="nav-submenu">
                        <NavLink
                            to="/accounting/shift"
                            className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                        >
                            الملخص والوردية
                        </NavLink>
                        <NavLink
                            to="/accounting/ledger"
                            className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                        >
                            حركة الخزينة
                        </NavLink>
                        <NavLink
                            to="/accounting/history"
                            className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                        >
                            أرشيف الورديات
                        </NavLink>
                    </div>
                </div>
            </nav>

            <button onClick={handleLogout} className="logout-btn">
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </aside>
    );
};

export default Sidebar;
