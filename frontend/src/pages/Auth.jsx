import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, signup, verifyOtp, resendOtp } = useContext(AuthContext);
    const navigate = useNavigate();

    const [aadhar, setAadhar] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [address, setAddress] = useState('');
    const [role, setRole] = useState('voter');
    const [otp, setOtp] = useState('');
    
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [infoMessage, setInfoMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInfoMessage('');
        setLoading(true);
        try {
            if (isOtpStep) {
                const result = await verifyOtp(aadhar, otp);
                const userRole = result?.user?.role;
                navigate(userRole === 'admin' ? '/admin' : '/dashboard');
                return;
            }

            let result;
            if (isLogin) {
                result = await login(aadhar, password);
                const userRole = result?.user?.role;
                navigate(userRole === 'admin' ? '/admin' : '/dashboard');
            } else {
                result = await signup({
                    name, email, age: Number(age), address,
                    aadharCardNumber: aadhar, password, role
                });
                setIsOtpStep(true);
                setInfoMessage(`Account created successfully! Simulated OTP: ${result.simulatedOtp}`);
            }
        } catch (err) {
            if (err.response?.data?.isUnverified) {
                setIsOtpStep(true);
                setInfoMessage(`Account not verified yet. Simulated OTP: ${err.response.data.simulatedOtp}`);
            } else {
                setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setInfoMessage('');
        setLoading(true);
        try {
            const res = await resendOtp(aadhar);
            setInfoMessage(`OTP resent successfully! Simulated OTP: ${res.simulatedOtp}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (tab) => {
        setIsLogin(tab === 'login');
        setIsOtpStep(false);
        setError('');
        setInfoMessage('');
    };

    return (
        <div className="gradient-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
                <ThemeToggle />
            </div>
            <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 2 }}>
                {/* Logo / Brand */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🗳️</div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg, #a5b4fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Enterprise Voting
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Secure • Transparent • Real-Time</p>
                </div>

                {/* Card */}
                <div className="glass-card" style={{ padding: '32px' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', marginBottom: '28px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                        {['login', 'signup'].map(tab => (
                            <button
                                key={tab}
                                disabled={isOtpStep}
                                onClick={() => switchTab(tab)}
                                style={{
                                    flex: 1, padding: '10px', border: 'none', borderRadius: '9px',
                                    fontSize: '14px', fontWeight: '600', fontFamily: 'Inter, sans-serif',
                                    cursor: isOtpStep ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', textTransform: 'capitalize',
                                    background: (isLogin && tab === 'login') || (!isLogin && tab === 'signup')
                                        ? 'var(--text-primary)'
                                        : 'transparent',
                                    color: (isLogin && tab === 'login') || (!isLogin && tab === 'signup') ? 'var(--bg-dark)' : 'var(--text-muted)',
                                    opacity: isOtpStep ? 0.5 : 1
                                }}
                            >
                                {tab === 'login' ? '🔐 Login' : '✨ Sign Up'}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Info/OTP message */}
                    {infoMessage && (
                        <div className="alert alert-success" style={{ marginBottom: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                            ℹ️ {infoMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {isOtpStep ? (
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Aadhaar OTP Verification</h3>
                                    <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>Please enter the 6-digit simulated OTP</p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Simulated OTP</label>
                                    <input className="form-input" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required maxLength="6" pattern="\d{6}" style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }} />
                                </div>
                                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                    {loading ? '⏳ Verifying...' : '✅ Verify & Login'}
                                </button>
                                <button type="button" onClick={handleResendOtp} className="btn btn-secondary btn-full" disabled={loading} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                                    🔄 Resend OTP
                                </button>
                                <button type="button" onClick={() => setIsOtpStep(false)} className="btn btn-full" style={{ background: 'transparent', color: '#6b7280', border: 'none' }}>
                                    ← Back
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Signup-only fields */}
                                {!isLogin && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Full Name</label>
                                            <input className="form-input" type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email Address</label>
                                            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label">Age</label>
                                                <input className="form-input" type="number" placeholder="18+" value={age} onChange={e => setAge(e.target.value)} required min="18" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Role</label>
                                                <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                                                    <option value="voter">Voter</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Address</label>
                                            <input className="form-input" type="text" placeholder="Your city / district" value={address} onChange={e => setAddress(e.target.value)} required />
                                        </div>
                                    </>
                                )}

                                {/* Common fields */}
                                <div className="form-group">
                                    <label className="form-label">Aadhar Card Number</label>
                                    <input className="form-input" type="text" placeholder="12-digit Aadhar number" value={aadhar} onChange={e => setAadhar(e.target.value)} required maxLength="12" pattern="\d{12}" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input className="form-input" type="password" placeholder={isLogin ? 'Your password' : 'Min. 6 characters'} value={password} onChange={e => setPassword(e.target.value)} required minLength="6" />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-full"
                                    disabled={loading}
                                    style={{ marginTop: '8px', opacity: loading ? 0.7 : 1, position: 'relative' }}
                                >
                                    {loading ? '⏳ Please wait...' : (isLogin ? '🔐 Login Securely' : '🚀 Create Account')}
                                </button>
                            </>
                        )}
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', color: '#4b5563', fontSize: '12px' }}>
                    🔒 Secured with JWT HTTP-only Cookies, Helmet & Rate Limiting
                </p>
            </div>
        </div>
    );
};

export default Auth;
