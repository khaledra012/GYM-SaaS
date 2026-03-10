const BASE_URL = 'https://gym-saas-backend.railway.internal/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
    // Handle 204 No Content (e.g., DELETE)
    if (response.status === 204) return null;

    const data = await response.json();

    // Check HTTP status first
    if (!response.ok) {
        // Backend returns { status: "fail", errors: [{ field, message }] }
        if (data.errors && Array.isArray(data.errors)) {
            const msg = data.errors.map(e => e.message).join('\n');
            const error = new Error(msg);
            error.status = response.status;
            throw error;
        }

        const error = new Error(data.message || 'حدث خطأ في العملية');
        error.status = response.status;
        throw error;
    }

    // Also check backend's own status field
    if (data.status === 'fail') {
        throw new Error(data.message || 'حدث خطأ في العملية');
    }

    return data;
};

export const authAPI = {
    signup: async (userData) => {
        const response = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    login: async (email, password) => {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await handleResponse(response);
        // Backend returns: { status, message, data: { token, center } }
        const token = data.data?.token || data.token;
        if (token) {
            localStorage.setItem('token', token);
        }
        return data;
    },

    forgotPassword: async (email) => {
        const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return handleResponse(response);
    },

    resetPassword: async (token, password) => {
        const response = await fetch(`${BASE_URL}/auth/reset-password/${token}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        return handleResponse(response);
    }
};

export const membersAPI = {
    // GET /api/v1/members/stats
    getStats: async () => {
        const response = await fetch(`${BASE_URL}/members/stats`, {
            headers: { ...getAuthHeader() }
        });
        const data = await handleResponse(response);
        // Support both { stats: {...} } and { status: "success", stats: {...} }
        return data;
    },

    // GET /api/v1/members?search=...&status=...
    getMembers: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${BASE_URL}/members${query ? `?${query}` : ''}`, {
            headers: { ...getAuthHeader() }
        });
        const data = await handleResponse(response);
        // Support both { members: [...] } and { status: "success", members: [...] }
        return data;
    },

    // GET /api/v1/members/:id
    getMember: async (id) => {
        const response = await fetch(`${BASE_URL}/members/${id}`, {
            headers: { ...getAuthHeader() }
        });
        const data = await handleResponse(response);
        // Backend may return { status: "success", data: {...} } or flat object
        return data.data || data;
    },

    // POST /api/v1/members
    addMember: async (memberData) => {
        // Exclude internal UI fields and generated fields
        const { code, id, centerId, pricePaid, ...dataToSend } = memberData;

        // Convert price tracking to cents
        if (pricePaid !== undefined && pricePaid !== '') {
            dataToSend.pricePaidCents = Math.round(Number(pricePaid) * 100);
        }

        const response = await fetch(`${BASE_URL}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(dataToSend),
        });
        return handleResponse(response);
    },

    // PATCH /api/v1/members/:id  — code is never sent, it's immutable
    updateMember: async (id, memberData) => {
        // Exclude 'code', 'id', 'centerId' fields — they are immutable or generated, must NOT be sent
        // Renaming 'id' to 'memberId' to avoid conflict with the function parameter 'id'
        const { code, id: _id, centerId, ...dataToSend } = memberData;
        const response = await fetch(`${BASE_URL}/members/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(dataToSend),
        });
        return handleResponse(response);
    },

    // DELETE /api/v1/members/:id  — returns 204 No Content
    deleteMember: async (id) => {
        const response = await fetch(`${BASE_URL}/members/${id}`, {
            method: 'DELETE',
            headers: { ...getAuthHeader() }
        });
        // 204 No Content — no body to parse
        if (response.status === 204) return null;
        return handleResponse(response);
    },

    // GET /api/v1/members/:id/barcode.svg
    getMemberBarcodeSvg: async (id) => {
        const response = await fetch(`${BASE_URL}/members/${id}/barcode.svg`, {
            headers: { ...getAuthHeader() }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch barcode');
        }
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }
};

export const plansAPI = {
    // GET /api/v1/plans — returns only active plans for the center
    getPlans: async () => {
        const response = await fetch(`${BASE_URL}/plans`, {
            headers: { ...getAuthHeader() }
        });
        const data = await handleResponse(response);
        return data;
    },

    // GET /api/v1/plans/:id
    getPlan: async (id) => {
        const response = await fetch(`${BASE_URL}/plans/${id}`, {
            headers: { ...getAuthHeader() }
        });
        const data = await handleResponse(response);
        return data.data || data;
    },

    // POST /api/v1/plans
    addPlan: async (planData) => {
        const { id, centerId, status, ...dataToSend } = planData;
        dataToSend.price = Number(dataToSend.price);
        // Only send the field relevant to the plan type
        if (dataToSend.type === 'time_based') {
            dataToSend.durationInDays = Number(dataToSend.durationInDays);
            delete dataToSend.sessionCount;
        } else if (dataToSend.type === 'session_based') {
            dataToSend.sessionCount = Number(dataToSend.sessionCount);
            delete dataToSend.durationInDays;
        }
        const response = await fetch(`${BASE_URL}/plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(dataToSend),
        });
        return handleResponse(response);
    },

    // PATCH /api/v1/plans/:id — type cannot be changed
    updatePlan: async (id, planData) => {
        const { id: _id, centerId, type, status, ...dataToSend } = planData;
        if (dataToSend.price !== undefined) dataToSend.price = Number(dataToSend.price);
        if (dataToSend.durationInDays !== undefined) dataToSend.durationInDays = Number(dataToSend.durationInDays);
        if (dataToSend.sessionCount !== undefined) dataToSend.sessionCount = Number(dataToSend.sessionCount);
        const response = await fetch(`${BASE_URL}/plans/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(dataToSend),
        });
        return handleResponse(response);
    },

    // DELETE /api/v1/plans/:id — returns 204 No Content
    deletePlan: async (id) => {
        const response = await fetch(`${BASE_URL}/plans/${id}`, {
            method: 'DELETE',
            headers: { ...getAuthHeader() }
        });
        if (response.status === 204) return null;
        return handleResponse(response);
    }
};

