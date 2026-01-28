// Staff Dashboard JavaScript
const API_BASE = '/api';

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    const isAuthenticated = await checkAuthentication();
    if (isAuthenticated) {
        loadDashboardData();
    }
});

// Check authentication
async function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        alert('Please login to continue.');
        window.location.href = 'login.html';
        return false;
    }
    
    if (user.role !== 'staff') {
        alert('Access denied. Please login as staff.');
        window.location.href = 'login.html';
        return false;
    }
    
    // Verify token is still valid
    try {
        const response = await axios.get(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data && response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            alert('Your session has expired. Please login again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
            return false;
        }
        console.warn('Could not verify token, but continuing:', error);
    }
    
    // Update user info
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `
            <i class="fas fa-user-tie"></i>
            <span>${user.name || user.college_id}</span>
        `;
    }
    
    return true;
}

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadPendingOrders(),
            loadTodayOrders(),
            loadServedOrders(),
            loadTodayRevenue(),
            loadPendingOrdersTable()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load pending orders count
async function loadPendingOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/staff/orders/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const orders = response.data.orders || response.data || [];
        document.getElementById('pendingOrders').textContent = orders.length;
    } catch (error) {
        console.error('Error loading pending orders:', error);
        document.getElementById('pendingOrders').textContent = '0';
    }
}

// Load today's orders
async function loadTodayOrders() {
    try {
        const token = localStorage.getItem('token');
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(`${API_BASE}/orders/manage/all?date=${today}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const orders = response.data.orders || response.data || [];
        document.getElementById('todayOrders').textContent = orders.length;
    } catch (error) {
        console.error('Error loading today orders:', error);
        document.getElementById('todayOrders').textContent = '0';
    }
}

// Load served orders
async function loadServedOrders() {
    try {
        const token = localStorage.getItem('token');
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(`${API_BASE}/orders/manage/all?date=${today}&status=served`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const orders = response.data.orders || response.data || [];
        document.getElementById('servedOrders').textContent = orders.length;
    } catch (error) {
        console.error('Error loading served orders:', error);
        document.getElementById('servedOrders').textContent = '0';
    }
}

// Load today's revenue
async function loadTodayRevenue() {
    try {
        const token = localStorage.getItem('token');
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(`${API_BASE}/payments/history?date=${today}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const payments = response.data.payments || response.data || [];
        const revenue = payments
            .filter(p => p.status === 'captured' || p.status === 'paid')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        document.getElementById('todayRevenue').textContent = `₹${revenue.toLocaleString()}`;
    } catch (error) {
        console.error('Error loading revenue:', error);
        document.getElementById('todayRevenue').textContent = '₹0';
    }
}

// Load pending orders table
async function loadPendingOrdersTable() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/staff/orders/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const orders = response.data.orders || response.data || [];
        const tbody = document.getElementById('ordersTableBody');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No pending orders</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => {
            const items = order.items?.map(item => `${item.dish_name} (${item.quantity})`).join(', ') || 'N/A';
            const statusClass = order.order_status || 'pending';
            
            return `
                <tr>
                    <td>${order.order_id || 'N/A'}</td>
                    <td>${order.user_id?.name || order.user_id || 'N/A'}</td>
                    <td>${items}</td>
                    <td>₹${order.total_amount || 0}</td>
                    <td><span class="status-badge ${statusClass}">${statusClass}</span></td>
                    <td>
                        <button class="btn-sm confirm" onclick="confirmOrder('${order._id || order.order_id}')">
                            Confirm
                        </button>
                        <button class="btn-sm serve" onclick="serveOrder('${order._id || order.order_id}')">
                            Serve
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading pending orders table:', error);
        document.getElementById('ordersTableBody').innerHTML = 
            '<tr><td colspan="6" class="text-center">Error loading orders</td></tr>';
    }
}

// Quick actions
function scanQR() {
    alert('QR Scanner feature coming soon!');
}

function viewPendingOrders() {
    document.querySelector('.section').scrollIntoView({ behavior: 'smooth' });
}

function viewMenu() {
    window.location.href = 'menu.html';
}

// Confirm order
async function confirmOrder(orderId) {
    try {
        const token = localStorage.getItem('token');
        await axios.patch(`${API_BASE}/staff/${orderId}/confirm`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        alert('Order confirmed successfully!');
        loadPendingOrdersTable();
        loadDashboardData();
    } catch (error) {
        console.error('Error confirming order:', error);
        alert('Error confirming order. Please try again.');
    }
}

// Serve order
async function serveOrder(orderId) {
    try {
        const token = localStorage.getItem('token');
        await axios.patch(`${API_BASE}/staff/${orderId}/serve`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        alert('Order marked as served!');
        loadPendingOrdersTable();
        loadDashboardData();
    } catch (error) {
        console.error('Error serving order:', error);
        alert('Error serving order. Please try again.');
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        window.location.href = 'login.html';
    }
}
