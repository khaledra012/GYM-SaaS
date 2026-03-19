import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileText, MessageCircle, Plug, QrCode, RefreshCw, Send } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { whatsappAPI } from '../utils/api';

const DEFAULT_TEMPLATE_FORM = {
    id: null,
    eventType: 'member_welcome',
    name: '',
    body: '',
    isActive: true
};

const DEFAULT_MESSAGE_FILTERS = {
    page: 1,
    limit: 20,
    status: '',
    eventType: '',
    memberId: '',
    campaignId: ''
};

const DEFAULT_CAMPAIGN_FORM = {
    name: '',
    audienceType: 'all_members',
    message: ''
};

const DEFAULT_CAMPAIGN_FILTERS = {
    page: 1,
    limit: 20,
    status: ''
};

const SESSION_STATUS_LABELS = {
    connecting: 'Connecting',
    qr_ready: 'QR Ready',
    connected: 'Connected',
    degraded: 'Degraded',
    paused: 'Paused',
    disconnected: 'Disconnected'
};

const MESSAGE_STATUS_LABELS = {
    pending: 'Pending',
    processing: 'Processing',
    sent: 'Sent',
    failed_retryable: 'Retrying',
    deferred: 'Deferred',
    permanent_failed: 'Failed'
};

const CAMPAIGN_STATUS_LABELS = {
    queued: 'Queued',
    running: 'Running',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled'
};

const MESSAGE_EVENT_TYPES = [
    'member_welcome',
    'subscription_expiry',
    'debt_created',
    'payment_receipt',
    'debt_follow_up',
    'manual_test',
    'campaign_broadcast'
];

const TEMPLATE_EVENT_TYPES = [
    'member_welcome',
    'subscription_expiry',
    'debt_created',
    'payment_receipt',
    'debt_follow_up'
];

const AUDIENCE_OPTIONS = [
    { value: 'all_members', label: 'All Members' },
    { value: 'active_subscriptions', label: 'Active Subscriptions' },
    { value: 'expired_subscriptions', label: 'Expired Subscriptions' }
];

const formatDateTime = (value) => {
    if (!value) return '---';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '---';
    return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const extractSessionPayload = (response) => {
    const payload = response?.data || response || {};
    return {
        module: payload.module || null,
        session: payload.session || null
    };
};

const extractMessages = (response) => {
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data?.messages)) return response.data.messages;
    return [];
};

const extractTemplates = (response) => {
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

const extractCampaigns = (response) => {
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data?.campaigns)) return response.data.campaigns;
    return [];
};

const extractCampaignPayload = (response) => response?.data || response || null;

const extractPagination = (response, fallbackLimit) => ({
    total: response?.total || response?.data?.pagination?.total || 0,
    page: response?.page || response?.data?.pagination?.page || 1,
    limit: response?.limit || response?.data?.pagination?.limit || fallbackLimit,
    totalPages: response?.totalPages || response?.data?.pagination?.totalPages || 1
});

const getTone = (status) => {
    if (['connected', 'healthy', 'sent', 'completed', 'running'].includes(status)) {
        return { color: 'var(--accent-neon)', background: 'var(--accent-neon-light)' };
    }
    if (['qr_ready', 'processing', 'pending', 'queued'].includes(status)) {
        return { color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)' };
    }
    if (['degraded', 'deferred'].includes(status)) {
        return { color: '#fbbf24', background: 'rgba(251, 191, 36, 0.14)' };
    }
    if (['paused', 'disconnected', 'failed_retryable', 'permanent_failed', 'cancelled'].includes(status)) {
        return { color: '#fca5a5', background: 'rgba(239, 68, 68, 0.15)' };
    }
    return { color: 'var(--text-main)', background: 'rgba(255,255,255,0.06)' };
};

const tabButtonStyle = (isActive) => ({
    border: isActive ? '1px solid var(--accent-neon-border)' : '1px solid var(--card-border)',
    background: isActive ? 'var(--accent-neon-light)' : 'rgba(255,255,255,0.03)',
    color: isActive ? 'var(--accent-neon)' : 'var(--text-main)',
    borderRadius: '14px',
    padding: '0.85rem 1rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
    cursor: 'pointer',
    fontWeight: '600'
});

const progressBarStyle = (value) => ({
    width: `${Math.max(0, Math.min(100, Number(value) || 0))}%`,
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, var(--accent-neon), #38bdf8)'
});

