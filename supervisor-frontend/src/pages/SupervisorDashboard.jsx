import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SupervisorDashboard = () => {
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const [activeTab, setActiveTab] = useState('inventory');
    const [stats, setStats] = useState({ totalInventory: 0, totalOrders: 0, totalProduction: 0 });
    const [notifications, setNotifications] = useState([]);
    const [showMissingModal, setShowMissingModal] = useState(false);
    const [secretPassword, setSecretPassword] = useState('');
    const [missingDate, setMissingDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Form states
    const [productionQty, setProductionQty] = useState('');
    const [orderData, setOrderData] = useState({ customerName: '', quantity: '', amount: '' });
    const [salaryData, setSalaryData] = useState({ employeeName: '', amount: '', date: dayjs().format('YYYY-MM-DD') });
    const [supplierData, setSupplierData] = useState({ name: '', contact: '', address: '', items: '' });

    // Report states
    const [reportRange, setReportRange] = useState({
        start: dayjs().subtract(8, 'day').format('YYYY-MM-DD'),
        end: dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    });
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    const [reportData, setReportData] = useState([]);
    const [newPassword, setNewPassword] = useState('');
    const [prevDayProduction, setPrevDayProduction] = useState(0);
    const [currentTime, setCurrentTime] = useState(dayjs());

    // Sync Production states
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [syncDate, setSyncDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [syncQty, setSyncQty] = useState('');
    const [syncPassword, setSyncPassword] = useState('');
    const [syncStatus, setSyncStatus] = useState('Checking...');

    useEffect(() => {
        fetchStats();
        fetchNotifications();

        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put('/auth/profile', { password: newPassword });
            localStorage.setItem('userInfo', JSON.stringify(data));
            alert('Password updated successfully');
            setNewPassword('');
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating profile');
        }
    };

    const fetchStats = async () => {
        try {
            const { data: settings } = await api.get('/settings');
            const { data: productions } = await api.get('/productions');
            const { data: orders } = await api.get('/orders');

            const totalProd = productions.reduce((acc, curr) => acc + curr.quantity, 0);
            const totalOrd = orders.reduce((acc, curr) => acc + curr.quantity, 0);

            setStats({
                totalInventory: settings.totalInventory,
                totalOrders: totalOrd,
                totalProduction: totalProd
            });

            // Calculate Previous Day's Production
            const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
            const prevDayProd = productions
                .filter(p => dayjs(p.date).format('YYYY-MM-DD') === yesterday)
                .reduce((acc, curr) => acc + curr.quantity, 0);

            setPrevDayProduction(prevDayProd);
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

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const fetchProductionByDate = async (date) => {
        setSyncStatus('Fetching data...');
        try {
            const { data } = await api.get(`/productions/date/${date}`);
            if (data) {
                setSyncQty(data.quantity);
                setSyncStatus(`Existing Production: ${data.quantity} Units found.`);
            } else {
                setSyncQty('');
                setSyncStatus('No data for this date. (Missing daily production)');
            }
        } catch (error) {
            console.error('Error fetching production by date', error);
            setSyncStatus('Error checking data.');
        }
    };

    const handleSyncProduction = async () => {
        if (!syncQty || !syncDate || !syncPassword) {
            alert('Please fill all fields');
            return;
        }
        try {
            const { data } = await api.post('/productions/sync', {
                date: syncDate,
                quantity: syncQty,
                secretPassword: syncPassword
            });
            if (data.success) {
                alert(data.message);
                setShowSyncModal(false);
                setSyncPassword('');
                setSyncQty('');
                fetchStats();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating production');
        }
    };

    const handleProductionSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/productions', {
                quantity: productionQty,
                date: isAuthorized ? missingDate : new Date()
            });
            alert('Production added successfully');
            setProductionQty('');
            setIsAuthorized(false);
            fetchStats();
            fetchNotifications();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding production');
        }
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/orders', {
                ...orderData,
                date: isAuthorized ? missingDate : new Date()
            });
            alert('Order added successfully');
            setOrderData({ customerName: '', quantity: '', amount: '' });
            setIsAuthorized(false);
            fetchStats();
            fetchNotifications();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding order');
        }
    };

    const handleVerifySecret = async () => {
        try {
            const { data } = await api.post('/settings/verify-secret', { secretPassword });
            if (data.success) {
                setIsAuthorized(true);
                setShowMissingModal(false);
                setSecretPassword('');
            }
        } catch (error) {
            alert('Invalid Secret Password');
        }
    };

    const generateReport = async (type) => {
        try {
            let data;
            const url = type === 'production'
                ? `/productions?startDate=${reportRange.start}&endDate=${reportRange.end}`
                : `/orders?startDate=${reportRange.start}&endDate=${reportRange.end}`;

            const res = await api.get(url);
            data = res.data;

            if (!data || data.length === 0) {
                alert(`No ${type} data found for the selected date range.`);
                return;
            }

            const doc = new jsPDF();
            doc.text(`${type.toUpperCase()} REPORT`, 14, 15);
            doc.text(`Range: ${reportRange.start} to ${reportRange.end}`, 14, 25);

            const tableData = data.map(item => [
                dayjs(item.date).format('YYYY-MM-DD HH:mm'),
                item.quantity,
                item.customerName || 'N/A',
                item.amount ? `$${item.amount}` : 'N/A'
            ]);

            autoTable(doc, {
                head: [['Date/Time', 'Quantity', 'Reference', 'Value']],
                body: tableData,
                startY: 35
            });

            doc.save(`${type}_report_${dayjs().format('YYYYMMDD')}.pdf`);
        } catch (error) {
            console.error('Error generating report', error);
            alert('Failed to generate report. Please try again.');
        }
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
                        <h2>Supervisor: {userInfo?.name}</h2>
                        <p>Shop Management System - Role: {userInfo?.role}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => setShowMissingModal(true)}>Missing Data Entry</Button>
                    <Button variant="primary" onClick={handleLogout} style={{ width: 'auto' }}>End Session</Button>
                </div>
            </header>

            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <ul className="nav-links">
                        <li className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>📦 Inventory & Production</li>
                        <li className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>🛒 Customer Orders</li>
                        <li className={`nav-item ${activeTab === 'salaries' ? 'active' : ''}`} onClick={() => setActiveTab('salaries')}>💰 Salary Management</li>
                        <li className={`nav-item ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>🚛 Suppliers</li>
                        <li className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>📊 Reports</li>
                        <li className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>👤 My Profile</li>
                    </ul>

                    <div className="notification-panel">
                        <h3>Notifications</h3>
                        {notifications.length === 0 && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No alerts today.</p>}
                        {notifications
                            .filter(n => n.status === 'Pending')
                            .map(n => (
                                <div key={n._id} className={`notification-item ${n.type === 'Low Stock' ? 'low-stock' : ''}`}>
                                    <div className="notification-info">
                                        <h4>{n.type}</h4>
                                        <p>{n.message}</p>
                                        <p style={{ fontSize: '0.7rem' }}>{dayjs(n.date).format('MMM DD')}</p>
                                    </div>
                                    <span className={`status-badge status-pending`}>
                                        {n.status}
                                    </span>
                                </div>
                            ))}
                    </div>
                </aside>

                <main className="dashboard-main">
                    <div className="dashboard-grid">
                        <div className="stat-card inventory">
                            <h3>Remaining Inventory</h3>
                            <p>{stats.totalInventory} Units</p>
                        </div>
                        <div className="stat-card orders">
                            <h3>Total Orders</h3>
                            <p>{stats.totalOrders}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Production</h3>
                            <p>{stats.totalProduction}</p>
                        </div>
                    </div>

                    <div className="content-card">
                        {isAuthorized && (
                            <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fef3c7' }}>
                                <p style={{ color: '#92400e', fontWeight: 'bold', margin: '0' }}>⚠️ Authorized for Missing Data Entry</p>
                                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                                    <label>Select Date for Missing Data:</label>
                                    <input type="date" className="form-control" value={missingDate} onChange={(e) => setMissingDate(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'inventory' && (
                            <section>
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3>Daily Production Entry</h3>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setShowSyncModal(true);
                                            fetchProductionByDate(syncDate);
                                        }}
                                        style={{ width: 'auto', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                    >
                                        ➕ Add or Update Daily Production
                                    </Button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                    {/* Previous Production Card */}
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        background: '#fdf2f8',
                                        borderRadius: '10px',
                                        border: '1px solid #fbcfe8',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        width: 'fit-content'
                                    }}>
                                        <span style={{ fontSize: '1rem' }}>📈</span>
                                        <p style={{ margin: 0, color: '#9d174d', fontWeight: '600', fontSize: '0.9rem' }}>
                                            Yesterday's Total Production: <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{prevDayProduction} Units</span>
                                        </p>
                                    </div>

                                    {/* Timer Card */}
                                    <div style={{
                                        padding: '1rem',
                                        background: '#f0f9ff',
                                        borderRadius: '12px',
                                        border: '1px solid #bae6fd',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>🕒</span>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '700', color: '#0369a1', fontSize: '1.1rem' }}>
                                                {currentTime.format('dddd, MMMM D, YYYY')}
                                            </p>
                                            <p style={{ margin: 0, color: '#0ea5e9', fontSize: '0.9rem', fontWeight: '500' }}>
                                                Current Entry Time: {currentTime.format('hh:mm:ss A')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleProductionSubmit}>
                                    <div className="form-group">
                                        <label>Production Quantity (Bags/Units)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Enter amount produced"
                                            value={productionQty}
                                            onChange={(e) => setProductionQty(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" variant="primary">Record Production</Button>
                                </form>

                                <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '2px dashed #e2e8f0' }}>
                                    <h4 style={{ marginBottom: '1rem', color: '#475569' }}>Quick Production Report</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div className="form-group">
                                            <label>Start Date</label>
                                            <input type="date" className="form-control" max={yesterday} value={reportRange.start} onChange={e => setReportRange({ ...reportRange, start: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>End Date</label>
                                            <input type="date" className="form-control" max={yesterday} value={reportRange.end} onChange={e => setReportRange({ ...reportRange, end: e.target.value })} />
                                        </div>

                                    </div>
                                    <Button variant="secondary" onClick={() => generateReport('production')} style={{ width: '100%' }}>
                                        📄 Generate Daily Production Report
                                    </Button>
                                </div>

                            </section>
                        )}

                        {activeTab === 'orders' && (
                            <section>
                                <div className="card-header">
                                    <h3>New Customer Order</h3>
                                </div>
                                <form onSubmit={handleOrderSubmit}>
                                    <div className="form-group">
                                        <label>Customer Name</label>
                                        <input type="text" className="form-control" placeholder="Enter name" value={orderData.customerName} onChange={e => setOrderData({ ...orderData, customerName: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Quantity</label>
                                        <input type="number" className="form-control" placeholder="Enter quantity" value={orderData.quantity} onChange={e => setOrderData({ ...orderData, quantity: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Total Amount</label>
                                        <input type="number" className="form-control" placeholder="Enter amount" value={orderData.amount} onChange={e => setOrderData({ ...orderData, amount: e.target.value })} required />
                                    </div>
                                    <Button type="submit" variant="primary">Place Order</Button>
                                </form>
                            </section>
                        )}

                        {activeTab === 'salaries' && (
                            <section>
                                <div className="card-header">
                                    <h3>Salary Management</h3>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    await api.post('/salaries', salaryData);
                                    alert('Salary added');
                                }}>
                                    <div className="form-group">
                                        <label>Employee Name</label>
                                        <input type="text" className="form-control" placeholder="Enter name" value={salaryData.employeeName} onChange={e => setSalaryData({ ...salaryData, employeeName: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Amount</label>
                                        <input type="number" className="form-control" placeholder="Enter amount" value={salaryData.amount} onChange={e => setSalaryData({ ...salaryData, amount: e.target.value })} required />
                                    </div>
                                    <Button type="submit" variant="primary">Save Salary Record</Button>
                                </form>
                            </section>
                        )}

                        {activeTab === 'suppliers' && (
                            <section>
                                <div className="card-header">
                                    <h3>Supplier Contact Details</h3>
                                </div>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    await api.post('/suppliers', supplierData);
                                    alert('Supplier added');
                                }}>
                                    <div className="form-group">
                                        <label>Supplier Name</label>
                                        <input type="text" className="form-control" value={supplierData.name} onChange={e => setSupplierData({ ...supplierData, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Contact Number</label>
                                        <input type="text" className="form-control" value={supplierData.contact} onChange={e => setSupplierData({ ...supplierData, contact: e.target.value })} required />
                                    </div>
                                    <Button type="submit" variant="primary">Add Supplier</Button>
                                </form>
                            </section>
                        )}

                        {activeTab === 'reports' && (
                            <section>
                                <div className="card-header">
                                    <h3>Reports & Analytics</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" className="form-control" max={yesterday} value={reportRange.start} onChange={e => setReportRange({ ...reportRange, start: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" className="form-control" max={yesterday} value={reportRange.end} onChange={e => setReportRange({ ...reportRange, end: e.target.value })} />
                                    </div>

                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Button variant="primary" onClick={() => generateReport('production')}>Download Production Report (PDF)</Button>
                                    <Button variant="secondary" onClick={() => generateReport('order')}>Download Inventory Report (PDF)</Button>
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
                                    <h3>Change Password</h3>
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

            {showMissingModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Authorize Missing Data Entry</h3>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Please enter the Owner's Secret Password to enable data entry for past dates.
                        </p>
                        <div className="form-group">
                            <label>Owner Secret Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="••••••••"
                                value={secretPassword}
                                onChange={(e) => setSecretPassword(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <Button variant="primary" onClick={handleVerifySecret}>Authorize</Button>
                            <Button variant="secondary" onClick={() => setShowMissingModal(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
            {showSyncModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3>Add or Update Daily Production</h3>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Update existing production or add missing data. Requires Owner Secret Password.
                        </p>

                        <div className="form-group">
                            <label>Secret Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Owner Secret Password"
                                value={syncPassword}
                                onChange={(e) => setSyncPassword(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Select Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={syncDate}
                                onChange={(e) => {
                                    setSyncDate(e.target.value);
                                    fetchProductionByDate(e.target.value);
                                }}
                            />
                            <p style={{
                                fontSize: '0.8rem',
                                marginTop: '0.4rem',
                                color: syncStatus.includes('Missing') || syncStatus.includes('No data') ? '#ef4444' : '#10b981',
                                fontWeight: '500'
                            }}>
                                ℹ️ {syncStatus}
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Production Quantity</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Enter quantity"
                                value={syncQty}
                                onChange={(e) => setSyncQty(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <Button variant="primary" onClick={handleSyncProduction}>Save Changes</Button>
                            <Button variant="secondary" onClick={() => setShowSyncModal(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorDashboard;
