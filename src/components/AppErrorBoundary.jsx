import React from 'react';

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('UI crash captured by AppErrorBoundary:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoLogin = () => {
        window.location.assign('/login');
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    background: '#020617',
                    color: '#f8fafc',
                    fontFamily: 'Outfit, sans-serif'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '680px',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '16px',
                        background: 'rgba(30, 41, 59, 0.75)',
                        padding: '20px'
                    }}>
                        <h2 style={{ margin: '0 0 10px', color: '#fca5a5' }}>Õ’· Œÿ√ √À‰«¡ ⁄—÷ «·’›Õ…</h2>
                        <p style={{ margin: '0 0 14px', color: '#cbd5e1' }}>
                            «·Œÿ√ œÂ ﬂ«‰ »Ì”»» ‘«‘… ”Êœ«¡. œ·Êﬁ Ì ŸÂ— «·”»» »œ· «·‘«‘… «·›«÷Ì….
                        </p>
                        <pre style={{
                            margin: 0,
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'rgba(2, 6, 23, 0.8)',
                            color: '#f8fafc',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {this.state.error?.message || 'Unknown runtime error'}
                        </pre>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    background: '#39ff14',
                                    color: '#020617',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                ≈⁄«œ…  Õ„Ì·
                            </button>
                            <button
                                onClick={this.handleGoLogin}
                                style={{
                                    border: '1px solid rgba(248, 250, 252, 0.25)',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    background: 'transparent',
                                    color: '#f8fafc',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                «·–Â«» · ”ÃÌ· «·œŒÊ·
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
