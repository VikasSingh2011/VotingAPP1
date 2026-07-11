import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const fetchUser = async () => {
            try {
                const res = await api.get('/user/profile');
                setUser(res.data.user);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const login = async (aadharCardNumber, password) => {
        const res = await api.post('/user/login', { aadharCardNumber, password });
        setUser(res.data.user);
        return res.data;
    };

    const signup = async (userData) => {
        const res = await api.post('/user/signup', userData);
        // Do not set user directly on signup since it requires OTP verification
        return res.data;
    };

    const verifyOtp = async (aadharCardNumber, otp) => {
        const res = await api.post('/user/verify-otp', { aadharCardNumber, otp });
        setUser(res.data.user);
        return res.data;
    };

    const resendOtp = async (aadharCardNumber) => {
        const res = await api.post('/user/resend-otp', { aadharCardNumber });
        return res.data;
    };

    const logout = async () => {
        await api.post('/user/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, verifyOtp, resendOtp, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
