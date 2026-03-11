const BASE_URL = 'https://gym-saas-backend-production.up.railway.app/api/v1';

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
        // Build a meaningful Arabic error message based on status code
        let msg = '';

        // If backend sent structured errors array
        if (data.errors && Array.isArray(data.errors)) {
            msg = data.errors.map(e => e.message).join('\n');
        } else if (data.message) {
            msg = data.message;
        }

        // Map status codes to Arabic fallback messages
        const statusMessages = {
            400: msg || 'البيانات المرسلة غير صحيحة. تأكد من المدخلات وحاول مرة أخرى.',
            401: 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.',
            403: msg || 'حسابك غير مفعل أو ليس لديك صلاحية لهذا الإجراء. تواصل مع الدعم.',
            404: msg || 'العنصر المطلوب غير موجود.',
            409: msg || 'يوجد تعارض في البيانات. قد يكون العنصر موجود بالفعل.',
            422: msg || 'البيانات المرسلة غير مكتملة أو غير صالحة.',
            429: 'عدد الطلبات كثير جداً. انتظر قليلاً وحاول مرة أخرى.',
            500: 'حدث خطأ في السيرفر. حاول مرة أخرى لاحقاً.',
        };

        const errorMessage = statusMessages[response.status] || msg || 'حدث خطأ غير متوقع. حاول مرة أخرى.';

        // Auto-logout on 403 (account deactivated/unsubscribed) or 401 (session expired)
        // Only for client routes — NOT for platform-admin routes
        const isAdminRoute = window.location.pathname.startsWith('/platform-admin');
        if (!isAdminRoute && (response.status === 403 || response.status === 401)) {
            const logoutMessage = response.status === 403
                ? 'تم إيقاف حسابك أو انتهت فترة التجربة.\nتواصل مع الدعم لإعادة التفعيل.'
                : 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.';

            alert(logoutMessage);
            localStorage.removeItem('token');
            localStorage.removeItem('gymName');
            window.location.href = '/login';
            return; // Stop execution
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.serverMessage = msg; // Keep the original server message for debugging
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
        // Persist center billing info for the trial/subscription banner
        const center = data.data?.center || data.center;
        if (center) {
            if (center.name) localStorage.setItem('gymName', center.name);
            if (center.billingStatus) localStorage.setItem('billingStatus', center.billingStatus);

            // Trial info
            if (center.trialDaysLeft !== undefined && center.trialDaysLeft !== null) {
                localStorage.setItem('trialDaysLeft', center.trialDaysLeft);
            } else if (center.trialEndsAt) {
                const tDaysLeft = Math.ceil((new Date(center.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                localStorage.setItem('trialDaysLeft', Math.max(0, tDaysLeft));
            }

            // Subscription info
            if (center.subscriptionDaysLeft !== undefined && center.subscriptionDaysLeft !== null) {
                localStorage.setItem('subscriptionDaysLeft', center.subscriptionDaysLeft);
            } else if (center.subscriptionEndsAt) {
                const sDaysLeft = Math.ceil((new Date(center.subscriptionEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                localStorage.setItem('subscriptionDaysLeft', Math.max(0, sDaysLeft));
            }
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

// ─── Platform Admin (Super Admin) ────────────────────────────────────

const getAdminAuthHeader = () => {
    const token = localStorage.getItem('admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const platformAdminAPI = {
    // POST /api/v1/platform-admin/auth/login
    login: async (email, password) => {
        const response = await fetch(`${BASE_URL}/platform-admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await handleResponse(response);
        const token = data.data?.token || data.token;
        if (token) {
            localStorage.setItem('admin_token', token);
        }
        return data;
    },

    // GET /api/v1/platform-admin/dashboard/summary
    getDashboardSummary: async () => {
        const response = await fetch(`${BASE_URL}/platform-admin/dashboard/summary`, {
            headers: { ...getAdminAuthHeader() }
        });
        return handleResponse(response);
    },

    // GET /api/v1/platform-admin/centers?page=&limit=&billingStatus=&search=
    getCenters: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.billingStatus) query.append('billingStatus', params.billingStatus);
        if (params.search) query.append('search', params.search);

        const queryString = query.toString();
        const response = await fetch(`${BASE_URL}/platform-admin/centers${queryString ? `?${queryString}` : ''}`, {
            headers: { ...getAdminAuthHeader() }
        });
        return handleResponse(response);
    },

    // PATCH /api/v1/platform-admin/centers/:centerId/billing-status
    updateBillingStatus: async (centerId, body) => {
        const response = await fetch(`${BASE_URL}/platform-admin/centers/${centerId}/billing-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAdminAuthHeader()
            },
            body: JSON.stringify(body),
        });
        return handleResponse(response);
    },

    // PATCH /api/v1/platform-admin/centers/:centerId/activate
    // body: { subscriptionDurationDays } | { subscriptionEndsAt } | {}
    activateCenter: async (centerId, body = {}) => {
        const response = await fetch(`${BASE_URL}/platform-admin/centers/${centerId}/activate`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAdminAuthHeader()
            },
            body: JSON.stringify(body),
        });
        return handleResponse(response);
    },

    // PATCH /api/v1/platform-admin/centers/:centerId/deactivate
    deactivateCenter: async (centerId) => {
        const response = await fetch(`${BASE_URL}/platform-admin/centers/${centerId}/deactivate`, {
            method: 'PATCH',
            headers: { ...getAdminAuthHeader() }
        });
        return handleResponse(response);
    }
};
