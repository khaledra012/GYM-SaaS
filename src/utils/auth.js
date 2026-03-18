export const getStoredActor = () => {
    try {
        const raw = localStorage.getItem('actor');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return {
            type: parsed.type || null,
            role: parsed.role || null
        };
    } catch {
        return null;
    }
};

export const getActorRole = () => getStoredActor()?.role || null;

export const hasAnyRole = (roles = []) => {
    const role = getActorRole();
    if (!role) return false;
    return roles.includes(role);
};

export const clearClientSessionStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('gymName');
    localStorage.removeItem('billingStatus');
    localStorage.removeItem('trialDaysLeft');
    localStorage.removeItem('subscriptionDaysLeft');
    localStorage.removeItem('actor');
};
