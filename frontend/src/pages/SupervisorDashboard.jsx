import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const SupervisorDashboard = () => {
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="user-profile">
                    <h2>Welcome, {userInfo?.name} (Supervisor)</h2>
                    <p>Daily operations management.</p>
                </div>
                <Button variant="primary" onClick={handleLogout} style={{ width: 'auto' }}>Logout</Button>
            </header>

            <div className="dashboard-grid">
                <div className="stat-card">
                    <h3>Today's Sales</h3>
                    <p>$1,240.50</p>
                </div>
                <div className="stat-card">
                    <h3>Inventory Status</h3>
                    <p>85% Stocked</p>
                </div>
                <div className="stat-card">
                    <h3>Active Orders</h3>
                    <p>14</p>
                </div>
            </div>

            <div className="management-sections">
                <div className="section">
                    <h3>Daily Checklist</h3>
                    <p>Manage opening and closing tasks.</p>
                </div>
                <div className="section">
                    <h3>Stock Alerts</h3>
                    <p>Inventory items requiring immediate attention.</p>
                </div>
            </div>
        </div>
    );
};

export default SupervisorDashboard;
