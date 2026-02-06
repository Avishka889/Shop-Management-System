import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OwnerDashboard from './pages/OwnerDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import './styles/Dashboards.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/owner-dashboard" element={<OwnerDashboard />} />
                <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
