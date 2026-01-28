// API Module
class API {
    constructor() {
        this.baseURL = '/api';
        this.setupAxios();
    }

    setupAxios() {
        // Add axios configuration if not already available
        if (typeof axios !== 'undefined') {
            axios.defaults.baseURL = this.baseURL;
            
            // Add request interceptor to include auth token
            axios.interceptors.request.use(
                (config) => {
                    const token = auth.getToken();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                    return config;
                },
                (error) => {
                    return Promise.reject(error);
                }
            );

            // Add response interceptor to handle errors
            axios.interceptors.response.use(
                (response) => {
                    return response;
                },
                (error) => {
                    if (error.response?.status === 401) {
                        auth.logout();
                    }
                    return Promise.reject(error);
                }
            );
        }
    }

    // Generic HTTP methods
    async get(url, config = {}) {
        try {
            const response = await axios.get(url, config);
            return response;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async post(url, data = {}, config = {}) {
        try {
            const response = await axios.post(url, data, config);
            return response;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async put(url, data = {}, config = {}) {
        try {
            const response = await axios.put(url, data, config);
            return response;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async patch(url, data = {}, config = {}) {
        try {
            const response = await axios.patch(url, data, config);
            return response;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async delete(url, config = {}) {
        try {
            const response = await axios.delete(url, config);
            return response;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    handleError(error) {
        console.error('API Error:', error);
        
        if (error.response) {
            // Server responded with error status
            const message = error.response.data?.message || 'Server error occurred';
            ui.showError(message);
        } else if (error.request) {
            // Request was made but no response received
            ui.showError('Network error. Please check your connection.');
        } else {
            // Something else happened
            ui.showError('An unexpected error occurred.');
        }
    }

    // Authentication API
    async login(credentials) {
        return this.post('/auth/login', credentials);
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async getProfile() {
        return this.get('/auth/profile');
    }

    async updateProfile(userData) {
        return this.put('/auth/profile', userData);
    }

    async changePassword(passwordData) {
        return this.put('/auth/change-password', passwordData);
    }

    // Menu API
    async getTodayMenu() {
        return this.get('/menu/today');
    }

    async getMenuByDate(date) {
        return this.get(`/menu/date/${date}`);
    }

    async addMenuItem(menuData) {
        return this.post('/menu', menuData);
    }

    async updateMenuItem(id, menuData) {
        return this.put(`/menu/${id}`, menuData);
    }

    async deleteMenuItem(id) {
        return this.delete(`/menu/${id}`);
    }

    async toggleMenuItem(id) {
        return this.patch(`/menu/${id}/toggle`);
    }

    async getAllMenuItems(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/menu/manage/all${queryString ? '?' + queryString : ''}`);
    }

    // Orders API
    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }

    async getMyOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/orders/my-orders${queryString ? '?' + queryString : ''}`);
    }

    async getOrder(id) {
        return this.get(`/orders/${id}`);
    }

    async updateOrderStatus(id, status) {
        return this.patch(`/orders/${id}/status`, { status });
    }

    async cancelOrder(id) {
        return this.patch(`/orders/${id}/cancel`);
    }

    async getAllOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/orders/manage/all${queryString ? '?' + queryString : ''}`);
    }

    // Payments API
    async createPaymentOrder(orderId) {
        return this.post('/payments/create-order', { order_id: orderId });
    }

    async verifyPayment(paymentData) {
        return this.post('/payments/verify', paymentData);
    }

    async getPaymentHistory(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/payments/history${queryString ? '?' + queryString : ''}`);
    }

    async getPayment(id) {
        return this.get(`/payments/${id}`);
    }

    async processRefund(id, refundData) {
        return this.post(`/payments/${id}/refund`, refundData);
    }

    async getAllPayments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/payments/manage/all${queryString ? '?' + queryString : ''}`);
    }

    // Staff API
    async getStaffDashboard() {
        return this.get('/staff/dashboard');
    }

    async verifyQR(qrData) {
        return this.post('/staff/verify-qr', { qr_data: qrData });
    }

    async confirmOrder(orderId, notes = '') {
        return this.patch(`/staff/${orderId}/confirm`, { notes });
    }

    async serveOrder(orderId) {
        return this.patch(`/staff/${orderId}/serve`);
    }

    async getOrderDetails(orderId) {
        return this.get(`/staff/order/${orderId}`);
    }

    async getPendingOrders() {
        return this.get('/staff/orders/pending');
    }

    async getServedOrders() {
        return this.get('/staff/orders/served');
    }

    async getDailySummary(date = null) {
        const queryString = date ? `?date=${date}` : '';
        return this.get(`/staff/summary${queryString}`);
    }

    // Users API (Admin only)
    async getAllUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/users${queryString ? '?' + queryString : ''}`);
    }

    async getUser(id) {
        return this.get(`/users/${id}`);
    }

    async updateUser(id, userData) {
        return this.put(`/users/${id}`, userData);
    }

    async deleteUser(id) {
        return this.delete(`/users/${id}`);
    }

    async toggleUserStatus(id) {
        return this.patch(`/users/${id}/toggle`);
    }

    async resetUserPassword(id, newPassword) {
        return this.post(`/users/${id}/reset-password`, { newPassword });
    }

    async getUserStats() {
        return this.get('/users/stats/overview');
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDateTime(dateString) {
        return `${this.formatDate(dateString)} ${this.formatTime(dateString)}`;
    }
}

// Create global API instance
const api = new API();
