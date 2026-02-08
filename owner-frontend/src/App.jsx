import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OwnerDashboard from './pages/OwnerDashboard';
import './styles/Dashboards.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/owner-dashboard" element={<OwnerDashboard />} />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
