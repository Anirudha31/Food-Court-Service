// Main Application Controller
class App {
    constructor() {
        this.init();
    }

    init() {
        // Handle browser back/forward buttons
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Handle initial route
        this.handleRouteChange();

        // Setup global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            ui.showError('An unexpected error occurred');
        });

        // Setup unhandled promise rejection handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            ui.showError('An unexpected error occurred');
        });

        // Auto-refresh dashboard every 5 minutes
        setInterval(() => {
            if (auth.isAuthenticated() && ui.currentPage === 'dashboard') {
                ui.loadDashboard();
            }
        }, 5 * 60 * 1000);

        // Setup periodic menu refresh
        setInterval(() => {
            if (auth.isAuthenticated() && ui.currentPage === 'menu') {
                ui.loadMenu();
            }
        }, 2 * 60 * 1000); // Refresh menu every 2 minutes
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1) || 'login';
        
        // Validate route access based on authentication
        if (!auth.isAuthenticated() && hash !== 'login') {
            window.location.hash = 'login';
            return;
        }

        // Validate admin/staff routes
        if ((hash === 'admin' && !auth.hasRole('admin')) ||
            (hash === 'staff' && !auth.hasAnyRole(['admin', 'staff']))) {
            ui.showError('Access denied');
            window.location.hash = 'dashboard';
            return;
        }

        // Show the appropriate page
        ui.showPage(hash);
    }

    // Global utility methods
    formatCurrency(amount) {
        return api.formatCurrency(amount);
    }

    formatDate(dateString) {
        return api.formatDate(dateString);
    }

    formatTime(dateString) {
        return api.formatTime(dateString);
    }

    formatDateTime(dateString) {
        return api.formatDateTime(dateString);
    }

    getStatusBadgeClass(status) {
        const statusClasses = {
            'pending': 'status-pending',
            'confirmed': 'status-confirmed',
            'preparing': 'status-preparing',
            'ready': 'status-ready',
            'served': 'status-served',
            'cancelled': 'status-cancelled',
            'paid': 'bg-success',
            'unpaid': 'bg-warning',
            'refunded': 'bg-info'
        };
        return statusClasses[status] || 'bg-secondary';
    }

    getRoleBadgeClass(role) {
        const roleClasses = {
            'admin': 'role-admin',
            'student': 'role-student',
            'teacher': 'role-teacher',
            'staff': 'role-staff'
        };
        return roleClasses[role] || 'bg-secondary';
    }

    // Initialize the application when DOM is ready
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            window.app = new App();
        });
    }
}

// Initialize the application
App.init();

// Test that everything is loaded
console.log('Application initialized');
console.log('Auth:', typeof auth);
console.log('UI:', typeof ui);
console.log('API:', typeof api);

// Show a simple test message
window.addEventListener('load', () => {
    console.log('Page fully loaded');
    setTimeout(() => {
        console.log('You can now test login by:');
        console.log('1. Opening browser console (F12)');
        console.log('2. Typing: testLogin()');
        console.log('3. Or clicking the login button manually');
    }, 1000);
});

