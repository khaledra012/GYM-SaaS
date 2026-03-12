import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { authAPI } from '../utils/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }

        if (password.length < 8) {
            setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.resetPassword(token, password);
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'حدث خطأ. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <AuthLayout title="PASSWORD RESET">
                <div className="text-center pointer-events-none mb-6">
                    <CheckCircle2 size={80} color="var(--accent-neon)" style={{ margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 10px var(--accent-neon-shadow))' }} />
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        Password reset successful!
                    </p>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Redirecting to login...
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="NEW PASSWORD"
            subtitle="Enter a strong new password"
        >
            <form onSubmit={handleSubmit}>
                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <Input
                    icon={Lock}
                    type="password"
                    name="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <Input
                    icon={Lock}
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                <div className="mt-6 mb-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'SAVING...' : 'SAVE NEW PASSWORD'}
                    </Button>
                </div>

                <div className="text-center mt-4">
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Button type="button" variant="text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', margin: '0 auto' }}>
                            <ArrowLeft size={18} />
                            BACK TO LOGIN
                        </Button>
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
};

export default ResetPassword;
