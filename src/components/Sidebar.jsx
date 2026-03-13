import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Package, LogOut, Dumbbell, ScanBarcode, ClipboardList, Wallet, ChevronDown, ChevronRight, Sun, Moon } from 'lucide-react';

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

    // Theme logic
    const [isLightMode, setIsLightMode] = useState(() => {
        return localStorage.getItem('theme') === 'light';
    });

    useEffect(() => {
        if (isLightMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isLightMode]);

    const toggleTheme = () => {
        setIsLightMode(prev => !prev);
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
            <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Dumbbell className="sidebar-logo-icon" />
                    <span className="sidebar-title">{gymName}</span>
                </div>
                <button 
                    onClick={toggleTheme}
                    className="btn-icon"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '4px', height: 'auto', width: 'auto' }}
                    title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
                >
                    {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
                </button>
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
                            <span>Finance & Safe</span>
                        </div>
                        {isAccountingOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>

                    <div className="nav-submenu">
                        <NavLink
                            to="/accounting/shift"
                            className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                        >
                            Summary & Shift
                        </NavLink>
                        <NavLink
                            to="/accounting/ledger"
                            className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                        >
                            Safe Ledger
                        </NavLink>
                        <NavLink
                            to="/accounting/history"
                            className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                        >
                            Shifts Archive
                        </NavLink>
                        <NavLink
                            to="/accounting/debts"
                            className={({ isActive }) => `nav-submenu-link ${isActive ? 'active' : ''}`}
                        >
                            Debts
                        </NavLink>
                    </div>
                </div>
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={handleLogout} className="logout-btn" style={{ marginTop: 0 }}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
