import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { platformAdminAPI } from '../utils/api';

const SuperAdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
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
            await platformAdminAPI.login(formData.email, formData.password);
            navigate('/platform-admin/dashboard');
        } catch (err) {
            setError(err.message || 'فشل تسجيل الدخول. تأكد من البيانات.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="animated-bg"></div>

            <div className="auth-card">
                <div className="auth-header text-center">
                    <Shield className="logo-icon" style={{ color: '#a78bfa', filter: 'drop-shadow(0 0 10px rgba(167, 139, 250, 0.4))' }} />
                    <h1 className="auth-title" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        PLATFORM ADMIN
                    </h1>
                    <p className="auth-subtitle">لوحة التحكم الرئيسية — تسجيل دخول المشرف</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="rtl-text" style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="rtl-text">
                        <Input
                            icon={Mail}
                            type="email"
                            name="email"
                            placeholder="البريد الإلكتروني"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            icon={Lock}
                            type="password"
                            name="password"
                            placeholder="كلمة المرور"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default SuperAdminLogin;
