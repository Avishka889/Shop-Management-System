import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ totalInventory: 0, totalOrders: 0, totalProduction: 0 });
    const [notifications, setNotifications] = useState([]);
    const [settings, setSettings] = useState({ ownerSecretPassword: '', lowStockThreshold: 0 });
    const [reportRange, setReportRange] = useState({ start: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), end: dayjs().format('YYYY-MM-DD') });
    const [newPassword, setNewPassword] = useState('');
    const [dailyProductions, setDailyProductions] = useState([]);
    const [productionReportRange, setProductionReportRange] = useState({
        start: dayjs().subtract(8, 'day').format('YYYY-MM-DD'),
        end: dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    });
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    useEffect(() => {
        fetchStats();
        fetchNotifications();
        fetchSettings();
        fetchDailyProductions();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put('/auth/profile', { password: newPassword });
            localStorage.setItem('userInfo', JSON.stringify(data));
            alert('Password updated successfully');
            setNewPassword('');
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Error updating profile';
            alert(msg);
        }

    };

    const fetchStats = async () => {
        try {
            const { data: s } = await api.get('/settings');
            const { data: productions } = await api.get('/productions');
            const { data: orders } = await api.get('/orders');
            setStats({
                totalInventory: s.totalInventory,
                totalOrders: orders.length,
                totalProduction: productions.reduce((acc, curr) => acc + curr.quantity, 0)
            });
        } catch (error) {
            console.error('Error fetching stats', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications', error);
        }
    };

    const fetchSettings = async () => {
        try {
            // Owner route to get all settings (including secret password)
            const { data } = await api.get('/settings');
            setSettings({
                ownerSecretPassword: '••••••••', // Don't show by default for security, but allow change
                lowStockThreshold: data.lowStockThreshold
            });
        } catch (error) {
            console.error('Error fetching settings', error);
        }
    };

    const fetchDailyProductions = async () => {
        try {
            const { data } = await api.get('/productions?startDate=' + productionReportRange.start + '&endDate=' + productionReportRange.end);
            setDailyProductions(data);
        } catch (error) {
            console.error('Error fetching daily productions', error);
        }
    };

    const generateProductionReport = async () => {
        try {
            const { data } = await api.get(`/productions?startDate=${productionReportRange.start}&endDate=${productionReportRange.end}`);

            if (!data || data.length === 0) {
                alert('No production data found for the selected date range.');
                return;
            }

            const doc = new jsPDF();
            doc.text('DAILY PRODUCTION REPORT', 14, 15);
            doc.text(`Range: ${productionReportRange.start} to ${productionReportRange.end}`, 14, 25);

            const tableData = data.map(item => [
                dayjs(item.date).format('YYYY-MM-DD HH:mm'),
                item.quantity
            ]);

            autoTable(doc, {
                head: [['Date/Time', 'Quantity (Units)']],
                body: tableData,
                startY: 35
            });

            doc.save(`production_report_${dayjs().format('YYYYMMDD')}.pdf`);
        } catch (error) {
            console.error('Error generating report', error);
            alert('Failed to generate report. Please try again.');
        }
    };



    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            const updateData = { lowStockThreshold: Number(settings.lowStockThreshold) };
            // Only send password if it's not the placeholder and not empty
            if (settings.ownerSecretPassword !== '••••••••' && settings.ownerSecretPassword !== '') {
                updateData.ownerSecretPassword = settings.ownerSecretPassword;
            }

            await api.put('/settings', updateData);
            alert('Settings updated successfully');
            fetchSettings(); // Refresh settings
        } catch (error) {
            const msg = error.response?.data?.message || 'Error updating settings';
            alert(msg);
        }
    };

    const generateReport = async (type) => {
        try {
            let data;
            if (type === 'production') {
                const res = await api.get(`/productions?startDate=${reportRange.start}&endDate=${reportRange.end}`);
                data = res.data;
            } else {
                const res = await api.get(`/orders?startDate=${reportRange.start}&endDate=${reportRange.end}`);
                data = res.data;
            }

            const doc = new jsPDF();
            doc.text(`${type.toUpperCase()} GLOBAL REPORT`, 14, 15);
            doc.text(`Range: ${reportRange.start} to ${reportRange.end}`, 14, 25);

            if (data.length === 0) {
                doc.text('No Data Found', 14, 35);
            } else {
                const tableData = data.map(item => [
                    dayjs(item.date).format('YYYY-MM-DD HH:mm'),
                    item.quantity,
                    item.customerName || 'Production Entry',
                    item.amount ? `$${item.amount}` : '-'
                ]);
                doc.autoTable({
                    head: [['Date/Time', 'Quantity', 'Reference', 'Value']],
                    body: tableData,
                    startY: 35
                });
            }
            doc.save(`global_${type}_report.pdf`);
        } catch (error) {
            console.error('Error generating report', error);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}`);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                        src={userInfo?.profilePicture || 'https://via.placeholder.com/50'}
                        alt="Profile"
                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                    />
                    <div className="user-profile">
                        <h2>Owner Dashboard: {userInfo?.name}</h2>
                        <p>Strategic Control Panel</p>
                    </div>
                </div>
                <Button variant="primary" onClick={handleLogout} style={{ width: 'auto' }}>Sign Out</Button>
            </header>

            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <ul className="nav-links">
                        <li className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>🏠 Overview</li>
                        <li className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ System Settings</li>
                        <li className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>📊 Master Reports</li>
                        <li className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>👤 My Profile</li>
                    </ul>

                    <div className="notification-panel">
                        <h3>System Alerts</h3>
                        {notifications
                            .filter(n => n.status === 'Pending')
                            .map(n => (
                                <div key={n._id} className={`notification-item ${n.type === 'Low Stock' ? 'low-stock' : ''}`}>
                                    <div className="notification-info">
                                        <h4>{n.type}</h4>
                                        <p>{n.message}</p>
                                        <p style={{ fontSize: '0.7rem' }}>{dayjs(n.date).format('MMM DD, YYYY')}</p>
                                        <button
                                            onClick={() => handleMarkRead(n._id)}
                                            style={{
                                                marginTop: '0.5rem',
                                                fontSize: '0.7rem',
                                                padding: '2px 8px',
                                                cursor: 'pointer',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '4px',
                                                background: 'white'
                                            }}
                                        >
                                            Mark as Read
                                        </button>
                                    </div>

                                </div>
                            ))}
                    </div>
                </aside>

                <main className="dashboard-main">
                    <div className="dashboard-grid">
                        <div className="stat-card inventory">
                            <h3>Global Stock</h3>
                            <p>{stats.totalInventory}</p>
                        </div>
                        <div className="stat-card orders">
                            <h3>Total Lifetime Orders</h3>
                            <p>{stats.totalOrders}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Production</h3>
                            <p>{stats.totalProduction}</p>
                        </div>
                    </div>

                    <div className="content-card">
                        {activeTab === 'overview' && (
                            <section>
                                <div className="card-header">
                                    <h3>Recent Daily Production</h3>
                                </div>
                                <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>Last 7 days of production entries</p>

                                {dailyProductions.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No production data available</p>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Date & Time</th>
                                                    <th>Quantity (Units)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dailyProductions.map(prod => (
                                                    <tr key={prod._id}>
                                                        <td>{dayjs(prod.date).format('MMM DD, YYYY - hh:mm A')}</td>
                                                        <td style={{ fontWeight: '700', color: '#059669' }}>{prod.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '2px dashed #e2e8f0' }}>
                                    <h4 style={{ marginBottom: '1rem', color: '#475569' }}>Generate Production Report</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div className="form-group">
                                            <label>Start Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                max={yesterday}
                                                value={productionReportRange.start}
                                                onChange={e => setProductionReportRange({ ...productionReportRange, start: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>End Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                max={yesterday}
                                                value={productionReportRange.end}
                                                onChange={e => setProductionReportRange({ ...productionReportRange, end: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <Button variant="primary" onClick={generateProductionReport} style={{ width: '100%' }}>
                                        📄 Download PDF Report
                                    </Button>
                                </div>



                            </section>
                        )}

                        {activeTab === 'settings' && (
                            <section>
                                <div className="card-header">
                                    <h3>Control Settings</h3>
                                </div>
                                <form onSubmit={handleUpdateSettings}>
                                    <div className="form-group">
                                        <label>New Secret Owner Password (Supervisor Authorization)</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Leave empty to keep current"
                                            value={settings.ownerSecretPassword === '••••••••' ? '' : settings.ownerSecretPassword}
                                            onChange={e => setSettings({ ...settings, ownerSecretPassword: e.target.value })}
                                        />
                                        <small style={{ color: '#64748b' }}>
                                            {settings.ownerSecretPassword === '••••••••'
                                                ? 'Current password is masked. Type here to change it.'
                                                : 'You are changing the secret password.'}
                                        </small>
                                    </div>
                                    <div className="form-group">
                                        <label>Low Stock Threshold</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={settings.lowStockThreshold}
                                            onChange={e => setSettings({ ...settings, lowStockThreshold: e.target.value })}
                                        />
                                        <small style={{ color: '#64748b' }}>Alerts triggered when inventory falls below this value.</small>
                                    </div>
                                    <Button type="submit" variant="primary">Save Changes</Button>
                                </form>
                            </section>
                        )}

                        {activeTab === 'reports' && (
                            <section>
                                <div className="card-header">
                                    <h3>Full System Reports</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" className="form-control" value={reportRange.start} onChange={e => setReportRange({ ...reportRange, start: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" className="form-control" value={reportRange.end} onChange={e => setReportRange({ ...reportRange, end: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Button variant="primary" onClick={() => generateReport('production')}>Master Production Report</Button>
                                    <Button variant="secondary" onClick={() => generateReport('order')}>Master Sales/Order Report</Button>
                                </div>
                            </section>
                        )}

                        {activeTab === 'profile' && (
                            <section>
                                <div className="card-header">
                                    <h3>User Profile Settings</h3>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                                    <img
                                        src={userInfo?.profilePicture || 'https://via.placeholder.com/100'}
                                        alt="Large Profile"
                                        style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                    />
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{userInfo?.name}</h4>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Role: {userInfo?.role}</p>
                                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)' }}>Username: {userInfo?.username}</p>
                                    </div>
                                </div>

                                <div className="card-header" style={{ marginBottom: '1rem' }}>
                                    <h3>Change Account Password</h3>
                                </div>
                                <form onSubmit={handleUpdateProfile}>
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" variant="primary">Update Password</Button>
                                </form>
                            </section>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OwnerDashboard;
