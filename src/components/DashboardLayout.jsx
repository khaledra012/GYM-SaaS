import React from 'react';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="dashboard-content">
                <div className="animated-bg"></div>
                <div className="content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
