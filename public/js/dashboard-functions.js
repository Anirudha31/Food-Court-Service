// Dashboard Functions
class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.init();
    }

    init() {
        console.log('📊 Dashboard Manager initializing...');
        console.log('🔍 Checking authentication...');
        this.checkAuthentication();
        console.log('🎯 Setting up event listeners...');
        this.setupEventListeners();
        console.log('📊 Loading dashboard data...');
        this.loadDashboardData();
        console.log('✅ Dashboard initialization complete!');
    }

    checkAuthentication() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const userRole = localStorage.getItem('userRole');

        if (!token || !userStr || !userRole) {
            console.log('❌ No authentication found, redirecting to login');
            this.redirectToLogin();
            return;
        }

        this.currentUser = JSON.parse(userStr);
        this.userRole = userRole;

        // Verify user role matches current dashboard
        this.verifyUserRole();
        this.updateUserInfo();
    }

    verifyUserRole() {
        const currentPath = window.location.pathname;
        const expectedRole = this.extractRoleFromPath(currentPath);

        if (this.userRole !== expectedRole) {
            console.log('❌ User role mismatch, redirecting');
            localStorage.clear();
            this.redirectToLogin();
            return;
        }
    }

    extractRoleFromPath(path) {
        if (path.includes('admin')) return 'admin';
        if (path.includes('student')) return 'student';
        if (path.includes('staff')) return 'staff';
        return null;
    }

    updateUserInfo() {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            const icons = {
                admin: 'fas fa-user-shield',
                student: 'fas fa-graduation-cap',
                staff: 'fas fa-user-tie'
            };

            userInfoElement.innerHTML = `
                <i class="${icons[this.userRole]} me-1"></i>${this.currentUser.name} (${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)})
            `;
        }
    }

    setupEventListeners() {
        console.log('🎯 Setting up event listeners for dashboard buttons');
        
        // Add click effects to action buttons
        document.querySelectorAll('.btn-action').forEach(btn => {
            console.log('🔘 Found action button:', btn);
            btn.addEventListener('click', function(e) {
                console.log('🖱️ Button clicked:', this.textContent, 'onclick:', this.getAttribute('onclick'));
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            });
        });

        // Add hover effects to cards
        document.querySelectorAll('.dashboard-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('shadow-lg');
            });
            card.addEventListener('mouseleave', function() {
                this.classList.remove('shadow-lg');
            });
        });
    }

    async loadDashboardData() {
        console.log(`📊 Loading ${this.userRole} dashboard data`);
        
        try {
            await Promise.all([
                this.loadOrders(),
                this.loadStats()
            ]);
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
        }
    }

    async loadOrders() {
        const token = localStorage.getItem('token');
        
        try {
            const response = await axios.get('/api/orders/my-orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const orders = response.data.orders || [];
            this.updateOrdersDisplay(orders);
            return orders;
        } catch (error) {
            console.error('❌ Failed to load orders:', error);
            this.showError('Failed to load orders');
            return [];
        }
    }

    async loadStats() {
        const token = localStorage.getItem('token');
        
        try {
            // Load different stats based on user role
            if (this.userRole === 'admin') {
                await this.loadAdminStats(token);
            } else {
                await this.loadUserStats(token);
            }
        } catch (error) {
            console.error('❌ Failed to load stats:', error);
        }
    }

    async loadAdminStats(token) {
        try {
            // Since backend API endpoints might not be implemented yet, 
            // let's show placeholder data and try to fetch what we can
            console.log('📊 Loading admin stats (placeholder mode)');
            
            // Try to fetch basic data, but don't fail if endpoints don't exist
            let users = [], orders = [], menuItems = [];
            
            try {
                const usersResponse = await axios.get('/api/users', { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                users = usersResponse.data.users || [];
            } catch (error) {
                console.log('⚠️ Users endpoint not available:', error.message);
                users = this.generatePlaceholderUsers();
            }
            
            try {
                const ordersResponse = await axios.get('/api/orders', { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                orders = ordersResponse.data.orders || [];
            } catch (error) {
                console.log('⚠️ Orders endpoint not available:', error.message);
                orders = this.generatePlaceholderOrders();
            }
            
            try {
                const menuResponse = await axios.get('/api/menu/today', { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                menuItems = menuResponse.data.menu || [];
            } catch (error) {
                console.log('⚠️ Menu endpoint not available:', error.message);
                menuItems = this.generatePlaceholderMenu();
            }
            
            const revenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0);

            this.updateStatDisplay('totalUsers', users.length);
            this.updateStatDisplay('totalOrders', orders.length);
            this.updateStatDisplay('totalRevenue', `₹${revenue}`);
            this.updateStatDisplay('menuItems', menuItems.length);

            this.updateSystemStats(orders, revenue);
        } catch (error) {
            console.error('❌ Failed to load admin stats:', error);
        }
    }

    async loadUserStats(token) {
        const orders = await this.loadOrders();
        
        const stats = {
            total: orders.length,
            completed: orders.filter(o => o.order_status === 'served').length,
            pending: orders.filter(o => o.order_status === 'pending' || o.order_status === 'confirmed').length,
            spent: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0)
        };

        this.updateStatDisplay('totalOrders', stats.total);
        this.updateStatDisplay('completedOrders', stats.completed);
        this.updateStatDisplay('pendingOrders', stats.pending);
        this.updateStatDisplay('totalSpent', `₹${stats.spent}`);
    }

    updateStatDisplay(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            element.parentElement.classList.add('fade-in');
        }
    }

    updateOrdersDisplay(orders) {
        const ordersElement = document.getElementById('recentOrders') || document.getElementById('myOrders');
        if (!ordersElement) return;

        const ordersHtml = orders.slice(0, 5).map(order => `
            <div class="order-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="order-id">${order.order_id}</div>
                        <div class="order-date">${new Date(order.order_date).toLocaleString()}</div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-${this.getStatusColor(order.order_status)} order-status">${order.order_status}</span>
                        <div class="order-amount">₹${order.total_amount}</div>
                    </div>
                </div>
            </div>
        `).join('');

        ordersElement.innerHTML = ordersHtml || '<p class="text-muted text-center">No orders yet</p>';
    }

    updateSystemStats(orders, revenue) {
        const systemStatsElement = document.getElementById('systemStats');
        if (!systemStatsElement) return;

        const statsHtml = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Order Statistics</h6>
                    <p>Total Orders: ${orders.length}</p>
                    <p>Pending: ${orders.filter(o => o.order_status === 'pending').length}</p>
                    <p>Completed: ${orders.filter(o => o.order_status === 'served').length}</p>
                </div>
                <div class="col-md-6">
                    <h6>Revenue Summary</h6>
                    <p>Total Revenue: ₹${revenue}</p>
                    <p>Avg Order Value: ₹${orders.length > 0 ? Math.round(revenue/orders.length) : 0}</p>
                    <p>Today's Orders: ${orders.filter(o => new Date(o.order_date).toDateString() === new Date().toDateString()).length}</p>
                </div>
            </div>
        `;

        systemStatsElement.innerHTML = statsHtml;
    }

    getStatusColor(status) {
        const colors = {
            'pending': 'warning',
            'confirmed': 'info',
            'preparing': 'primary',
            'ready': 'success',
            'served': 'secondary',
            'cancelled': 'danger'
        };
        return colors[status] || 'secondary';
    }

    showError(message) {
        const errorElement = document.getElementById('recentOrders') || document.getElementById('myOrders');
        if (errorElement) {
            errorElement.innerHTML = `<p class="text-danger text-center">${message}</p>`;
        }
    }

    redirectToLogin() {
        const loginPages = {
            admin: 'admin-login.html',
            student: 'student-login.html',
            staff: 'staff-login.html'
        };
        window.location.href = loginPages[this.userRole] || 'index.html';
    }

    logout() {
        console.log('🚪 Logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        window.location.href = 'index.html';
    }

    // Action methods for different user types
    showProfile() {
        const profileInfo = `
            ${this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1)} Profile:
            
            Name: ${this.currentUser.name}
            ${this.userRole === 'admin' ? 'Admin' : this.userRole === 'student' ? 'Student' : 'Staff'} ID: ${this.currentUser.college_id}
            Email: ${this.currentUser.email}
            ${this.currentUser.department ? `Department: ${this.currentUser.department}` : ''}
            ${this.currentUser.phone ? `Phone: ${this.currentUser.phone}` : ''}
        `;
        alert(profileInfo.trim());
    }

    // Placeholder methods for future functionality
    viewReports() {
        this.showReportsModal();
    }

    showReportsModal() {
        console.log('📊 Creating reports modal');
        
        // Remove any existing modal
        const existingModal = document.getElementById('reportsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create new modal
        const modal = this.createModal('reportsModal', `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-chart-bar me-2"></i>System Reports
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6>Report Period</h6>
                                <select class="form-select" id="reportPeriod">
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <h6>Report Type</h6>
                                <select class="form-select" id="reportType">
                                    <option value="revenue">Revenue Report</option>
                                    <option value="orders">Order Report</option>
                                    <option value="users">User Report</option>
                                    <option value="menu">Menu Report</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-12">
                                <button class="btn btn-primary w-100" onclick="dashboardManager.generateReport()">
                                    <i class="fas fa-chart-line me-2"></i>Generate Report
                                </button>
                            </div>
                        </div>
                        
                        <div id="reportContent" class="row">
                            <div class="col-12 text-center">
                                <i class="fas fa-spinner fa-spin fa-3x me-3"></i>
                                <h6>Generating Report...</h6>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-success" onclick="dashboardManager.downloadReport()">
                            <i class="fas fa-download me-2"></i>Download Report
                        </button>
                    </div>
                </div>
            </div>
        `);
        document.body.appendChild(modal);
        
        // Show modal with slight delay to ensure DOM is ready
        setTimeout(() => {
            const bsModal = new bootstrap.Modal(modal);
            if (bsModal) {
                bsModal.show();
                console.log('✅ Reports modal should be visible now');
            } else {
                console.error('❌ Failed to create Bootstrap modal');
            }
        }, 100);
    }

    createModal(id, content) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = id;
        modal.innerHTML = content;
        return modal;
    }

    generateReport() {
        const period = document.getElementById('reportPeriod').value;
        const type = document.getElementById('reportType').value;
        const reportContent = document.getElementById('reportContent');
        
        console.log(`📊 Generating ${type} report for ${period}`);
        
        // Show loading state
        reportContent.innerHTML = `
            <div class="col-12 text-center">
                <i class="fas fa-spinner fa-spin fa-3x me-3"></i>
                <h6>Generating ${type} report...</h6>
            </div>
        `;
        
        // Simulate report generation
        setTimeout(() => {
            let reportHtml = '';
            
            switch(type) {
                case 'revenue':
                    reportHtml = this.generateRevenueReport(period);
                    break;
                case 'orders':
                    reportHtml = this.generateOrderReport(period);
                    break;
                case 'users':
                    reportHtml = this.generateUserReport(period);
                    break;
                case 'menu':
                    reportHtml = this.generateMenuReport(period);
                    break;
                default:
                    reportHtml = '<p>Invalid report type selected.</p>';
            }
            
            reportContent.innerHTML = reportHtml;
        }, 1500);
    }

    generateRevenueReport(period) {
        const revenue = 45000; // Placeholder data
        const orders = 125; // Placeholder data
        
        return `
            <div class="col-12">
                <h6>Revenue Report - ${period}</h6>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Total Revenue</th>
                                <th>Total Orders</th>
                                <th>Average Order Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${period}</td>
                                <td>₹${revenue.toLocaleString()}</td>
                                <td>${orders}</td>
                                <td>₹${Math.round(revenue/orders).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateOrderReport(period) {
        const orders = [
            { status: 'served', count: 45 },
            { status: 'pending', count: 12 },
            { status: 'cancelled', count: 3 }
        ];
        
        return `
            <div class="col-12">
                <h6>Order Report - ${period}</h6>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Count</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(order => `
                                <tr>
                                    <td>
                                        <span class="badge bg-${this.getStatusColor(order.status)}">${order.status}</span>
                                    </td>
                                    <td>${order.count}</td>
                                    <td>${Math.round((order.count/orders.reduce((sum, o) => sum + o.count, 0) * 100))}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateUserReport(period) {
        const users = [
            { role: 'admin', count: 5 },
            { role: 'student', count: 150 },
            { role: 'staff', count: 25 }
        ];
        
        return `
            <div class="col-12">
                <h6>User Report - ${period}</h6>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>User Role</th>
                                <th>Total Users</th>
                                <th>Active Users</th>
                                <th>New Users (This ${period})</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>
                                        <span class="badge bg-info">${user.role}</span>
                                    </td>
                                    <td>${user.count}</td>
                                    <td>${Math.round(user.count * 0.8)}</td>
                                    <td>${Math.round(user.count * 0.2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateMenuReport(period) {
        const menuItems = [
            { category: 'breakfast', count: 15, avgPrice: 80 },
            { category: 'lunch', count: 25, avgPrice: 120 },
            { category: 'snacks', count: 20, avgPrice: 60 }
        ];
        
        return `
            <div class="col-12">
                <h6>Menu Report - ${period}</h6>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Items Count</th>
                                <th>Average Price</th>
                                <th>Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${menuItems.map(item => `
                                <tr>
                                    <td>${item.category}</td>
                                    <td>${item.count}</td>
                                    <td>₹${item.avgPrice}</td>
                                    <td>₹${(item.count * item.avgPrice).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    downloadReport() {
        const period = document.getElementById('reportPeriod').value;
        const type = document.getElementById('reportType').value;
        
        console.log(`💾 Downloading ${type} report for ${period}`);
        alert(`Report "${type}" for "${period}" is ready for download. This feature will be implemented with backend integration.`);
    }

    viewOrders() {
        this.showOrderManagementModal();
    }

    // Backward-compatible alias (typo fix)
    placeviewOrders() {
        this.showOrderManagementModal();
    }

    showOrderManagementModal() {
        console.log('📦 Creating order management modal');
        
        // Remove any existing modal
        const existingModal = document.getElementById('orderManagementModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create new modal
        const modal = this.createOrderManagementModal();
        document.body.appendChild(modal);
        
        // Show modal with slight delay to ensure DOM is ready
        setTimeout(() => {
            const bsModal = new bootstrap.Modal(modal);
            if (bsModal) {
                bsModal.show();
                console.log('✅ Order management modal should be visible now');
            } else {
                console.error('❌ Failed to create Bootstrap modal');
            }
        }, 100);
    }

    createOrderManagementModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'orderManagementModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-shopping-cart me-2"></i>Order Management
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <div class="input-group">
                                    <input type="text" class="form-control" id="orderSearchInput" placeholder="Search orders...">
                                    <button class="btn btn-outline-secondary" onclick="dashboardManager.searchOrders()">
                                        <i class="fas fa-search"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <select class="form-select" id="statusFilter" onchange="dashboardManager.filterOrdersByStatus()">
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="ready">Ready</option>
                                    <option value="served">Served</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <input type="date" class="form-control" id="dateFilter" onchange="dashboardManager.filterOrdersByDate()">
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="ordersTableBody">
                                    <tr>
                                        <td colspan="6" class="text-center">
                                            <i class="fas fa-spinner fa-spin me-2"></i>Loading orders...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="dashboardManager.updateOrderStatus()">
                            <i class="fas fa-save me-2"></i>Update Status
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    async loadOrdersForManagement() {
        const token = localStorage.getItem('token');
        const tbody = document.getElementById('ordersTableBody');
        
        if (!tbody) return;

        try {
            const response = await axios.get('/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const orders = response.data.orders || this.generatePlaceholderOrders();
            this.displayOrdersTable(orders);
        } catch (error) {
            console.log('⚠️ Orders API not available, using placeholder data');
            const orders = this.generatePlaceholderOrders();
            this.displayOrdersTable(orders);
        }
    }

    displayOrdersTable(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        const ordersHtml = orders.map(order => `
            <tr id="order-${order._id}">
                <td>
                    <span class="order-id">${order.order_id}</span>
                </td>
                <td>
                    <span class="customer-name">${order.customer_name || 'Walk-in Customer'}</span>
                </td>
                <td>
                    <span class="order-amount">₹${order.total_amount}</span>
                </td>
                <td>
                    <span class="badge bg-${this.getStatusColor(order.order_status)}">${order.order_status}</span>
                </td>
                <td>
                    <span class="order-date">${new Date(order.order_date).toLocaleString()}</span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="dashboardManager.viewOrderDetails('${order._id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="dashboardManager.updateOrderStatus('${order._id}', 'served')" title="Mark as Served">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="dashboardManager.updateOrderStatus('${order._id}', 'cancelled')" title="Cancel Order">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = ordersHtml || '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
    }

    searchOrders() {
        const searchTerm = document.getElementById('orderSearchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const rows = document.querySelectorAll('#ordersTableBody tr');
        
        rows.forEach(row => {
            const id = row.id.replace('order-', '');
            const order = this.findOrderById(id);
            if (order) {
                const matchesSearch = order.order_id.toLowerCase().includes(searchTerm) || 
                                     (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm));
                const matchesStatus = !statusFilter || order.order_status === statusFilter;
                row.style.display = (matchesSearch && matchesStatus) || searchTerm === '' ? '' : 'none';
            }
        });
    }

    filterOrdersByDate() {
        const dateFilter = document.getElementById('dateFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const rows = document.querySelectorAll('#ordersTableBody tr');
        
        rows.forEach(row => {
            const id = row.id.replace('order-', '');
            const order = this.findOrderById(id);
            if (order) {
                const orderDate = new Date(order.order_date).toDateString();
                const filterDate = dateFilter ? new Date(dateFilter).toDateString() : '';
                const matchesStatus = !statusFilter || order.order_status === statusFilter;
                const matchesDate = !filterDate || orderDate === filterDate;
                row.style.display = (matchesStatus && matchesDate) ? '' : 'none';
            }
        });
    }

    findOrderById(orderId) {
        const orders = this.generatePlaceholderOrders();
        return orders.find(o => o._id === orderId);
    }

    viewOrderDetails(orderId) {
        const order = this.findOrderById(orderId);
        if (order) {
            const details = `
                Order Details:
                
                Order ID: ${order.order_id}
                Customer: ${order.customer_name || 'Walk-in Customer'}
                Amount: ₹${order.total_amount}
                Status: ${order.order_status}
                Payment Status: ${order.payment_status}
                Date: ${new Date(order.order_date).toLocaleString()}
                Items: ${order.items ? order.items.map(i => `- ${i.name} (₹${i.price})`).join('\n') : 'No items details'}
            `;
            alert(details.trim());
        }
    }

    updateOrderStatus(orderId, newStatus) {
        const order = this.findOrderById(orderId);
        if (order) {
            order.order_status = newStatus;
            console.log(`📦 Updated order ${orderId} status to ${newStatus}`);
            
            // Update the display
            const statusElement = document.querySelector(`#order-${orderId} .badge`);
            if (statusElement) {
                statusElement.textContent = newStatus;
                statusElement.className = `badge bg-${this.getStatusColor(newStatus)}`;
            }
        }
    }

    saveOrderStatusChanges() {
        alert('Order status changes saved! This will be implemented in backend API.');
    }

    scanQR() {
        alert('QR Scanner functionality will be implemented here.');
    }

    manageUsers() {
        this.showUserManagementModal();
    }

    showUserManagementModal() {
        console.log('🔧 Creating user management modal');
        
        // Remove any existing modal
        const existingModal = document.getElementById('userManagementModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create new modal
        const modal = this.createUserManagementModal();
        document.body.appendChild(modal);
        
        // Show modal with slight delay to ensure DOM is ready
        setTimeout(() => {
            // Use custom modal system instead of Bootstrap
            const modalInstance = new CustomModal();
            modalInstance.show(modal);
            console.log('✅ User management modal should be visible now');
            
            // Load users after modal is shown
            this.loadUsersForManagement();
        }, 100);
    }

    createUserManagementModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'userManagementModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-users me-2"></i>User Management
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <button class="btn btn-primary w-100" onclick="dashboardManager.addNewUser()">
                                    <i class="fas fa-plus me-2"></i>Add New User
                                </button>
                            </div>
                            <div class="col-md-6">
                                <div class="input-group">
                                    <input type="text" class="form-control" id="userSearchInput" placeholder="Search users...">
                                    <button class="btn btn-outline-secondary" onclick="dashboardManager.searchUsers()">
                                        <i class="fas fa-search"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>College ID</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="usersTableBody">
                                    <tr>
                                        <td colspan="6" class="text-center">
                                            <i class="fas fa-spinner fa-spin me-2"></i>Loading users...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="dashboardManager.saveUserChanges()">
                            <i class="fas fa-save me-2"></i>Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    async loadUsersForManagement() {
        const token = localStorage.getItem('token');
        const tbody = document.getElementById('usersTableBody');
        
        if (!tbody) return;

        try {
            const response = await axios.get('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            this.users = response.data.users || [];
            this.displayUsersTable(this.users);
        } catch (error) {
            console.log('⚠️ Users API not available, using placeholder data');
            this.users = this.generatePlaceholderUsers();
            this.displayUsersTable(this.users);
        }
    }

    displayUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        console.log('👥 Displaying users table with:', users);

        const usersHtml = users.map(user => `
            <tr id="user-${user._id}">
                <td>
                    <input type="text" class="form-control form-control-sm" id="name-${user._id}" value="${user.name || ''}" placeholder="Name">
                </td>
                <td>
                    <input type="email" class="form-control form-control-sm" id="email-${user._id}" value="${user.email || ''}" placeholder="Email">
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm" id="college-id-${user._id}" value="${user.college_id || ''}" placeholder="College ID">
                </td>
                <td>
                    <select class="form-select form-select-sm" id="role-${user._id}" onchange="dashboardManager.updateUserRole('${user._id}', this.value)">
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                        <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                    </select>
                </td>
                <td>
                    <select class="form-select form-select-sm" id="status-${user._id}" onchange="dashboardManager.updateUserStatus('${user._id}', this.value)">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="dashboardManager.editUser('${user._id}')" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="dashboardManager.resetPassword('${user._id}')" title="Reset Password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="dashboardManager.deleteUser('${user._id}')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = usersHtml || '<tr><td colspan="6" class="text-center">No users found</td></tr>';
    }

    searchUsers() {
        const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
        const rows = document.querySelectorAll('#usersTableBody tr');
        
        rows.forEach(row => {
            const id = row.id.replace('user-', '');
            const user = this.findUserById(id);
            if (user) {
                const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                                     user.email.toLowerCase().includes(searchTerm) ||
                                     user.college_id.toLowerCase().includes(searchTerm);
                row.style.display = matchesSearch || searchTerm === '' ? '' : 'none';
            }
        });
    }

    findUserById(userId) {
        const users = this.users || [];
        return users.find(u => u._id === userId);
    }

    addNewUser() {
        const newUser = {
            _id: 'new-' + Date.now(),
            college_id: '',
            name: '',
            email: '',
            role: 'student',
            status: 'active'
        };

        console.log('🆕 Creating new user:', newUser);

        if (!this.users) {
            this.users = [];
        }

        this.users.unshift(newUser);
        this.displayUsersTable(this.users);

        // Scroll to the new user row and make all fields editable
        setTimeout(() => {
            const newRow = document.getElementById(`user-${newUser._id}`);
            if (newRow) {
                newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                newRow.classList.add('table-warning');
                
                // Make all fields editable and focused
                const nameInput = document.getElementById(`name-${newUser._id}`);
                const emailInput = document.getElementById(`email-${newUser._id}`);
                const collegeIdInput = document.getElementById(`college-id-${newUser._id}`);
                const roleSelect = document.getElementById(`role-${newUser._id}`);
                const statusSelect = document.getElementById(`status-${newUser._id}`);
                
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }
        }, 100);
    }

    editUser(userId) {
        const user = this.findUserById(userId);
        if (!user) return;

        const nameElement = document.getElementById(`name-${userId}`);
        const emailElement = document.getElementById(`email-${userId}`);
        const collegeIdElement = document.getElementById(`college-id-${userId}`);
        const roleElement = document.getElementById(`role-${userId}`);
        const statusElement = document.getElementById(`status-${userId}`);
        
        // Check if current user is admin
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = currentUser.role === 'admin';
        
        if (nameElement && emailElement && collegeIdElement && roleElement && statusElement) {
            // All users can edit name and email
            const newName = prompt('Edit user name:', user.name);
            const newEmail = prompt('Edit user email:', user.email);
            const newCollegeId = prompt('Edit college ID:', user.college_id);
            
            if (newName !== null) nameElement.textContent = newName;
            if (newEmail !== null) emailElement.textContent = newEmail;
            if (newCollegeId !== null) collegeIdElement.textContent = newCollegeId;
            
            // Only admin can change role and status
            if (isAdmin) {
                const newRole = prompt('Edit role:', user.role);
                const newStatus = prompt('Edit status:', user.status);
                
                if (newRole !== null) roleElement.value = newRole;
                if (newStatus !== null) statusElement.value = newStatus;
            } else {
                // Non-admin users cannot change role/status
                roleElement.disabled = true;
                statusElement.disabled = true;
                console.warn('⚠️ Only admins can change role and status');
            }
            
            // Update the user data
            user.name = newName || user.name;
            user.email = newEmail || user.email;
            user.college_id = newCollegeId || user.college_id;
            if (isAdmin) {
                user.role = newRole || user.role;
                user.status = newStatus || user.status;
            }
        }
    }

    updateUserRole(userId, newRole) {
        const user = this.findUserById(userId);
        if (user) {
            user.role = newRole;
            console.log(`📝 Updated user ${userId} role to ${newRole}`);
        }
    }

    updateUserStatus(userId, newStatus) {
        const user = this.findUserById(userId);
        if (user) {
            user.status = newStatus;
            console.log(`📝 Updated user ${userId} status to ${newStatus}`);
        }
    }

    resetPassword(userId) {
        const user = this.findUserById(userId);
        if (user) {
            const newPassword = prompt(`Reset password for ${user.name}:`, 'Enter new password');
            if (newPassword !== null && newPassword !== '') {
                console.log(`🔑 Reset password for user ${userId}: ${newPassword}`);
                alert(`Password reset for ${user.name} will be implemented in backend.`);
            }
        }
    }

    deleteUser(userId) {
        const user = this.findUserById(userId);
        if (user && confirm(`Are you sure you want to delete user "${user.name}" (${user.college_id})?`)) {
            // Remove from display
            const row = document.getElementById(`user-${userId}`);
            if (row) {
                row.style.transition = 'opacity 0.3s';
                row.style.opacity = '0';
                setTimeout(() => {
                    row.remove();
                }, 300);
            }
            
            console.log(`🗑️ Deleted user: ${user.name} (${user.college_id})`);
            alert(`User "${user.name}" has been deleted. This will be implemented in backend.`);
        }
    }

    saveUserChanges() {
        const users = this.users || [];
        const changes = [];
        
        console.log('🔍 Processing users for save:', users);
        
        users.forEach(user => {
            const nameElement = document.getElementById(`name-${user._id}`);
            const emailElement = document.getElementById(`email-${user._id}`);
            const roleElement = document.getElementById(`role-${user._id}`);
            const statusElement = document.getElementById(`status-${user._id}`);
            const collegeIdElement = document.getElementById(`college-id-${user._id}`);
            
            console.log('🔍 Checking user elements:', {
                nameElement: !!nameElement,
                emailElement: !!emailElement,
                roleElement: !!roleElement,
                statusElement: !!statusElement,
                collegeIdElement: !!collegeIdElement,
                userId: user._id,
                userData: user
            });
            
            if (nameElement && emailElement && roleElement && statusElement && collegeIdElement) {
                const updatedData = {
                    id: user._id,
                    name: nameElement.value,
                    email: emailElement.value,
                    college_id: collegeIdElement.value,
                    role: roleElement.value,
                    status: statusElement.value
                };
                
                console.log('🔍 User data before save:', updatedData);
                
                // Only save if name is provided
                if (updatedData.name) {
                    changes.push({
                        id: user._id,
                        ...updatedData
                    });
                } else {
                    console.warn('⚠️ Skipping user without name:', user);
                }
            } else {
                console.warn('⚠️ Missing elements for user:', user._id);
            }
        });
        
        console.log('💾 User changes detected:', changes);
        
        if (changes.length > 0) {
            console.log('💾 Saving user changes to MongoDB...');
            
            // Process each change and send to backend
            changes.forEach(async (change) => {
                try {
                    if (change.id.startsWith('new-')) {
                        // Create new user via API
                        const response = await axios.post('/api/users', {
                            name: change.name,
                            email: change.email,
                            college_id: change.college_id,
                            role: change.role,
                            status: change.status
                        }, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        
                        console.log('✅ Created new user in MongoDB:', response.data);
                        
                        // Update the user ID with the real ID from database
                        const createdUser = response.data.user;
                        if (createdUser && createdUser._id) {
                            // Update the user in our local array
                            const localUser = users.find(u => u._id === change.id);
                            if (localUser) {
                                localUser._id = createdUser._id;
                                localUser.name = createdUser.name;
                                localUser.email = createdUser.email;
                                localUser.college_id = createdUser.college_id;
                            }
                        }
                        
                    } else {
                        // Update existing user via API
                        await axios.put(`/api/users/${change.id}`, {
                            name: change.name,
                            email: change.email,
                            college_id: change.college_id,
                            role: change.role,
                            status: change.status
                        }, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        
                        console.log('✅ Updated user in MongoDB:', change.id);
                    }
                } catch (error) {
                    console.error('❌ Error saving user to MongoDB:', error);
                    alert('Error saving user to database. Please check console for details.');
                }
            });
            
            alert(`User changes saved successfully!\n\n${changes.map(c => `- ${c.name} (${c.college_id}): Role=${c.role}, Status=${c.status}`).join('\n')}`);
            
            // Reload users from database to get fresh data
            this.loadUsersForManagement();
        } else {
            alert('No changes to save. Please add user names.');
        }
    }

    manageMenu() {
        this.showMenuManagementModal();
    }

    showMenuManagementModal() {
        console.log('🍽 Creating menu management modal');
        this.createAndShowModal('menuManagementModal', `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-utensils me-2"></i>Menu Management
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <button class="btn btn-primary w-100" onclick="dashboardManager.addMenuItem()">
                                    <i class="fas fa-plus me-2"></i>Add Menu Item
                                </button>
                            </div>
                            <div class="col-md-6">
                                <div class="input-group">
                                    <input type="text" class="form-control" id="menuSearchInput" placeholder="Search menu items...">
                                    <button class="btn btn-outline-secondary" onclick="dashboardManager.searchMenuItems()">
                                        <i class="fas fa-search"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Price</th>
                                        <th>Category</th>
                                        <th>Available</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="menuTableBody">
                                    <tr>
                                        <td colspan="5" class="text-center">
                                            <i class="fas fa-spinner fa-spin me-2"></i>Loading menu items...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="dashboardManager.saveMenuChanges()">
                            <i class="fas fa-save me-2"></i>Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `);

        this.loadMenuItemsForManagement();
    }

    createAndShowModal(modalId, modalContent) {
        // Remove any existing modal
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create new modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        modal.addEventListener('hidden.bs.modal', () => {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        });
        
        // Show modal with slight delay to ensure DOM is ready
        setTimeout(() => {
            const bsModal = new bootstrap.Modal(modal);
            if (bsModal) {
                bsModal.show();
                console.log(`✅ ${modalId} should be visible now`);
            } else {
                console.error('❌ Failed to create Bootstrap modal');
            }
        }, 100);
    }

    // Menu management methods
    async loadMenuItemsForManagement() {
        const token = localStorage.getItem('token');
        const tbody = document.getElementById('menuTableBody');
        
        if (!tbody) return;

        try {
            const response = await axios.get('/api/menu/manage/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            this.menuItems = response.data.menuItems || [];
            this.displayMenuItemsTable(this.menuItems);
        } catch (error) {
            console.log('⚠️ Menu API not available, using placeholder data');
            this.menuItems = this.generatePlaceholderMenu();
            this.displayMenuItemsTable(this.menuItems);
        }
    }

    displayMenuItemsTable(menuItems) {
        const tbody = document.getElementById('menuTableBody');
        if (!tbody) return;

        const menuHtml = menuItems.map(item => `
            <tr id="menu-${item._id}">
                <td>
                    <input type="text" class="form-control form-control-sm" id="name-${item._id}" value="${item.dish_name || ''}" placeholder="Item name" autocomplete="off">
                </td>
                <td>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">₹</span>
                        <input type="number" class="form-control" id="price-${item._id}" value="${item.price}" min="0">
                    </div>
                </td>
                <td>
                    <select class="form-select form-select-sm" id="category-${item._id}" onchange="dashboardManager.updateMenuItemCategory('${item._id}', this.value)">
                        <option value="breakfast" ${item.category === 'breakfast' ? 'selected' : ''}>Breakfast</option>
                        <option value="lunch" ${item.category === 'lunch' ? 'selected' : ''}>Lunch</option>
                        <option value="snacks" ${item.category === 'snacks' ? 'selected' : ''}>Snacks</option>
                        <option value="beverages" ${item.category === 'beverages' ? 'selected' : ''}>Beverages</option>
                    </select>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm" id="quantity-${item._id}" value="${item.available_quantity}" min="0" onchange="dashboardManager.updateMenuItemQuantity('${item._id}', this.value)">
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="dashboardManager.editMenuItem('${item._id}')" title="Edit Menu Item">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="dashboardManager.toggleMenuItemAvailability('${item._id}')" title="Toggle Availability">
                            <i class="fas fa-eye${item.is_available ? '-slash' : ''}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="dashboardManager.deleteMenuItem('${item._id}')" title="Delete Menu Item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = menuHtml || '<tr><td colspan="5" class="text-center">No menu items found</td></tr>';
    }

    searchMenuItems() {
        const searchTerm = document.getElementById('menuSearchInput').value.toLowerCase();
        const rows = document.querySelectorAll('#menuTableBody tr');
        
        rows.forEach(row => {
            const id = row.id.replace('menu-', '');
            const item = this.findMenuItemById(id);
            if (item) {
                const matchesSearch = item.dish_name.toLowerCase().includes(searchTerm) || 
                                     item.category.toLowerCase().includes(searchTerm);
                row.style.display = matchesSearch || searchTerm === '' ? '' : 'none';
            }
        });
    }

    findMenuItemById(itemId) {
        const menuItems = this.menuItems || this.generatePlaceholderMenu();
        return menuItems.find(i => i._id === itemId);
    }

    async addMenuItem() {
        const token = localStorage.getItem('token');
        
        const newItem = {
            _id: 'new-' + Date.now(),
            dish_name: '',
            price: 0,
            category: 'lunch',
            available_quantity: 0,
            is_available: true,
            date: new Date().toISOString().split('T')[0]
        };

        console.log('🆕 Creating new menu item:', newItem);

        if (!this.menuItems) {
            this.menuItems = [];
        }

        // Add to UI immediately for better UX
        this.menuItems.unshift(newItem);
        this.displayMenuItemsTable(this.menuItems);

        // Scroll to new item row
        setTimeout(() => {
            const newRow = document.getElementById(`menu-${newItem._id}`);
            if (newRow) {
                newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                newRow.classList.add('table-warning');
                const nameInput = document.getElementById(`name-${newItem._id}`);
                if (nameInput) {
                    nameInput.focus();
                }
            }
        }, 100);
    }

    async saveMenuChanges() {
        const token = localStorage.getItem('token');
        const menuItems = this.menuItems || [];
        const changes = [];
        
        for (const item of menuItems) {
            const nameElement = document.getElementById(`name-${item._id}`);
            const priceElement = document.getElementById(`price-${item._id}`);
            const quantityElement = document.getElementById(`quantity-${item._id}`);
            const categoryElement = document.getElementById(`category-${item._id}`);
            
            if (nameElement && priceElement && quantityElement && categoryElement) {
                const updatedData = {
                    name: nameElement.value.trim(),
                    price: parseFloat(priceElement.value) || 0,
                    quantity: parseInt(quantityElement.value) || 0,
                    category: categoryElement.value
                };
                
                // Only save if name is provided
                if (updatedData.name) {
                    changes.push({
                        id: item._id,
                        ...updatedData
                    });
                }
            }
        }
        
        if (changes.length === 0) {
            alert('No valid items to save. Please add item names.');
            return;
        }
        
        try {
            console.log('💾 Saving menu changes:', changes);
            
            // Process each change
            for (const change of changes) {
                if (change.id && typeof change.id === 'string' && change.id.startsWith('new-')) {
                    // Create new item
                    const newItem = {
                        dish_name: change.name,
                        price: change.price,
                        available_quantity: change.quantity,
                        category: change.category,
                        date: new Date().toISOString().split('T')[0]
                    };
                    
                    await axios.post('/api/menu', newItem, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    console.log(`✅ Created new menu item: ${newItem.dish_name}`);
                } else if (change.id) {
                    // Update existing item
                    await axios.put(`/api/menu/${change.id}`, {
                        dish_name: change.name,
                        price: change.price,
                        available_quantity: change.quantity,
                        category: change.category
                    }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    console.log(`✅ Updated menu item: ${change.name}`);
                } else {
                    console.warn('⚠️ Skipping change without valid ID:', change);
                }
            }
            
            alert(`Menu changes saved successfully!\n\n${changes.map(c => `- ${c.name}: ₹${c.price}, Qty: ${c.quantity}, Cat: ${c.category}`).join('\n')}`);
            
            // Reload menu items to get fresh data
            this.loadMenuItemsForManagement();
            
        } catch (error) {
            console.error('❌ Error saving menu changes:', error);
            alert('Error saving menu changes. Please check console for details.');
        }
    }

    editMenuItem(itemId) {
        const item = this.findMenuItemById(itemId);
        if (!item) return;

        const nameElement = document.getElementById(`name-${itemId}`);
        const priceElement = document.getElementById(`price-${itemId}`);
        const quantityElement = document.getElementById(`quantity-${itemId}`);
        
        if (nameElement && priceElement && quantityElement) {
            const newName = prompt('Edit menu item name:', item.dish_name);
            const newPrice = prompt('Edit price (₹):', item.price);
            const newQuantity = prompt('Edit available quantity:', item.available_quantity);
            
            if (newName !== null) nameElement.textContent = newName;
            if (newPrice !== null) priceElement.textContent = '₹' + newPrice;
            if (newQuantity !== null) quantityElement.value = newQuantity;
            
            // Update the item data
            item.dish_name = newName || item.dish_name;
            item.price = parseFloat(newPrice) || item.price;
            item.available_quantity = parseInt(newQuantity) || item.available_quantity;
        }
    }

    updateMenuItemCategory(itemId, newCategory) {
        const item = this.findMenuItemById(itemId);
        if (item) {
            item.category = newCategory;
            console.log(`🍽 Updated menu item ${itemId} category to ${newCategory}`);
        }
    }

    updateMenuItemQuantity(itemId, newQuantity) {
        const item = this.findMenuItemById(itemId);
        if (item) {
            item.available_quantity = parseInt(newQuantity);
            console.log(`📊 Updated menu item ${itemId} quantity to ${newQuantity}`);
        }
    }

    toggleMenuItemAvailability(itemId) {
        const item = this.findMenuItemById(itemId);
        if (item) {
            item.is_available = !item.is_available;
            console.log(`👁️ ${item.is_available ? 'Disabled' : 'Enabled'} menu item ${itemId}`);
            
            // Update the button icon
            const btn = document.querySelector(`button[onclick*="${itemId}"]`);
            if (btn) {
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = `fas fa-eye${item.is_available ? '-slash' : ''}`;
                }
            }
        }
    }

    async deleteMenuItem(itemId) {
        const token = localStorage.getItem('token');
        const item = this.findMenuItemById(itemId);
        if (!item) return;

        if (confirm(`Are you sure you want to delete menu item "${item.dish_name || 'unnamed item'}"?`)) {
            try {
                // Only delete if it's not a new item
                if (!itemId.startsWith('new-')) {
                    await axios.delete(`/api/menu/${itemId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    console.log(`🗑️ Deleted menu item from database: ${item.dish_name}`);
                } else {
                    console.log(`🗑️ Removed new item from UI: ${item.dish_name || 'unnamed'}`);
                }
                
                // Remove from display
                const row = document.getElementById(`menu-${itemId}`);
                if (row) {
                    row.style.transition = 'opacity 0.3s';
                    row.style.opacity = '0';
                    setTimeout(() => {
                        row.remove();
                    }, 300);
                }
                
                // Remove from local array
                this.menuItems = this.menuItems.filter(i => i._id !== itemId);
                
                alert(`Menu item "${item.dish_name || 'unnamed item'}" has been deleted.`);
                
            } catch (error) {
                console.error('❌ Error deleting menu item:', error);
                alert('Error deleting menu item. Please check console for details.');
            }
        }
    }

}

// Global functions for onclick handlers
function logout() {
    dashboardManager.logout();
}

function showProfile() {
    dashboardManager.showProfile();
}

function viewMenu() {
    dashboardManager.viewMenu();
}

function placeOrder() {
    dashboardManager.placeOrder();
}

function scanQR() {
    dashboardManager.scanQR();
}

function loadOrders() {
    dashboardManager.loadOrders();
}

function manageUsers() {
    console.log('🔧 manageUsers() called from global scope');
    if (typeof dashboardManager !== 'undefined') {
        dashboardManager.showUserManagementModal();
    } else {
        console.error('❌ dashboardManager is not defined');
        alert('Dashboard is still loading. Please wait a moment and try again.');
    }
}

function manageMenu() {
    console.log('🍽 manageMenu() function called');
    dashboardManager.manageMenu();
}

// ...
function viewOrders() {
    console.log('📦 viewOrders() function called');
    dashboardManager.viewOrders();
}

function viewReports() {
    console.log('📊 viewReports() function called');
    dashboardManager.viewReports();
}

function systemSettings() {
    console.log('⚙️ systemSettings() function called');
    dashboardManager.systemSettings();
}

// Expose handlers globally for inline onclick attributes
window.manageUsers = manageUsers;
window.manageMenu = manageMenu;
window.viewOrders = viewOrders;
window.viewReports = viewReports;
window.systemSettings = systemSettings;

// Ensure instance method exists even if class definition was cached/partial
DashboardManager.prototype.viewOrders = function() {
    this.showOrderManagementModal();
};

DashboardManager.prototype.manageMenu = function() {
    this.showMenuManagementModal();
};

DashboardManager.prototype.viewReports = function() {
    this.showReportsModal();
};

DashboardManager.prototype.systemSettings = function() {
    alert('System Settings functionality will be implemented in backend API.');
};

// Initialize dashboard manager
let dashboardManager;
window.addEventListener('load', () => {
    console.log('🚀 Page loaded, initializing dashboard...');
    dashboardManager = new DashboardManager();
    
    // Test dashboard manager after initialization
    setTimeout(() => {
        if (dashboardManager) {
            console.log('✅ Dashboard manager created successfully!');
            console.log('🔧 Testing manageUsers method:', typeof dashboardManager.manageUsers);
            console.log('🔧 Testing showUserManagementModal method:', typeof dashboardManager.showUserManagementModal);
        } else {
            console.error('❌ Dashboard manager creation failed');
        }
    }, 500);
});

// Placeholder data generation methods
DashboardManager.prototype.generatePlaceholderUsers = function() {
    return [
        { _id: '1', name: 'John Doe', college_id: 'ADMIN001', email: 'admin@college.edu', role: 'admin' },
        { _id: '2', name: 'Jane Smith', college_id: 'STAFF001', email: 'staff@college.edu', role: 'staff' },
        { _id: '3', name: 'Mike Johnson', college_id: 'STU2024001', email: 'student@college.edu', role: 'student' }
    ];
};

DashboardManager.prototype.generatePlaceholderOrders = function() {
    return [
        { _id: '1', order_id: 'ORD001', order_status: 'served', payment_status: 'paid', total_amount: 150, order_date: new Date().toISOString() },
        { _id: '2', order_id: 'ORD002', order_status: 'pending', payment_status: 'paid', total_amount: 200, order_date: new Date().toISOString() },
        { _id: '3', order_id: 'ORD003', order_status: 'confirmed', payment_status: 'paid', total_amount: 120, order_date: new Date().toISOString() }
    ];
};

DashboardManager.prototype.generatePlaceholderMenu = function() {
    return [
        { _id: '1', dish_name: 'Biryani', price: 120, category: 'lunch', available_quantity: 50 },
        { _id: '2', dish_name: 'Pasta', price: 80, category: 'lunch', available_quantity: 30 },
        { _id: '3', dish_name: 'Sandwich', price: 60, category: 'snacks', available_quantity: 40 }
    ];
};
