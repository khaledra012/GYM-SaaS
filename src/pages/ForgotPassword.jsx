import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { authAPI } from '../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authAPI.forgotPassword(email);
            setIsSubmitted(true);
        } catch (err) {
            setError(err.message || 'فشل إرسال رابط استعادة كلمة المرور.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <AuthLayout
                title="CHECK YOUR INBOX"
            >
                <div className="text-center pointer-events-none mb-6">
                    <CheckCircle2 size={80} color="var(--accent-neon)" style={{ margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 10px var(--accent-neon-shadow))' }} />
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.1rem' }}>
                        We have sent password recovery instructions to <strong style={{ color: 'var(--text-main)' }}>{email}</strong>.
                    </p>
                </div>

                <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Button type="button" variant="text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                        <ArrowLeft size={18} />
                        BACK TO LOGIN
                    </Button>
                </Link>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="RESET PASSWORD"
            subtitle="Enter your email to receive recovery instructions"
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
                    placeholder="Registered Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="mt-6 mb-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'SENDING...' : 'SEND INSTRUCTIONS'}
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

export default ForgotPassword;