const WhatsApp = () => {
    const [activeTab, setActiveTab] = useState('connection');
    const [moduleInfo, setModuleInfo] = useState(null);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isAwaitingPairing, setIsAwaitingPairing] = useState(false);
    const [activeAction, setActiveAction] = useState('');
    const [testForm, setTestForm] = useState({ phone: '', message: '' });

    const [messages, setMessages] = useState([]);
    const [messageFilters, setMessageFilters] = useState(DEFAULT_MESSAGE_FILTERS);
    const [messagesPagination, setMessagesPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const [templates, setTemplates] = useState([]);
    const [templateForm, setTemplateForm] = useState(DEFAULT_TEMPLATE_FORM);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    const [campaignForm, setCampaignForm] = useState(DEFAULT_CAMPAIGN_FORM);
    const [campaignPreview, setCampaignPreview] = useState(null);
    const [isPreviewingCampaign, setIsPreviewingCampaign] = useState(false);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
    const [campaignFilters, setCampaignFilters] = useState(DEFAULT_CAMPAIGN_FILTERS);
    const [campaigns, setCampaigns] = useState([]);
    const [campaignsPagination, setCampaignsPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [isLoadingSelectedCampaign, setIsLoadingSelectedCampaign] = useState(false);
    const [activeCampaignAction, setActiveCampaignAction] = useState('');

    const fetchSessionStatus = async ({ silent = false } = {}) => {
        if (!silent) setIsLoadingSession(true);
        try {
            const response = await whatsappAPI.getSessionStatus();
            const payload = extractSessionPayload(response);
            setModuleInfo(payload.module);
            setSessionInfo(payload.session);
            setIsAwaitingPairing((prev) => {
                if (payload.session?.status === 'connected') return false;
                if (['connecting', 'qr_ready', 'degraded', 'paused'].includes(payload.session?.status)) return true;
                return prev;
            });
        } catch (error) {
            console.error('Failed to fetch WhatsApp session status:', error);
            if (!silent) {
                setModuleInfo(null);
                setSessionInfo(null);
            }
        } finally {
            if (!silent) setIsLoadingSession(false);
        }
    };

    const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
            const response = await whatsappAPI.getMessages(messageFilters);
            setMessages(extractMessages(response));
            setMessagesPagination(extractPagination(response, messageFilters.limit));
        } catch (error) {
            console.error('Failed to fetch WhatsApp messages:', error);
            setMessages([]);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const fetchTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
            const response = await whatsappAPI.getTemplates();
            setTemplates(extractTemplates(response));
        } catch (error) {
            console.error('Failed to fetch WhatsApp templates:', error);
            setTemplates([]);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const fetchCampaigns = async ({ silent = false } = {}) => {
        if (!silent) setIsLoadingCampaigns(true);
        try {
            const response = await whatsappAPI.getCampaigns(campaignFilters);
            const rows = extractCampaigns(response);
            setCampaigns(rows);
            setCampaignsPagination(extractPagination(response, campaignFilters.limit));
            setSelectedCampaignId((currentId) => {
                if (currentId && rows.some((item) => item.id === currentId)) return currentId;
                return rows[0]?.id || null;
            });
        } catch (error) {
            console.error('Failed to fetch WhatsApp campaigns:', error);
            setCampaigns([]);
            setSelectedCampaignId(null);
        } finally {
            if (!silent) setIsLoadingCampaigns(false);
        }
    };

    const fetchCampaignDetails = async (campaignId, { silent = false } = {}) => {
        if (!campaignId) {
            setSelectedCampaign(null);
            return;
        }
        if (!silent) setIsLoadingSelectedCampaign(true);
        try {
            const response = await whatsappAPI.getCampaign(campaignId);
            setSelectedCampaign(extractCampaignPayload(response));
        } catch (error) {
            console.error('Failed to fetch campaign details:', error);
            if (!silent) setSelectedCampaign(null);
        } finally {
            if (!silent) setIsLoadingSelectedCampaign(false);
        }
    };

    useEffect(() => {
        fetchSessionStatus();
    }, []);

    useEffect(() => {
        if (activeTab === 'messages') fetchMessages();
    }, [activeTab, messageFilters]);

    useEffect(() => {
        if (activeTab === 'templates') fetchTemplates();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'campaigns') fetchCampaigns();
    }, [activeTab, campaignFilters]);

    useEffect(() => {
        if (activeTab === 'campaigns' && selectedCampaignId) fetchCampaignDetails(selectedCampaignId);
        if (activeTab === 'campaigns' && !selectedCampaignId) setSelectedCampaign(null);
    }, [activeTab, selectedCampaignId]);

    useEffect(() => {
        const shouldPoll = isAwaitingPairing
            || ['connecting', 'qr_ready', 'degraded', 'paused', 'disconnected'].includes(sessionInfo?.status)
            || moduleInfo?.status === 'paused';
        if (!shouldPoll) return undefined;
        const timer = window.setInterval(() => {
            fetchSessionStatus({ silent: true });
        }, 4000);
        return () => window.clearInterval(timer);
    }, [isAwaitingPairing, sessionInfo?.status, moduleInfo?.status]);

    useEffect(() => {
        if (activeTab !== 'campaigns') return undefined;
        const shouldPollCampaigns = campaigns.some((item) => ['queued', 'running', 'paused'].includes(item.status))
            || ['queued', 'running', 'paused'].includes(selectedCampaign?.status);
        if (!shouldPollCampaigns) return undefined;
        const timer = window.setInterval(() => {
            fetchCampaigns({ silent: true });
            if (selectedCampaignId) fetchCampaignDetails(selectedCampaignId, { silent: true });
        }, 6000);
        return () => window.clearInterval(timer);
    }, [activeTab, campaigns, selectedCampaign?.status, selectedCampaignId]);

    const runSessionAction = async (actionKey, actionFn, successMessage) => {
        setActiveAction(actionKey);
        try {
            if (actionKey === 'connect' || actionKey === 'resume') {
                setIsAwaitingPairing(true);
            }
            await actionFn();
            await fetchSessionStatus({ silent: true });
            if (actionKey === 'disconnect') {
                setIsAwaitingPairing(false);
            }
            if (successMessage) alert(successMessage);
        } catch (error) {
            alert(error.message || 'Failed to update WhatsApp state.');
        } finally {
            setActiveAction('');
        }
    };

    const runCampaignAction = async (campaignId, actionKey, actionFn, successMessage) => {
        setActiveCampaignAction(`${actionKey}:${campaignId}`);
        try {
            await actionFn(campaignId);
            await fetchCampaigns({ silent: true });
            await fetchCampaignDetails(campaignId, { silent: true });
            if (successMessage) alert(successMessage);
        } catch (error) {
            alert(error.message || 'Failed to update campaign.');
        } finally {
            setActiveCampaignAction('');
        }
    };

    const handleSendTestMessage = async (event) => {
        event.preventDefault();
        if (!testForm.phone.trim()) {
            alert('Enter a phone number first.');
            return;
        }
        setActiveAction('test');
        try {
            await whatsappAPI.sendTestMessage({
                phone: testForm.phone.trim(),
                message: testForm.message.trim()
            });
            alert('Test message queued successfully.');
            setTestForm((prev) => ({ ...prev, message: '' }));
            if (activeTab === 'messages') fetchMessages();
        } catch (error) {
            alert(error.message || 'Failed to queue test message.');
        } finally {
            setActiveAction('');
        }
    };

    const handleTemplateSubmit = async (event) => {
        event.preventDefault();
        if (!templateForm.name.trim() || !templateForm.body.trim()) {
            alert('Template name and body are required.');
            return;
        }
        setIsSavingTemplate(true);
        try {
            const payload = {
                eventType: templateForm.eventType,
                name: templateForm.name.trim(),
                body: templateForm.body,
                isActive: Boolean(templateForm.isActive)
            };
            if (templateForm.id) {
                await whatsappAPI.updateTemplate(templateForm.id, payload);
            } else {
                await whatsappAPI.createTemplate(payload);
            }
            setTemplateForm(DEFAULT_TEMPLATE_FORM);
            fetchTemplates();
        } catch (error) {
            alert(error.message || 'Failed to save template.');
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const buildCampaignPayload = () => ({
        name: campaignForm.name.trim(),
        audienceType: campaignForm.audienceType,
        message: campaignForm.message.trim()
    });

    const handlePreviewCampaign = async () => {
        if (!campaignForm.name.trim() || !campaignForm.message.trim()) {
            alert('Campaign name and message are required before preview.');
            return;
        }

        setIsPreviewingCampaign(true);
        try {
            const response = await whatsappAPI.previewCampaign(buildCampaignPayload());
            setCampaignPreview(response?.data || response || null);
        } catch (error) {
            alert(error.message || 'Failed to preview campaign.');
        } finally {
            setIsPreviewingCampaign(false);
        }
    };

    const handleCreateCampaign = async (event) => {
        event.preventDefault();
        if (!campaignForm.name.trim() || !campaignForm.message.trim()) {
            alert('Campaign name and message are required.');
            return;
        }

        setIsCreatingCampaign(true);
        try {
            const response = await whatsappAPI.createCampaign(buildCampaignPayload());
            const campaign = response?.data?.campaign || null;
            const preview = response?.data?.preview || null;

            if (preview) {
                setCampaignPreview({
                    ...preview,
                    name: campaignForm.name,
                    audienceType: campaignForm.audienceType,
                    message: campaignForm.message
                });
            }

            setCampaignForm(DEFAULT_CAMPAIGN_FORM);
            setActiveTab('campaigns');
            await fetchCampaigns({ silent: true });

            if (campaign?.id) {
                setSelectedCampaignId(campaign.id);
                await fetchCampaignDetails(campaign.id, { silent: true });
            }

            alert(response?.message || 'Campaign created and queued successfully.');
        } catch (error) {
            alert(error.message || 'Failed to create campaign.');
        } finally {
            setIsCreatingCampaign(false);
        }
    };

    const openCampaignLogs = (campaignId) => {
        setMessageFilters({
            ...DEFAULT_MESSAGE_FILTERS,
            eventType: 'campaign_broadcast',
            campaignId: String(campaignId)
        });
        setActiveTab('messages');
    };

    const qrImageKey = sessionInfo?.lastQrAt || sessionInfo?.updatedAt || sessionInfo?.qrCodeDataUrl || 'qr-empty';

    return (
        <DashboardLayout>
            <div className="flex-between page-header mb-8" style={{ gap: '1rem', alignItems: 'flex-start' }}>
                <header>
                    <h1 className="page-title">WhatsApp Hub</h1>
                    <p className="page-subtitle">Connect the center session, launch campaigns, inspect delivery logs, and manage templates.</p>
                </header>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className="status-badge" style={{ ...getTone(sessionInfo?.status), padding: '0.5rem 0.9rem' }}>
                        Session: {SESSION_STATUS_LABELS[sessionInfo?.status] || 'Unknown'}
                    </span>
                    <span className="status-badge" style={{ ...getTone(moduleInfo?.status), padding: '0.5rem 0.9rem' }}>
                        Module: {moduleInfo?.status || 'Unknown'}
                    </span>
                </div>
            </div>

            <div className="glass-panel mb-6" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setActiveTab('connection')} style={tabButtonStyle(activeTab === 'connection')}>
                    <QrCode size={18} /> Connection
                </button>
                <button type="button" onClick={() => setActiveTab('campaigns')} style={tabButtonStyle(activeTab === 'campaigns')}>
                    <Send size={18} /> Campaigns
                </button>
                <button type="button" onClick={() => setActiveTab('messages')} style={tabButtonStyle(activeTab === 'messages')}>
                    <MessageCircle size={18} /> Messages
                </button>
                <button type="button" onClick={() => setActiveTab('templates')} style={tabButtonStyle(activeTab === 'templates')}>
                    <FileText size={18} /> Templates
                </button>
            </div>

            {activeTab === 'connection' ? (
                <>
                    {moduleInfo?.status === 'paused' ? (
                        <div className="glass-panel mb-6" style={{ borderColor: 'rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <AlertTriangle size={20} color="#fca5a5" />
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#fca5a5' }}>WhatsApp module is paused</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{moduleInfo?.reason || 'No reason provided.'}</div>
                                    </div>
                                </div>
                                <Button type="button" onClick={() => runSessionAction('resume', whatsappAPI.resumeModule, 'WhatsApp module resumed.')} disabled={activeAction === 'resume'} style={{ width: 'auto' }}>
                                    {activeAction === 'resume' ? 'Resuming...' : 'Resume Module'}
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        <section className="glass-panel">
                            <div className="flex-between mb-6" style={{ gap: '1rem' }}>
                                <div>
                                    <h2 className="section-title">Session Overview</h2>
                                    <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>Use the current backend session state only.</p>
                                </div>
                                <button type="button" onClick={() => fetchSessionStatus()} className="btn-icon">
                                    <RefreshCw size={16} />
                                </button>
                            </div>

                            {isLoadingSession ? (
                                <div className="empty-state">Loading WhatsApp session...</div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <div className="detail-card">
                                            <p className="detail-label">Phone</p>
                                            <p className="detail-value">{sessionInfo?.phone || '---'}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Last QR</p>
                                            <p className="detail-value">{formatDateTime(sessionInfo?.lastQrAt)}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Last Connected</p>
                                            <p className="detail-value">{formatDateTime(sessionInfo?.lastConnectedAt)}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Last Health Check</p>
                                            <p className="detail-value">{formatDateTime(sessionInfo?.lastHealthCheckAt || moduleInfo?.evaluatedAt)}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <Button type="button" onClick={() => runSessionAction('connect', whatsappAPI.connectSession)} disabled={activeAction === 'connect'} style={{ width: 'auto', gap: '0.5rem' }}>
                                            <Plug size={16} />
                                            {activeAction === 'connect' ? 'Connecting...' : 'Connect Session'}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => runSessionAction('disconnect', whatsappAPI.disconnectSession)}
                                            disabled={activeAction === 'disconnect'}
                                            style={{ width: 'auto', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5' }}
                                        >
                                            {activeAction === 'disconnect' ? 'Disconnecting...' : 'Disconnect Session'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </section>

                        <section className="glass-panel">
                            <h2 className="section-title mb-6">QR & Test Message</h2>

                            {sessionInfo?.status === 'qr_ready' && sessionInfo?.qrCodeDataUrl ? (
                                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                    <div style={{ background: '#fff', borderRadius: '18px', padding: '1rem', display: 'inline-flex' }}>
                                        <img key={qrImageKey} src={sessionInfo.qrCodeDataUrl} alt="WhatsApp QR" style={{ maxWidth: '100%', width: '260px', borderRadius: '12px' }} />
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>Scan the QR code from WhatsApp to complete the connection.</p>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ marginBottom: '1.5rem' }}>
                                    <p>{sessionInfo?.status === 'connected' ? 'Session is connected. QR is hidden.' : (isAwaitingPairing ? 'Waiting for a fresh QR from the server...' : 'No QR available right now.')}</p>
                                </div>
                            )}

                            <form onSubmit={handleSendTestMessage}>
                                <Input
                                    label="Test Phone"
                                    name="phone"
                                    placeholder="01012345678"
                                    value={testForm.phone}
                                    onChange={(event) => setTestForm((prev) => ({ ...prev, phone: event.target.value }))}
                                    required
                                />
                                <div className="form-group">
                                    <label className="form-label">Test Message</label>
                                    <textarea
                                        className="form-input"
                                        rows="4"
                                        placeholder="Leave empty to use backend default."
                                        value={testForm.message}
                                        onChange={(event) => setTestForm((prev) => ({ ...prev, message: event.target.value }))}
                                        style={{ resize: 'vertical', padding: '1rem' }}
                                    />
                                </div>
                                <Button type="submit" disabled={activeAction === 'test'} style={{ width: 'auto', gap: '0.5rem' }}>
                                    <Send size={16} />
                                    {activeAction === 'test' ? 'Queueing...' : 'Send Test Message'}
                                </Button>
                            </form>
                        </section>
                    </div>
                </>
            ) : null}
            {activeTab === 'campaigns' ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 0.95fr) minmax(0, 1.25fr)', gap: '1.5rem' }}>
                        <section className="glass-panel">
                            <h2 className="section-title mb-6">Create Campaign</h2>

                            <form onSubmit={handleCreateCampaign}>
                                <Input
                                    label="Campaign Name"
                                    value={campaignForm.name}
                                    onChange={(event) => setCampaignForm((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder="Win-back campaign"
                                    required
                                />

                                <div className="form-group">
                                    <label className="form-label">Audience Type</label>
                                    <select
                                        className="form-input"
                                        value={campaignForm.audienceType}
                                        onChange={(event) => setCampaignForm((prev) => ({ ...prev, audienceType: event.target.value }))}
                                        style={{ paddingLeft: '1rem' }}
                                    >
                                        {AUDIENCE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Campaign Message</label>
                                    <textarea
                                        className="form-input"
                                        rows="8"
                                        value={campaignForm.message}
                                        onChange={(event) => setCampaignForm((prev) => ({ ...prev, message: event.target.value }))}
                                        placeholder="{Welcome|Hello} {{name}}, we have a new offer at {{gym_name}}"
                                        style={{ resize: 'vertical', padding: '1rem' }}
                                        required
                                    />
                                </div>

                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.7 }}>
                                    Supported variables: <code>{'{{name}}'}</code>, <code>{'{{member_code}}'}</code>, <code>{'{{phone}}'}</code>, <code>{'{{gym_name}}'}</code>.
                                    Broadcast campaigns still apply opt-in and phone validation before queueing.
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <Button type="button" onClick={handlePreviewCampaign} disabled={isPreviewingCampaign} style={{ width: 'auto' }}>
                                        {isPreviewingCampaign ? 'Previewing...' : 'Preview'}
                                    </Button>
                                    <Button type="submit" disabled={isCreatingCampaign} style={{ width: 'auto' }}>
                                        {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setCampaignForm(DEFAULT_CAMPAIGN_FORM);
                                            setCampaignPreview(null);
                                        }}
                                        style={{ width: 'auto', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </section>

                        <section className="glass-panel">
                            <h2 className="section-title mb-6">Preview</h2>

                            {campaignPreview ? (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="detail-card">
                                            <p className="detail-label">Matched</p>
                                            <p className="detail-value">{campaignPreview.totalMatchedMembers ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Opted In</p>
                                            <p className="detail-value">{campaignPreview.optedInMembers ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Valid Phones</p>
                                            <p className="detail-value">{campaignPreview.validPhoneMembers ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Recipients</p>
                                            <p className="detail-value">{campaignPreview.recipientCount ?? 0}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <div className="detail-card">
                                            <p className="detail-label">Skipped No Opt-In</p>
                                            <p className="detail-value">{campaignPreview.skippedNoOptInCount ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Skipped Invalid Phone</p>
                                            <p className="detail-value">{campaignPreview.skippedInvalidPhoneCount ?? 0}</p>
                                        </div>
                                    </div>

                                    <div className="detail-card" style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: '700', marginBottom: '0.5rem' }}>{campaignPreview.name || campaignForm.name || 'Campaign'}</div>
                                        <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{campaignPreview.audienceType || campaignForm.audienceType}</div>
                                        <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: 'var(--font-main)', color: 'var(--text-main)' }}>
                                            {campaignPreview.message || campaignForm.message}
                                        </pre>
                                    </div>

                                    <div style={{ marginBottom: '0.75rem', fontWeight: '700' }}>Sample Recipients</div>
                                    {campaignPreview.sampleRecipients?.length ? (
                                        <div className="table-container">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Phone</th>
                                                        <th>Code</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {campaignPreview.sampleRecipients.map((item) => (
                                                        <tr key={item.memberId}>
                                                            <td>{item.name}</td>
                                                            <td>{item.phone}</td>
                                                            <td>{item.code || '---'}</td>
                                                            <td>{item.subscriptionStatus || '---'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <p>No sample recipients yet.</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="empty-state">
                                    <p>Run preview to see final recipient counts before creating the campaign.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.95fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <section className="glass-panel">
                            <div className="flex-between mb-6" style={{ gap: '1rem', alignItems: 'flex-end' }}>
                                <div>
                                    <h2 className="section-title">Campaigns</h2>
                                    <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>Worker delivery keeps running gradually with the same WhatsApp safety rules.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <div className="form-group mb-0" style={{ minWidth: '180px' }}>
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-input"
                                            value={campaignFilters.status}
                                            onChange={(event) => setCampaignFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
                                            style={{ paddingLeft: '1rem' }}
                                        >
                                            <option value="">All</option>
                                            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([status, label]) => (
                                                <option key={status} value={status}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button type="button" onClick={() => setCampaignFilters(DEFAULT_CAMPAIGN_FILTERS)} style={{ width: 'auto', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}>
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            {isLoadingCampaigns ? (
                                <div className="empty-state">Loading campaigns...</div>
                            ) : campaigns.length > 0 ? (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {campaigns.map((campaign) => {
                                        const pauseKey = `pause:${campaign.id}`;
                                        const resumeKey = `resume:${campaign.id}`;
                                        const cancelKey = `cancel:${campaign.id}`;

                                        return (
                                            <div
                                                key={campaign.id}
                                                className="detail-card"
                                                onClick={() => setSelectedCampaignId(campaign.id)}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: selectedCampaignId === campaign.id ? '1px solid var(--accent-neon-border)' : '1px solid var(--card-border)',
                                                    background: selectedCampaignId === campaign.id ? 'rgba(57, 255, 20, 0.04)' : 'rgba(255,255,255,0.02)'
                                                }}
                                            >
                                                <div className="flex-between" style={{ gap: '1rem', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '700', fontSize: '1rem' }}>{campaign.name}</div>
                                                        <div style={{ color: 'var(--text-muted)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
                                                            {campaign.audienceType} - {formatDateTime(campaign.launchedAt || campaign.createdAt)}
                                                        </div>
                                                    </div>
                                                    <span className="status-badge" style={getTone(campaign.status)}>
                                                        {CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
                                                    </span>
                                                </div>

                                                <div style={{ marginTop: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                        <span>Progress</span>
                                                        <span>{campaign.progressPercentage || 0}%</span>
                                                    </div>
                                                    <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                        <div style={progressBarStyle(campaign.progressPercentage)} />
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Delivered</div>
                                                        <div style={{ fontWeight: '700' }}>{campaign.deliveredCount ?? 0}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Failed</div>
                                                        <div style={{ fontWeight: '700' }}>{campaign.failedCount ?? 0}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Queued</div>
                                                        <div style={{ fontWeight: '700' }}>{campaign.inQueueCount ?? 0}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Deferred</div>
                                                        <div style={{ fontWeight: '700' }}>{campaign.deferredCount ?? 0}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                                    {['queued', 'running'].includes(campaign.status) ? (
                                                        <Button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                runCampaignAction(campaign.id, 'pause', whatsappAPI.pauseCampaign, 'Campaign paused.');
                                                            }}
                                                            disabled={activeCampaignAction === pauseKey}
                                                            style={{ width: 'auto', background: 'transparent', border: '1px solid rgba(251, 191, 36, 0.35)', color: '#fbbf24' }}
                                                        >
                                                            {activeCampaignAction === pauseKey ? 'Pausing...' : 'Pause'}
                                                        </Button>
                                                    ) : null}

                                                    {campaign.status === 'paused' ? (
                                                        <Button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                runCampaignAction(campaign.id, 'resume', whatsappAPI.resumeCampaign, 'Campaign resumed.');
                                                            }}
                                                            disabled={activeCampaignAction === resumeKey}
                                                            style={{ width: 'auto' }}
                                                        >
                                                            {activeCampaignAction === resumeKey ? 'Resuming...' : 'Resume'}
                                                        </Button>
                                                    ) : null}

                                                    {!['completed', 'cancelled'].includes(campaign.status) ? (
                                                        <Button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                runCampaignAction(campaign.id, 'cancel', whatsappAPI.cancelCampaign, 'Campaign cancelled.');
                                                            }}
                                                            disabled={activeCampaignAction === cancelKey}
                                                            style={{ width: 'auto', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5' }}
                                                        >
                                                            {activeCampaignAction === cancelKey ? 'Cancelling...' : 'Cancel'}
                                                        </Button>
                                                    ) : null}

                                                    <Button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            openCampaignLogs(campaign.id);
                                                        }}
                                                        style={{ width: 'auto', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}
                                                    >
                                                        Open Logs
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {campaignsPagination.totalPages > 1 ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                                            <button type="button" onClick={() => setCampaignFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={campaignsPagination.page === 1} style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: campaignsPagination.page === 1 ? 'not-allowed' : 'pointer', opacity: campaignsPagination.page === 1 ? 0.5 : 1 }}>
                                                Previous
                                            </button>
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                Page {campaignsPagination.page} of {campaignsPagination.totalPages}
                                            </span>
                                            <button type="button" onClick={() => setCampaignFilters((prev) => ({ ...prev, page: Math.min(campaignsPagination.totalPages, prev.page + 1) }))} disabled={campaignsPagination.page === campaignsPagination.totalPages} style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: campaignsPagination.page === campaignsPagination.totalPages ? 'not-allowed' : 'pointer', opacity: campaignsPagination.page === campaignsPagination.totalPages ? 0.5 : 1 }}>
                                                Next
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>No campaigns found.</p>
                                </div>
                            )}
                        </section>

                        <section className="glass-panel">
                            <h2 className="section-title mb-6">Campaign Details</h2>

                            {isLoadingSelectedCampaign ? (
                                <div className="empty-state">Loading campaign details...</div>
                            ) : selectedCampaign ? (
                                <>
                                    <div className="flex-between" style={{ gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{selectedCampaign.name || 'Campaign'}</div>
                                            <div style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>{selectedCampaign.audienceType || '---'}</div>
                                        </div>
                                        <span className="status-badge" style={getTone(selectedCampaign.status)}>
                                            {CAMPAIGN_STATUS_LABELS[selectedCampaign.status] || selectedCampaign.status}
                                        </span>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <span>Progress</span>
                                            <span>{selectedCampaign.progressPercentage || 0}%</span>
                                        </div>
                                        <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                            <div style={progressBarStyle(selectedCampaign.progressPercentage)} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.9rem' }}>
                                        <div className="detail-card">
                                            <p className="detail-label">Total Recipients</p>
                                            <p className="detail-value">{selectedCampaign.totalRecipients ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Delivered</p>
                                            <p className="detail-value">{selectedCampaign.deliveredCount ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Pending</p>
                                            <p className="detail-value">{selectedCampaign.pendingCount ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Processing</p>
                                            <p className="detail-value">{selectedCampaign.processingCount ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Retryable</p>
                                            <p className="detail-value">{selectedCampaign.retryableCount ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Deferred</p>
                                            <p className="detail-value">{selectedCampaign.deferredCount ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">Failed</p>
                                            <p className="detail-value">{selectedCampaign.failedCount ?? 0}</p>
                                        </div>
                                        <div className="detail-card">
                                            <p className="detail-label">In Queue</p>
                                            <p className="detail-value">{selectedCampaign.inQueueCount ?? 0}</p>
                                        </div>
                                    </div>

                                    <div className="detail-card" style={{ marginTop: '1rem' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Timeline</div>
                                        <div style={{ display: 'grid', gap: '0.5rem', color: 'var(--text-main)' }}>
                                            <div>Launched: {formatDateTime(selectedCampaign.launchedAt)}</div>
                                            <div>Paused: {formatDateTime(selectedCampaign.pausedAt)}</div>
                                            <div>Resumed: {formatDateTime(selectedCampaign.resumedAt)}</div>
                                            <div>Cancelled: {formatDateTime(selectedCampaign.cancelledAt)}</div>
                                            <div>Completed: {formatDateTime(selectedCampaign.completedAt)}</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state">
                                    <p>Select a campaign to inspect its live details.</p>
                                </div>
                            )}
                        </section>
                    </div>
                </>
            ) : null}
            {activeTab === 'messages' ? (
                <>
                    <div className="glass-panel mb-6" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 180px' }} className="form-group mb-0">
                            <label className="form-label">Status</label>
                            <select className="form-input" value={messageFilters.status} onChange={(event) => setMessageFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))} style={{ paddingLeft: '1rem' }}>
                                <option value="">All</option>
                                {Object.entries(MESSAGE_STATUS_LABELS).map(([status, label]) => (
                                    <option key={status} value={status}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: '1 1 220px' }} className="form-group mb-0">
                            <label className="form-label">Event Type</label>
                            <select className="form-input" value={messageFilters.eventType} onChange={(event) => setMessageFilters((prev) => ({ ...prev, eventType: event.target.value, page: 1 }))} style={{ paddingLeft: '1rem' }}>
                                <option value="">All</option>
                                {MESSAGE_EVENT_TYPES.map((eventType) => (
                                    <option key={eventType} value={eventType}>{eventType}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: '1 1 160px' }}>
                            <Input label="Member ID" value={messageFilters.memberId} onChange={(event) => setMessageFilters((prev) => ({ ...prev, memberId: event.target.value, page: 1 }))} placeholder="Optional" />
                        </div>
                        <div style={{ flex: '1 1 160px' }}>
                            <Input label="Campaign ID" value={messageFilters.campaignId} onChange={(event) => setMessageFilters((prev) => ({ ...prev, campaignId: event.target.value, page: 1 }))} placeholder="Optional" />
                        </div>
                        <Button type="button" onClick={() => setMessageFilters(DEFAULT_MESSAGE_FILTERS)} style={{ width: 'auto', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}>
                            Reset
                        </Button>
                    </div>

                    <section className="glass-panel">
                        <div className="table-container">
                            {isLoadingMessages ? (
                                <div className="empty-state">Loading WhatsApp messages...</div>
                            ) : messages.length > 0 ? (
                                <>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Campaign</th>
                                                <th>Phone</th>
                                                <th>Member</th>
                                                <th>Attempts</th>
                                                <th>Next Attempt</th>
                                                <th>Failure</th>
                                                <th>Sent At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {messages.map((item) => (
                                                <tr key={item.id}>
                                                    <td>#{item.displayNumber || item.id}</td>
                                                    <td>
                                                        <div style={{ fontWeight: '600' }}>{item.eventType}</div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.35rem' }}>
                                                            {item.renderedBody?.slice(0, 70) || '---'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="status-badge" style={getTone(item.status)}>
                                                            {MESSAGE_STATUS_LABELS[item.status] || item.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {item.campaign ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedCampaignId(item.campaign.id);
                                                                    setActiveTab('campaigns');
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: 'var(--accent-neon)', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                                                            >
                                                                {item.campaign.name}
                                                            </button>
                                                        ) : '---'}
                                                    </td>
                                                    <td>{item.phone || '---'}</td>
                                                    <td>{item.member?.name || '---'}</td>
                                                    <td>{item.attempts ?? 0}</td>
                                                    <td>{formatDateTime(item.nextAttemptAt)}</td>
                                                    <td>{item.failureReason || '---'}</td>
                                                    <td>{formatDateTime(item.sentAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {messagesPagination.totalPages > 1 ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem 0' }}>
                                            <button type="button" onClick={() => setMessageFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={messagesPagination.page === 1} style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: messagesPagination.page === 1 ? 'not-allowed' : 'pointer', opacity: messagesPagination.page === 1 ? 0.5 : 1 }}>
                                                Previous
                                            </button>
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                Page {messagesPagination.page} of {messagesPagination.totalPages}
                                            </span>
                                            <button type="button" onClick={() => setMessageFilters((prev) => ({ ...prev, page: Math.min(messagesPagination.totalPages, prev.page + 1) }))} disabled={messagesPagination.page === messagesPagination.totalPages} style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: messagesPagination.page === messagesPagination.totalPages ? 'not-allowed' : 'pointer', opacity: messagesPagination.page === messagesPagination.totalPages ? 0.5 : 1 }}>
                                                Next
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div className="empty-state">
                                    <p>No WhatsApp messages found.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            ) : null}
            {activeTab === 'templates' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.95fr)', gap: '1.5rem' }}>
                    <section className="glass-panel">
                        <div className="flex-between mb-6" style={{ gap: '1rem' }}>
                            <div>
                                <h2 className="section-title">Templates</h2>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>Default fallback templates are shown as read-only when `id = null`.</p>
                            </div>
                            <button type="button" onClick={() => fetchTemplates()} className="btn-icon">
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        {isLoadingTemplates ? (
                            <div className="empty-state">Loading templates...</div>
                        ) : templates.length > 0 ? (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {templates.map((template, index) => (
                                    <div key={`${template.id || 'default'}-${index}`} className="detail-card">
                                        <div className="flex-between" style={{ gap: '1rem', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>{template.name}</h3>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <span className="status-badge" style={getTone(template.isActive ? 'connected' : 'paused')}>
                                                        {template.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {template.isDefault ? (
                                                        <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                                                            Default
                                                        </span>
                                                    ) : null}
                                                    <span className="status-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)' }}>
                                                        {template.eventType || 'fallback'}
                                                    </span>
                                                </div>
                                            </div>
                                            {template.id ? (
                                                <Button
                                                    type="button"
                                                    onClick={() => setTemplateForm({
                                                        id: template.id,
                                                        eventType: template.eventType,
                                                        name: template.name,
                                                        body: template.body,
                                                        isActive: Boolean(template.isActive)
                                                    })}
                                                    style={{ width: 'auto', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}
                                                >
                                                    Edit
                                                </Button>
                                            ) : null}
                                        </div>
                                        <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: 'var(--font-main)', color: 'var(--text-main)' }}>
                                            {template.body}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No templates available.</p>
                            </div>
                        )}
                    </section>

                    <section className="glass-panel">
                        <h2 className="section-title mb-6">{templateForm.id ? 'Edit Template' : 'Create Template'}</h2>

                        <form onSubmit={handleTemplateSubmit}>
                            <div className="form-group">
                                <label className="form-label">Event Type</label>
                                <select className="form-input" value={templateForm.eventType} onChange={(event) => setTemplateForm((prev) => ({ ...prev, eventType: event.target.value }))} style={{ paddingLeft: '1rem' }}>
                                    {TEMPLATE_EVENT_TYPES.map((eventType) => (
                                        <option key={eventType} value={eventType}>{eventType}</option>
                                    ))}
                                </select>
                            </div>

                            <Input label="Template Name" value={templateForm.name} onChange={(event) => setTemplateForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Welcome message" required />

                            <div className="form-group">
                                <label className="form-label">Body</label>
                                <textarea className="form-input" rows="10" value={templateForm.body} onChange={(event) => setTemplateForm((prev) => ({ ...prev, body: event.target.value }))} placeholder="Use placeholders like {{name}} and {{gym_name}}." style={{ resize: 'vertical', padding: '1rem' }} required />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={templateForm.isActive} onChange={(event) => setTemplateForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
                                Template is active
                            </label>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <Button type="submit" disabled={isSavingTemplate} style={{ width: 'auto' }}>
                                    {isSavingTemplate ? 'Saving...' : (templateForm.id ? 'Update Template' : 'Create Template')}
                                </Button>
                                <Button type="button" onClick={() => setTemplateForm(DEFAULT_TEMPLATE_FORM)} style={{ width: 'auto', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}>
                                    Reset Form
                                </Button>
                            </div>
                        </form>
                    </section>
                </div>
            ) : null}
        </DashboardLayout>
    );
};

export default WhatsApp;

