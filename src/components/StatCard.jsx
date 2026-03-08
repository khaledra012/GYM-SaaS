import React from 'react';

const StatCard = ({ icon: Icon, label, value, trend, color = 'var(--accent-neon)' }) => {
    return (
        <div className="stat-card">
            <div className="stat-card-inner">
                <div className="stat-icon-wrapper" style={{ color: color }}>
                    <Icon size={24} />
                </div>
                <div className="stat-info">
                    <p className="stat-label">{label}</p>
                    <h3 className="stat-value">{value}</h3>
                    {trend && (
                        <p className={`stat-trend ${trend.type}`}>
                            {trend.type === 'up' ? '↑' : '↓'} {trend.value}%
                            <span> vs last month</span>
                        </p>
                    )}
                </div>
            </div>
            <div className="stat-card-bg" style={{ background: color }}></div>
        </div>
    );
};

export default StatCard;
