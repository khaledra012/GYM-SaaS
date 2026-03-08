import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { authAPI } from '../utils/api';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await authAPI.login(formData.email, formData.password);
            console.log('Login successful', data);

            // Backend returns: { status, message, data: { token, center: { id, name } } }
            const token = data.data?.token || data.token;
            if (token) {
                localStorage.setItem('token', token);
            }

            // Extract center/gym name from the nested response
            const gymName = data.data?.center?.name || data.data?.centerName || data.centerName || data.gym?.name;
            if (gymName) {
                localStorage.setItem('gymName', gymName);
            }

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="WELCOME BACK"
            subtitle="Enter your credentials to access your account"
        >
            <form onSubmit={handleSubmit}>
                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <Input
                    icon={Mail}
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <Input
                    icon={Lock}
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <div className="flex-between mb-6">
                    <div className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            id="remember"
                            style={{
                                accentColor: 'var(--accent-neon)',
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer'
                            }}
                        />
                        <label htmlFor="remember" className="form-label" style={{ margin: 0, cursor: 'pointer', color: 'var(--text-muted)' }}>
                            Remember me
                        </label>
                    </div>
                    <Link to="/forgot-password" className="text-link" style={{ fontSize: '0.9rem' }}>
                        Forgot password?
                    </Link>
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                </Button>

                <div className="text-center mt-6">
                    <p style={{ color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" className="text-link">SIGN UP</Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Login;