export const subscriptionsAPI = {
    // GET /api/v1/subscriptions?search=&status=&planId=&expiringSoon=true
    getSubscriptions: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${BASE_URL}/subscriptions${query ? `?${query}` : ''}`, {
            headers: { ...getAuthHeader() }
        });
        const data = await handleResponse(response);
        return data;
    },

    // GET /api/v1/subscriptions/:id
    getSubscription: async (id) => {
        const response = await fetch(`${BASE_URL}/subscriptions/${id}`, {
            headers: { ...getAuthHeader() }
        });
        const data = await handleResponse(response);
        return data.data || data;
    },

    // POST /api/v1/subscriptions
    addSubscription: async (subData) => {
        const payload = { ...subData };
        if (payload.pricePaid !== undefined) {
            payload.pricePaidCents = Math.round(Number(payload.pricePaid) * 100);
            delete payload.pricePaid;
        }

        // Clean up payload based on source
        if (payload.source === 'plan') {
            delete payload.type;
            delete payload.durationInDays;
            delete payload.totalSessions;
        } else if (payload.source === 'manual') {
            delete payload.planId;
            if (payload.type === 'time_based') {
                payload.durationInDays = Number(payload.durationInDays);
                delete payload.totalSessions;
            } else if (payload.type === 'session_based') {
                payload.totalSessions = Number(payload.totalSessions);
                delete payload.durationInDays;
            }
        }

        const response = await fetch(`${BASE_URL}/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    // POST /api/v1/subscriptions/:id/renew/time OR /renew/sessions
    renewSubscription: async (id, data) => {
        const payload = { ...data };
        if (payload.pricePaid !== undefined) {
            payload.pricePaidCents = Math.round(Number(payload.pricePaid) * 100);
            delete payload.pricePaid;
        }

        const endpointSuffix = payload.extraDays !== undefined ? 'time' : 'sessions';

        const response = await fetch(`${BASE_URL}/subscriptions/${id}/renew/${endpointSuffix}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    // POST /api/v1/subscriptions/:id/renew/expired
    renewExpiredSubscription: async (id, data) => {
        const payload = { ...data };

        // Convert price
        if (payload.pricePaid !== undefined) {
            payload.pricePaidCents = Math.round(Number(payload.pricePaid) * 100);
            delete payload.pricePaid;
        }

        // Remove empty string from startDate so backend falls back to its default (today)
        if (payload.startDate === '') {
            delete payload.startDate;
        }

        // Delete fields not applicable for the chosen mode
        if (payload.mode === 'same_plan') {
            delete payload.planId;
            delete payload.type;
            delete payload.durationInDays;
            delete payload.totalSessions;
        } else if (payload.mode === 'new_plan') {
            delete payload.type;
            delete payload.durationInDays;
            delete payload.totalSessions;
        } else if (payload.mode === 'manual') {
            delete payload.planId;
            if (payload.type === 'time_based') {
                payload.durationInDays = Number(payload.durationInDays);
                delete payload.totalSessions;
            } else if (payload.type === 'session_based') {
                payload.totalSessions = Number(payload.totalSessions);
                delete payload.durationInDays;
            }
        }

        const response = await fetch(`${BASE_URL}/subscriptions/${id}/renew/expired`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    // POST /api/v1/subscriptions/:id/freeze
    freezeSubscription: async (id) => {
        const response = await fetch(`${BASE_URL}/subscriptions/${id}/freeze`, {
            method: 'POST',
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // POST /api/v1/subscriptions/:id/unfreeze
    unfreezeSubscription: async (id) => {
        const response = await fetch(`${BASE_URL}/subscriptions/${id}/unfreeze`, {
            method: 'POST',
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // POST /api/v1/subscriptions/:id/cancel
    cancelSubscription: async (id) => {
        const response = await fetch(`${BASE_URL}/subscriptions/${id}/cancel`, {
            method: 'POST',
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // POST /api/v1/subscriptions/:id/deduct-sessions
    deductSessions: async (id, data) => {
        const response = await fetch(`${BASE_URL}/subscriptions/${id}/deduct-sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    // GET /api/v1/subscriptions/:id/timeline
    getSubscriptionHistory: async (id) => {
        const response = await fetch(`${BASE_URL}/subscriptions/${id}/timeline`, {
            headers: { ...getAuthHeader() }
        });
        const data = await handleResponse(response);
        return data;
    }
};

export const checkinsAPI = {
    // POST /api/v1/checkins
    submitCheckin: async (code) => {
        const response = await fetch(`${BASE_URL}/checkins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ memberCode: code })
        });
        const data = await handleResponse(response);
        return data;
    },

    // GET /api/v1/checkins/today
    getTodayLog: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${BASE_URL}/checkins/today${query ? `?${query}` : ''}`, {
            headers: { ...getAuthHeader() }
        });
        const data = await handleResponse(response);
        return data;
    }
};

export const accountingAPI = {
    // POST /api/v1/accounting/shifts/open
    openShift: async (startingCash) => {
        const response = await fetch(`${BASE_URL}/accounting/shifts/open`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ startingCash: Number(startingCash) })
        });
        return handleResponse(response);
    },

    // POST /api/v1/accounting/shifts/close
    closeShift: async (actualEndingCash) => {
        const response = await fetch(`${BASE_URL}/accounting/shifts/close`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ actualEndingCash: Number(actualEndingCash) })
        });
        return handleResponse(response);
    },

    // GET /api/v1/accounting/shifts/current
    getCurrentShift: async () => {
        const response = await fetch(`${BASE_URL}/accounting/shifts/current`, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // GET /api/v1/accounting/shifts (History)
    getShiftsHistory: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.startDate) query.append('startDate', params.startDate);
        if (params.endDate) query.append('endDate', params.endDate);
        if (params.status) query.append('status', params.status);

        const queryString = query.toString();
        const url = `${BASE_URL}/accounting/shifts${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // POST /api/v1/accounting/transactions
    addTransaction: async (data) => {
        const response = await fetch(`${BASE_URL}/accounting/transactions`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    // GET /api/v1/accounting/transactions
    getTransactions: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.date) query.append('date', params.date);
        if (params.startDate) query.append('startDate', params.startDate);
        if (params.endDate) query.append('endDate', params.endDate);
        if (params.type) query.append('type', params.type);
        if (params.category) query.append('category', params.category);
        if (params.shiftId) query.append('shiftId', params.shiftId);

        const queryString = query.toString();
        const url = `${BASE_URL}/accounting/transactions${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // GET /api/v1/accounting/dashboard/summary
    getDashboardSummary: async (params = {}) => {
        const query = new URLSearchParams();
        // Support old format where params might be just a date string for backward compatibility
        if (typeof params === 'string') {
            query.append('date', params);
        } else {
            if (params.date) query.append('date', params.date);
            if (params.startDate) query.append('startDate', params.startDate);
            if (params.endDate) query.append('endDate', params.endDate);
        }

        const queryString = query.toString();
        const url = `${BASE_URL}/accounting/dashboard/summary${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    }
};