// Extend UI class with data loading methods
UI.prototype.loadDashboard = async function() {
    try {
        const response = await api.getMyOrders({ limit: 10 });
        const orders = response.data.orders;

        // Calculate statistics
        const stats = {
            total: orders.length,
            pending: orders.filter(o => o.order_status === 'pending').length,
            completed: orders.filter(o => o.order_status === 'served').length,
            totalSpent: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0)
        };

        // Update dashboard cards
        document.getElementById('totalOrders').textContent = stats.total;
        document.getElementById('pendingOrders').textContent = stats.pending;
        document.getElementById('completedOrders').textContent = stats.completed;
        document.getElementById('totalSpent').textContent = `₹${stats.totalSpent}`;

        // Update recent orders
        const recentOrdersHtml = orders.length > 0 ? orders.slice(0, 5).map(order => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <strong>${order.order_id}</strong>
                    <br>
                    <small class="text-muted">${this.formatDateTime(order.order_date)}</small>
                </div>
                <div class="text-end">
                    <span class="badge ${this.getStatusBadgeClass(order.order_status)}">${order.order_status}</span>
                    <br>
                    <strong>₹${order.total_amount}</strong>
                </div>
            </div>
        `).join('') : '<p class="text-muted text-center">No orders yet</p>';

        document.getElementById('recentOrders').innerHTML = recentOrdersHtml;

    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('recentOrders').innerHTML = '<p class="text-danger">Failed to load dashboard data</p>';
    }
};

UI.prototype.loadMenu = async function() {
    try {
        const response = await api.getTodayMenu();
        const menu = response.data.menu;

        if (Object.keys(menu).length === 0) {
            document.getElementById('menuContent').innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
                    <h4>No menu available today</h4>
                    <p class="text-muted">Please check back later</p>
                </div>
            `;
            return;
        }

        const menuHtml = Object.entries(menu).map(([category, items]) => `
            <div class="mb-5">
                <h3 class="mb-3 text-capitalize">${category}</h3>
                <div class="row">
                    ${items.map(item => `
                        <div class="col-md-4 mb-4">
                            <div class="card menu-item h-100">
                                ${item.available_quantity > 0 ? 
                                    `<span class="badge bg-success">Available: ${item.available_quantity}</span>` :
                                    `<span class="badge bg-danger">Out of Stock</span>`
                                }
                                <div class="card-body">
                                    <h5 class="card-title">${item.dish_name}</h5>
                                    <p class="card-text">${item.description || 'Delicious and fresh'}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="price">₹${item.price}</span>
                                        <button class="btn btn-primary btn-sm" 
                                                onclick="ui.addToCart({
                                                    dish_name: '${item.dish_name}',
                                                    price: ${item.price},
                                                    quantity: 1
                                                })"
                                                ${item.available_quantity === 0 ? 'disabled' : ''}>
                                            <i class="fas fa-plus me-1"></i> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        document.getElementById('menuContent').innerHTML = menuHtml;

    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menuContent').innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h4>Failed to load menu</h4>
                <p class="text-muted">Please try again later</p>
                <button class="btn btn-primary" onclick="ui.loadMenu()">Retry</button>
            </div>
        `;
    }
};

UI.prototype.loadOrders = async function() {
    try {
        const response = await api.getMyOrders();
        const orders = response.data.orders;

        if (orders.length === 0) {
            document.getElementById('ordersContent').innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h4>No orders yet</h4>
                    <p class="text-muted">Start by ordering from the menu</p>
                    <button class="btn btn-primary" onclick="ui.showPage('menu')">View Menu</button>
                </div>
            `;
            return;
        }

        const ordersHtml = orders.map(order => `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${order.order_id}</strong>
                        <br>
                        <small class="text-muted">${this.formatDateTime(order.order_date)}</small>
                    </div>
                    <div>
                        <span class="badge ${this.getStatusBadgeClass(order.order_status)}">${order.order_status}</span>
                        <span class="badge ${this.getStatusBadgeClass(order.payment_status)} ms-1">${order.payment_status}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6>Items:</h6>
                            ${order.items.map(item => `
                                <div class="d-flex justify-content-between">
                                    <span>${item.dish_name} x ${item.quantity}</span>
                                    <span>₹${item.subtotal}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="col-md-4 text-end">
                            <h5>Total: ₹${order.total_amount}</h5>
                            ${order.qr_code_data ? `
                                <button class="btn btn-sm btn-info mt-2" onclick="ui.showQRCodeFromData('${order.qr_code_data}')">
                                    <i class="fas fa-qrcode me-1"></i> View QR
                                </button>
                            ` : ''}
                            ${order.order_status === 'pending' && order.payment_status !== 'paid' ? `
                                <button class="btn btn-sm btn-warning mt-2" onclick="ui.cancelOrder('${order._id}')">
                                    <i class="fas fa-times me-1"></i> Cancel
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('ordersContent').innerHTML = ordersHtml;

    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersContent').innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h4>Failed to load orders</h4>
                <p class="text-muted">Please try again later</p>
                <button class="btn btn-primary" onclick="ui.loadOrders()">Retry</button>
            </div>
        `;
    }
};

