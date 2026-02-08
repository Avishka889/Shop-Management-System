import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import '../styles/LoginPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.role === 'supervisor') {
                    localStorage.setItem('userInfo', JSON.stringify(data));
                    navigate('/supervisor-dashboard');
                } else {
                    setError('Access Denied: Use the Owner Portal.');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Connection error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-glass-card">
                <div className="login-header">
                    <h1>Supervisor Portal</h1>
                    <p>Daily Operations Management</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin}>
                    <Input
                        label="User Name"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Supervisor Login'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>Protected area. <span>Supervisor Credentials Required</span></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
