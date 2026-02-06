import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const OwnerDashboard = () => {
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
                    <h2>Welcome, {userInfo?.name} (Owner)</h2>
                    <p>Full system access enabled.</p>
                </div>
                <Button variant="primary" onClick={handleLogout} style={{ width: 'auto' }}>Logout</Button>
            </header>

            <div className="dashboard-grid">
                <div className="stat-card gold">
                    <h3>Total Revenue</h3>
                    <p>$45,280.00</p>
                </div>
                <div className="stat-card">
                    <h3>Total Branches</h3>
                    <p>12</p>
                </div>
                <div className="stat-card">
                    <h3>Total Staff</h3>
                    <p>48</p>
                </div>
            </div>

            <div className="management-sections">
                <div className="section">
                    <h3>Financial Reports</h3>
                    <p>View detailed breakdown of shop performance.</p>
                </div>
                <div className="section">
                    <h3>Staff Management</h3>
                    <p>Add, edit or remove shop supervisors.</p>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