UI.prototype.loadProfile = async function() {
    // Setup profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('profileName').value,
                email: document.getElementById('profileEmail').value,
                phone: document.getElementById('profilePhone').value,
                department: document.getElementById('profileDepartment').value
            };

            try {
                await api.updateProfile(formData);
                this.showSuccess('Profile updated successfully');
                
                // Update user data in auth
                const updatedUser = { ...auth.getUser(), ...formData };
                auth.user = updatedUser;
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
            } catch (error) {
                this.showError('Failed to update profile');
            }
        });
    }

    // Setup password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }

            try {
                await api.changePassword({ currentPassword, newPassword });
                this.showSuccess('Password changed successfully');
                passwordForm.reset();
            } catch (error) {
                this.showError('Failed to change password');
            }
        });
    }
};

UI.prototype.loadAdminDashboard = async function() {
    try {
        const [usersResponse, statsResponse] = await Promise.all([
            api.getUserStats(),
            api.getAllUsers({ limit: 5 })
        ]);

        const stats = statsResponse.data.stats;
        const recentUsers = statsResponse.data.recentUsers;

        const adminHtml = `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-primary">${stats.total}</h3>
                            <p class="mb-0">Total Users</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-success">${stats.active}</h3>
                            <p class="mb-0">Active Users</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-warning">${stats.inactive}</h3>
                            <p class="mb-0">Inactive Users</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-info">${stats.byRole.student || 0}</h3>
                            <p class="mb-0">Students</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Recent Users</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>College ID</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${recentUsers.map(user => `
                                            <tr>
                                                <td>${user.name}</td>
                                                <td>${user.college_id}</td>
                                                <td><span class="badge ${this.getRoleBadgeClass(user.role)}">${user.role}</span></td>
                                                <td><span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">${user.status}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Quick Actions</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="ui.showUserManagement()">
                                    <i class="fas fa-users me-1"></i> Manage Users
                                </button>
                                <button class="btn btn-success" onclick="ui.showMenuManagement()">
                                    <i class="fas fa-utensils me-1"></i> Manage Menu
                                </button>
                                <button class="btn btn-info" onclick="ui.showOrderManagement()">
                                    <i class="fas fa-shopping-cart me-1"></i> Manage Orders
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('adminContent').innerHTML = adminHtml;

    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        document.getElementById('adminContent').innerHTML = '<p class="text-danger">Failed to load admin dashboard</p>';
    }
};

UI.prototype.loadStaffDashboard = async function() {
    try {
        const response = await api.getStaffDashboard();
        const data = response.data;

        const staffHtml = `
            <div class="row mb-4">
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-primary">${data.stats.total}</h3>
                            <p class="mb-0">Total Orders</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-warning">${data.stats.pending}</h3>
                            <p class="mb-0">Pending</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-info">${data.stats.confirmed}</h3>
                            <p class="mb-0">Confirmed</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-primary">${data.stats.preparing}</h3>
                            <p class="mb-0">Preparing</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-success">${data.stats.ready}</h3>
                            <p class="mb-0">Ready</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-success">₹${data.stats.totalRevenue}</h3>
                            <p class="mb-0">Revenue</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">QR Scanner</h5>
                            <button class="btn btn-primary btn-sm" onclick="ui.openQRScanner()">
                                <i class="fas fa-qrcode me-1"></i> Open Scanner
                            </button>
                        </div>
                        <div class="card-body text-center py-4">
                            <i class="fas fa-qrcode fa-3x text-muted mb-3"></i>
                            <p>Click "Open Scanner" to scan customer QR codes</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Recent Orders</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Status</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.orders.slice(0, 5).map(order => `
                                            <tr>
                                                <td>${order.order_id}</td>
                                                <td>${order.user_id.name}</td>
                                                <td><span class="badge ${this.getStatusBadgeClass(order.order_status)}">${order.order_status}</span></td>
                                                <td>₹${order.total_amount}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('staffContent').innerHTML = staffHtml;

    } catch (error) {
        console.error('Error loading staff dashboard:', error);
        document.getElementById('staffContent').innerHTML = '<p class="text-danger">Failed to load staff dashboard</p>';
    }
};

