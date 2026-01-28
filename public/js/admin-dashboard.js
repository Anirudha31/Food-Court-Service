// Admin Dashboard JavaScript
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
    
    if (user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return false;
    }
    
    // Verify token is still valid by making a test API call
    try {
        const response = await axios.get(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Update user info from server response if available
        if (response.data && response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            alert('Your session has expired. Please login again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
            return false;
        }
        // Other errors - continue anyway, might be network issue
        console.warn('Could not verify token, but continuing:', error);
    }
    
    // Update user info
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `
            <i class="fas fa-user-shield"></i>
            <span>${user.name || user.college_id}</span>
        `;
    }
    
    return true;
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        
        // Load stats
        await Promise.all([
            loadUsersCount(),
            loadOrdersCount(),
            loadRevenue(),
            loadMenuItems(),
            loadRecentOrders()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load users count
async function loadUsersCount() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const totalUsers = response.data.users?.length || response.data.length || 0;
        document.getElementById('totalUsers').textContent = totalUsers;
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('totalUsers').textContent = '0';
    }
}

// Load orders count
async function loadOrdersCount() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/orders/manage/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const totalOrders = response.data.orders?.length || response.data.length || 0;
        document.getElementById('totalOrders').textContent = totalOrders;
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('totalOrders').textContent = '0';
    }
}

// Load revenue
async function loadRevenue() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/payments/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const payments = response.data.payments || response.data || [];
        const totalRevenue = payments
            .filter(p => p.status === 'captured' || p.status === 'paid')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;
    } catch (error) {
        console.error('Error loading revenue:', error);
        document.getElementById('totalRevenue').textContent = '₹0';
    }
}

// Load menu items
async function loadMenuItems() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/menu/today`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const menuItems = response.data.menu || response.data || [];
        document.getElementById('menuItems').textContent = menuItems.length;
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menuItems').textContent = '0';
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/orders/manage/all?limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const orders = response.data.orders || response.data || [];
        const tbody = document.getElementById('ordersTableBody');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => {
            const items = order.items?.map(item => item.dish_name).join(', ') || 'N/A';
            const date = new Date(order.order_date || order.createdAt).toLocaleDateString();
            const statusClass = order.order_status || 'pending';
            
            return `
                <tr>
                    <td>${order.order_id || 'N/A'}</td>
                    <td>${order.user_id?.name || order.user_id || 'N/A'}</td>
                    <td>${items}</td>
                    <td>₹${order.total_amount || 0}</td>
                    <td><span class="status-badge ${statusClass}">${statusClass}</span></td>
                    <td>${date}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('ordersTableBody').innerHTML = 
            '<tr><td colspan="6" class="text-center">Error loading orders</td></tr>';
    }
}

// Quick actions
function manageUsers() {
    alert('User management feature coming soon!');
}

function manageMenu() {
    window.location.href = 'menu.html';
}

function viewOrders() {
    alert('Order management feature coming soon!');
}

function viewReports() {
    alert('Reports feature coming soon!');
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
