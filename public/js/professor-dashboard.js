// Professor Dashboard JavaScript
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
    
    if (user.role !== 'professor' && user.role !== 'teacher') {
        alert('Access denied. Please login as professor.');
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
            <i class="fas fa-chalkboard-teacher"></i>
            <span>${user.name || user.college_id}</span>
        `;
    }
    
    return true;
}

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadMyOrders(),
            loadTotalSpent(),
            loadPendingOrders(),
            loadRecentOrders()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load my orders count
async function loadMyOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const orders = response.data.orders || response.data || [];
        document.getElementById('myOrders').textContent = orders.length;
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('myOrders').textContent = '0';
    }
}

// Load total spent
async function loadTotalSpent() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/payments/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const payments = response.data.payments || response.data || [];
        const totalSpent = payments
            .filter(p => p.status === 'captured' || p.status === 'paid')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        document.getElementById('totalSpent').textContent = `₹${totalSpent.toLocaleString()}`;
    } catch (error) {
        console.error('Error loading payments:', error);
        document.getElementById('totalSpent').textContent = '₹0';
    }
}

// Load pending orders count
async function loadPendingOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const orders = response.data.orders || response.data || [];
        const pending = orders.filter(o => 
            o.order_status === 'pending' || 
            o.order_status === 'confirmed' || 
            o.order_status === 'preparing'
        ).length;
        
        document.getElementById('pendingOrders').textContent = pending;
    } catch (error) {
        console.error('Error loading pending orders:', error);
        document.getElementById('pendingOrders').textContent = '0';
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/orders/my-orders?limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const orders = response.data.orders || response.data || [];
        const tbody = document.getElementById('ordersTableBody');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => {
            const items = order.items?.map(item => `${item.dish_name} (${item.quantity})`).join(', ') || 'N/A';
            const date = new Date(order.order_date || order.createdAt).toLocaleDateString();
            const statusClass = order.order_status || 'pending';
            
            return `
                <tr>
                    <td>${order.order_id || 'N/A'}</td>
                    <td>${items}</td>
                    <td>₹${order.total_amount || 0}</td>
                    <td><span class="status-badge ${statusClass}">${statusClass}</span></td>
                    <td>${date}</td>
                    <td>
                        <button class="btn-sm view" onclick="viewOrder('${order._id || order.order_id}')">
                            View
                        </button>
                    </td>
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
function viewMenu() {
    window.location.href = 'menu.html';
}

function myOrders() {
    document.querySelector('.section').scrollIntoView({ behavior: 'smooth' });
}

function viewProfile() {
    alert('Profile feature coming soon!');
}

function viewOrder(orderId) {
    alert(`View order details for: ${orderId}`);
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
