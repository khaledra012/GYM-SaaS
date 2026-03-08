import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { checkinsAPI } from '../utils/api';
import { Scan, UserCheck, XCircle, AlertTriangle } from 'lucide-react';
import Button from '../components/Button';

// Audio objects (could be replaced with actual audio files if available)
// Use simple browser beeps or empty for now
const playSuccessSound = () => {
    try {
        const audio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3'); // short success ding
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play prevented', e));
    } catch { }
};

const playErrorSound = () => {
    try {
        const audio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/09/audio_9e3d820dd3.mp3'); // short error beep
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play prevented', e));
    } catch { }
};

const CheckIn = () => {
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null); // { type: 'success' | 'error', data: {}, message: '' }
    const inputRef = useRef(null);

    // Keep focus on the input field for continuous scanning
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [result]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const code = inputValue.trim();
        if (!code) return;

        setIsSubmitting(true);
        setResult(null);

        try {
            const response = await checkinsAPI.submitCheckin(code);
            // The response itself is the result data format described
            // { status: 'success', data: { result: 'approved' | 'denied', ... } }
            const checkinData = response.data || response;

            if (checkinData.result === 'approved') {
                // Frontend specific rule: both member and subscription must be active to allow entry
                const isMemberActive = checkinData.member?.status === 'active';
                const isSubActive = checkinData.subscription?.status === 'active';

                if (!isMemberActive || !isSubActive) {
                    playErrorSound();
                    let errMsg = 'الدخول مرفوض:';
                    if (!isMemberActive) errMsg += ' العضو ليس نشطاً.';
                    if (!isSubActive) errMsg += ' الاشتراك غير ساري.';

                    setResult({
                        type: 'error',
                        data: checkinData,
                        message: errMsg
                    });
                } else {
                    playSuccessSound();
                    setResult({
                        type: 'success',
                        data: checkinData,
                        message: checkinData.message || `مرحباً، ${checkinData.member?.name || 'عضو'}!`
                    });
                }
            } else {
                // Denied but not an HTTP error (business logic denial like cooldown)
                playErrorSound();
                let errMsg = checkinData.denyReasonMessage || checkinData.message || 'الدخول غير صالح';
                if (checkinData.denyReasonCode === 'cooldown_active') {
                    errMsg += ` - برجاء الانتظار ${checkinData.cooldownRemainingMinutes} دقيقة.`;
                }
                setResult({
                    type: 'error',
                    data: checkinData,
                    message: errMsg
                });
            }
        } catch (error) {
            // General HTTP or network errors
            playErrorSound();
            setResult({
                type: 'error',
                data: null,
                message: error.message || 'حدث خطأ في الاتصال بالخادم.'
            });
        } finally {
            setInputValue('');
            setIsSubmitting(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    return (
        <DashboardLayout>
            <div className="page-header mb-8">
                <header>
                    <h1 className="page-title">Check-in Desk</h1>
                    <p className="page-subtitle">Scan member barcode or manually enter member code.</p>
                </header>
            </div>

            <section className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
                <Scan size={64} color="var(--accent-neon)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />

                <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Scan Barcode or Type Code..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '1rem 1.5rem',
                                fontSize: '1.5rem',
                                textAlign: 'center',
                                borderRadius: '12px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-main)',
                                border: '2px solid var(--card-border)',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                letterSpacing: '2px'
                            }}
                            autoFocus
                        />
                    </div>
                </form>

                {isSubmitting && <div className="text-muted">Processing...</div>}

                {result && (
                    <div
                        className={`result-card ${result.type}`}
                        style={{
                            padding: '2rem',
                            borderRadius: '16px',
                            background: result.type === 'success' ? 'rgba(57, 255, 20, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `2px solid ${result.type === 'success' ? 'rgba(57, 255, 20, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            animation: 'slideUp 0.3s ease-out'
                        }}
                    >
                        {result.type === 'success' ? (
                            <UserCheck size={48} color="var(--accent-neon)" style={{ margin: '0 auto 1rem' }} />
                        ) : (
                            result.data?.denyReasonCode === 'cooldown_active' ?
                                <AlertTriangle size={48} color="#fb923c" style={{ margin: '0 auto 1rem' }} /> :
                                <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                        )}

                        <h2 style={{
                            fontSize: '1.8rem',
                            margin: '0 0 1rem',
                            color: result.type === 'success' ? 'var(--accent-neon)' : '#ef4444'
                        }}>
                            {result.message}
                        </h2>

                        {result.data?.member && (
                            <div style={{ textAlign: 'left', marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <p style={{ margin: '0 0 0.5rem' }}><strong>Name:</strong> {result.data.member.name}</p>
                                <p style={{ margin: '0 0 0.5rem' }}><strong>Code:</strong> {result.data.member.code}</p>
                                {result.data.subscription && (
                                    <p style={{ margin: '0' }}>
                                        <strong>Active Sub:</strong> {result.data.subscription.plan?.name || 'Session/Time Based'}
                                        {result.data.subscription.endDate && ` (until ${new Date(result.data.subscription.endDate).toLocaleDateString()})`}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </section>
        </DashboardLayout>
    );
};

export default CheckIn;
