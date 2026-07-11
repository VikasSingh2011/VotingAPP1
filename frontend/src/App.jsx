import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

// Shows a loading screen until auth state is resolved
const PrivateRoute = ({ children, requiredRole }) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#6b7280' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗳️</div>
                <p>Loading Enterprise App...</p>
            </div>
        </div>
    );

    if (!user) return <Navigate to="/login" />;
    
    // Role guard
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

const AppRoutes = () => {
    const { user, loading } = useContext(AuthContext);

    // While checking auth, don't redirect prematurely
    const getDefaultRedirect = () => {
        if (loading) return '/login';
        if (!user) return '/login';
        return user.role === 'admin' ? '/admin' : '/dashboard';
    };

    return (
        <Router>
            <Routes>
                {/* Public Auth Page */}
                <Route
                    path="/login"
                    element={user ? <Navigate to={getDefaultRedirect()} /> : <Auth />}
                />

                {/* Voter Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute requiredRole="voter">
                            <Dashboard />
                        </PrivateRoute>
                    }
                />

                {/* Admin Dashboard */}
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute requiredRole="admin">
                            <AdminDashboard />
                        </PrivateRoute>
                    }
                />

                {/* Catch all — redirect based on role */}
                <Route path="*" element={<Navigate to={getDefaultRedirect()} />} />
            </Routes>
        </Router>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
