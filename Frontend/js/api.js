const API_BASE = 'http://localhost:5000/api';

const api = {
    // Helper for requests
    async request(method, endpoint, data = null) {
        const token = localStorage.getItem('token');
        const config = {
            method,
            url: `${API_BASE}${endpoint}`,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        };
        if (data) config.data = data;

        try {
            const res = await axios(config);
            // Returns the object sent by the backend (e.g., { user, token })
            return res.data; 
        } catch (err) {
            console.error("API Error:", err);
            // Re-throw to be caught by login.js catch block
            throw err;
        }
    },

    // Auth Login
    login: (credentials) => api.request('POST', '/auth/login', credentials),
    
    // Other methods
    getMenu: () => api.request('GET', '/menu/today'),
    getMyOrders: () => api.request('GET', '/orders/my-orders')
};