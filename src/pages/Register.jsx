import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { authAPI } from '../utils/api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
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
            await authAPI.signup(formData);
            alert('تم إنشاء الحساب بنجاح! برجاء تسجيل الدخول.');
            navigate('/login');
        } catch (err) {
            setError(err.message || 'فشل إنشاء الحساب. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="JOIN THE CLUB"
            subtitle="Create an account and start your journey"
        >
            <form onSubmit={handleSubmit}>
                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <Input
                    icon={User}
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

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
                    icon={Phone}
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
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

                <div className="mb-6 mt-4">
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        By registering, you agree to our <a href="#" className="text-link">Terms</a> & <a href="#" className="text-link">Privacy Policy</a>
                    </p>
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </Button>

                <div className="text-center mt-6">
                    <p style={{ color: 'var(--text-muted)' }}>
                        Already a member?{' '}
                        <Link to="/login" className="text-link">SIGN IN</Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Register;