// Additional utility methods
UI.prototype.showQRCodeFromData = function(qrDataString) {
    try {
        const qrData = JSON.parse(qrDataString);
        // Generate QR code from data (you'll need to implement this)
        this.showQRCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', qrData);
    } catch (error) {
        console.error('Error parsing QR data:', error);
        this.showError('Invalid QR code data');
    }
};

UI.prototype.cancelOrder = async function(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    try {
        await api.cancelOrder(orderId);
        this.showSuccess('Order cancelled successfully');
        this.loadOrders();
    } catch (error) {
        this.showError('Failed to cancel order');
    }
};

UI.prototype.openQRScanner = function() {
    const modal = new bootstrap.Modal(document.getElementById('qrScannerModal'));
    modal.show();
    
    // Initialize QR scanner (you'll need to implement this)
    this.initQRScanner();
};

UI.prototype.initQRScanner = function() {
    // This is a placeholder for QR scanner initialization
    // You'll need to implement actual QR scanning functionality
    const qrReader = document.getElementById('qr-reader');
    qrReader.innerHTML = '<p class="text-center py-4">QR Scanner will be initialized here</p>';
};

// Debug function to test login functionality
window.testLogin = function() {
    console.log('Testing login functionality...');
    console.log('Auth object:', auth);
    console.log('UI object:', ui);
    console.log('Login form:', document.getElementById('loginForm'));
    
    // Test with sample data
    document.getElementById('collegeId').value = 'ADMIN001';
    document.getElementById('password').value = 'admin123';
    
    console.log('Form filled with test credentials');
    console.log('Clicking login button...');
    
    // Try to trigger login
    ui.handleLogin();
};

// Debug login function
window.debugLogin = function() {
    console.log('=== DEBUG LOGIN ===');
    console.log('Window objects available:');
    console.log('- auth:', typeof auth);
    console.log('- ui:', typeof ui);
    console.log('- api:', typeof api);
    console.log('- axios:', typeof axios);
    
    console.log('Form elements:');
    console.log('- loginForm:', document.getElementById('loginForm'));
    console.log('- collegeId:', document.getElementById('collegeId'));
    console.log('- password:', document.getElementById('password'));
    
    console.log('Form values:');
    console.log('- collegeId value:', document.getElementById('collegeId')?.value);
    console.log('- password value:', document.getElementById('password')?.value);
    
    console.log('Event listeners:');
    console.log('- ui.handleLogin:', typeof ui.handleLogin);
    
    // Test if we can call the function directly
    if (typeof ui.handleLogin === 'function') {
        console.log('✅ ui.handleLogin is callable, trying direct call...');
        try {
            ui.handleLogin();
        } catch (error) {
            console.error('❌ Direct call failed:', error);
        }
    } else {
        console.log('❌ ui.handleLogin is not a function');
    }
    
    console.log('=== END DEBUG ===');
};

// Direct login test function
window.testDirectLogin = function() {
    console.log('Testing direct API login...');
    
    const collegeId = document.getElementById('collegeId').value || 'ADMIN001';
    const password = document.getElementById('password').value || 'admin123';
    
    console.log('Attempting login with:', collegeId);
    
    // Direct API call - same as working simple login
    axios.post('/api/auth/login', {
        college_id: collegeId,
        password: password
    })
    .then(response => {
        console.log('Direct login SUCCESS:', response.data);
        alert('Login successful! Check console for details.');
        
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update auth object
        auth.token = response.data.token;
        auth.user = response.data.user;
        
        // Update UI and show dashboard
        auth.updateUI();
        ui.showPage('dashboard');
    })
    .catch(error => {
        console.error('Direct login ERROR:', error);
        alert('Login failed! Check console for details.');
    });
};
