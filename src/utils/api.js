const BASE_URL = 'https://gym-saas-backend-production.up.railway.app/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const persistActor = (actor) => {
    if (!actor) return;
    localStorage.setItem('actor', JSON.stringify({
        type: actor.type,
        role: actor.role
    }));
};

const persistCenterBasics = (data) => {
    const center = data.data?.center || data.center;
    if (center?.name) {
        localStorage.setItem('gymName', center.name);
    } else {
        const centerName = data.data?.centerName || data.centerName;
        if (centerName) localStorage.setItem('gymName', centerName);
    }

    if (!center) return;
    if (center.billingStatus) localStorage.setItem('billingStatus', center.billingStatus);

    if (center.trialDaysLeft !== undefined && center.trialDaysLeft !== null) {
        localStorage.setItem('trialDaysLeft', center.trialDaysLeft);
    } else if (center.trialEndsAt) {
        const tDaysLeft = Math.ceil((new Date(center.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
        localStorage.setItem('trialDaysLeft', Math.max(0, tDaysLeft));
    }

    if (center.subscriptionDaysLeft !== undefined && center.subscriptionDaysLeft !== null) {
        localStorage.setItem('subscriptionDaysLeft', center.subscriptionDaysLeft);
    } else if (center.subscriptionEndsAt) {
        const sDaysLeft = Math.ceil((new Date(center.subscriptionEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
        localStorage.setItem('subscriptionDaysLeft', Math.max(0, sDaysLeft));
    }
};

const persistClientAuth = (data) => {
    const token = data.data?.token || data.token;
    if (token) localStorage.setItem('token', token);
    persistActor(data.data?.actor || data.actor);
    persistCenterBasics(data);
};

const clearClientAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('gymName');
    localStorage.removeItem('billingStatus');
    localStorage.removeItem('trialDaysLeft');
    localStorage.removeItem('subscriptionDaysLeft');
    localStorage.removeItem('actor');
};

const toCents = (value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Math.round(Number(value) * 100);
};

const handleResponse = async (response) => {
    // Handle 204 No Content (e.g., DELETE)
    if (response.status === 204) return null;

    const data = await response.json();

    // Check HTTP status first
    if (!response.ok) {
        // Build a meaningful Arabic error message based on status code
        let msg = '';
        const isLoginRequest =
            response.url?.includes('/auth/login') ||
            response.url?.includes('/staff/auth/login') ||
            response.url?.includes('/platform-admin/auth/login');

        // If backend sent structured errors array
        if (data.errors && Array.isArray(data.errors)) {
            msg = data.errors.map(e => e.message).join('\n');
        } else if (data.message) {
            msg = data.message;
        }

        // Map status codes to Arabic fallback messages
        const statusMessages = {
            400: msg || 'البيانات المرسلة غير صحيحة. تأكد من المدخلات وحاول مرة أخرى.',
            401: isLoginRequest
                ? '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629.'
                : (msg || '\u0627\u0646\u062a\u0647\u062a \u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u062c\u0644\u0633\u0629. \u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.'),
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
        if (!isLoginRequest && !isAdminRoute && (response.status === 403 || response.status === 401)) {
            const logoutMessage = response.status === 403
                ? 'تم إيقاف حسابك أو انتهت فترة التجربة.\nتواصل مع الدعم لإعادة التفعيل.'
                : 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.';

            alert(logoutMessage);
            clearClientAuth();
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
        persistClientAuth(data);
        return data;
    },

    // POST /api/v1/staff/auth/login
    staffLogin: async (email, password) => {
        const response = await fetch(`${BASE_URL}/staff/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await handleResponse(response);
        persistClientAuth(data);
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
            payload.pricePaidCents = toCents(payload.pricePaid);
            delete payload.pricePaid;
        }
        if (payload.totalPrice === '' || payload.totalPrice === null) {
            delete payload.totalPrice;
        } else if (payload.totalPrice !== undefined) {
            payload.totalPriceCents = toCents(payload.totalPrice);
            delete payload.totalPrice;
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
            payload.pricePaidCents = toCents(payload.pricePaid);
            delete payload.pricePaid;
        }
        if (payload.totalPrice === '' || payload.totalPrice === null) {
            delete payload.totalPrice;
        } else if (payload.totalPrice !== undefined) {
            payload.totalPriceCents = toCents(payload.totalPrice);
            delete payload.totalPrice;
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
            payload.pricePaidCents = toCents(payload.pricePaid);
            delete payload.pricePaid;
        }
        if (payload.totalPrice === '' || payload.totalPrice === null) {
            delete payload.totalPrice;
        } else if (payload.totalPrice !== undefined) {
            payload.totalPriceCents = toCents(payload.totalPrice);
            delete payload.totalPrice;
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

    // POST /api/v1/subscriptions/:id/refund
    refundSubscription: async (id, data) => {
        const payload = { ...data };
        if (payload.refundAmount !== undefined) {
            payload.refundAmountCents = toCents(payload.refundAmount);
            delete payload.refundAmount;
        }

        const response = await fetch(`${BASE_URL}/subscriptions/${id}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(payload),
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

export const debtsAPI = {
    // GET /api/v1/debts
    getDebts: async (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                query.append(key, value);
            }
        });

        const response = await fetch(`${BASE_URL}/debts${query.toString() ? `?${query.toString()}` : ''}`, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // GET /api/v1/debts/summary
    getSummary: async (params = {}) => {
        const buildQueryString = (input = {}) => {
            const query = new URLSearchParams();
            Object.entries(input).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    query.append(key, value);
                }
            });
            return query.toString();
        };

        // Keep date filters mutually exclusive to avoid backend validation conflicts.
        const normalizedParams = { ...params };
        if (normalizedParams.date) {
            delete normalizedParams.startDate;
            delete normalizedParams.endDate;
            delete normalizedParams.dateFrom;
            delete normalizedParams.dateTo;
        } else {
            if (normalizedParams.startDate && !normalizedParams.endDate) {
                normalizedParams.endDate = normalizedParams.startDate;
            }
            if (normalizedParams.endDate && !normalizedParams.startDate) {
                normalizedParams.startDate = normalizedParams.endDate;
            }
        }

        const buildSummaryUrl = (queryString) => `${BASE_URL}/debts/summary${queryString ? `?${queryString}` : ''}`;

        const hasRange = !normalizedParams.date && normalizedParams.startDate && normalizedParams.endDate;
        const isSingleDayRange = hasRange && normalizedParams.startDate === normalizedParams.endDate;

        const candidateParamsList = [];
        candidateParamsList.push(normalizedParams);

        if (hasRange) {
            // Try backend-alternative naming
            candidateParamsList.push({
                dateFrom: normalizedParams.startDate,
                dateTo: normalizedParams.endDate
            });
        }

        if (isSingleDayRange) {
            // Try single-date variant for one day
            candidateParamsList.push({ date: normalizedParams.startDate });
        }

        // Last fallback: unfiltered summary, so cards don't stay empty on server date-filter bugs.
        candidateParamsList.push({});

        const attempted = new Set();
        let lastResponse = null;

        for (const candidate of candidateParamsList) {
            const key = JSON.stringify(candidate);
            if (attempted.has(key)) continue;
            attempted.add(key);

            const queryString = buildQueryString(candidate);
            const response = await fetch(buildSummaryUrl(queryString), {
                headers: { ...getAuthHeader() }
            });

            lastResponse = response;
            if (response.ok) {
                return handleResponse(response);
            }

            // Retry only for server errors. For 4xx, return immediately to preserve validation feedback.
            if (response.status < 500) {
                return handleResponse(response);
            }
        }

        return handleResponse(lastResponse);
    },

    // GET /api/v1/debts/:id
    getDebt: async (id) => {
        const response = await fetch(`${BASE_URL}/debts/${id}`, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // POST /api/v1/debts
    createDebt: async (data) => {
        const payload = {
            ...data,
            amountCents: toCents(data.amount)
        };
        delete payload.amount;

        const response = await fetch(`${BASE_URL}/debts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    // POST /api/v1/debts/:id/payments
    addPayment: async (id, data) => {
        const payload = {
            ...data,
            amountCents: toCents(data.amount)
        };
        delete payload.amount;

        const response = await fetch(`${BASE_URL}/debts/${id}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    // GET /api/v1/debts/member/:memberId
    getMemberDebts: async (memberId, params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                query.append(key, value);
            }
        });

        const response = await fetch(`${BASE_URL}/debts/member/${memberId}${query.toString() ? `?${query.toString()}` : ''}`, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // GET /api/v1/debts/member/:memberId/summary
    getMemberSummary: async (memberId) => {
        const response = await fetch(`${BASE_URL}/debts/member/${memberId}/summary`, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    }
};

export const staffAPI = {
    // GET /api/v1/staff/me
    me: async () => {
        const response = await fetch(`${BASE_URL}/staff/me`, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // GET /api/v1/staff
    getStaff: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        if (params.role) query.append('role', params.role);
        if (params.status) query.append('status', params.status);
        if (params.search) query.append('search', params.search);

        const response = await fetch(`${BASE_URL}/staff${query.toString() ? `?${query.toString()}` : ''}`, {
            headers: { ...getAuthHeader() }
        });
        return handleResponse(response);
    },

    // POST /api/v1/staff
    createStaff: async (payload) => {
        const response = await fetch(`${BASE_URL}/staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    // PATCH /api/v1/staff/:id
    updateStaff: async (id, payload) => {
        const response = await fetch(`${BASE_URL}/staff/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    // PATCH /api/v1/staff/:id/status
    updateStaffStatus: async (id, status) => {
        const response = await fetch(`${BASE_URL}/staff/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ status }),
        });
        return handleResponse(response);
    },

    // PATCH /api/v1/staff/:id/password
    updateStaffPassword: async (id, password) => {
        const response = await fetch(`${BASE_URL}/staff/${id}/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ password }),
        });
        return handleResponse(response);
    }
};

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
