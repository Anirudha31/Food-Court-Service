// UI Module
class UI {
    constructor() {
        this.currentPage = 'login';
        this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRazorpay();
    }

    setupEventListeners() {
        // Login form - the form exists in the HTML from the start
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submitted via event listener');
                this.handleLogin();
            });
            console.log('Login form event listener attached');
        } else {
            console.log('Login form not found during setup');
        }
    }

    setupRazorpay() {
        // Load Razorpay script if not already loaded
        if (!window.Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            document.head.appendChild(script);
        }
    }

    showPage(pageId) {
        this.currentPage = pageId;
        const content = document.getElementById('content');
        
        if (!auth.isAuthenticated() && pageId !== 'login') {
            this.showLoginModal();
            return;
        }

        switch (pageId) {
            case 'login':
                content.innerHTML = this.getLoginPage();
                break;
            case 'dashboard':
                content.innerHTML = this.getDashboardPage();
                this.loadDashboard();
                break;
            case 'menu':
                content.innerHTML = this.getMenuPage();
                this.loadMenu();
                break;
            case 'orders':
                content.innerHTML = this.getOrdersPage();
                this.loadOrders();
                break;
            case 'profile':
                content.innerHTML = this.getProfilePage();
                this.loadProfile();
                break;
            case 'admin':
                content.innerHTML = this.getAdminPage();
                this.loadAdminDashboard();
                break;
            case 'staff':
                content.innerHTML = this.getStaffPage();
                this.loadStaffDashboard();
                break;
            default:
                content.innerHTML = '<div class="text-center"><h2>Page not found</h2></div>';
        }

        // Update URL hash
        window.location.hash = pageId;
    }

    showLoginModal() {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }

    async handleLogin() {
        console.log('Login attempt initiated');
        
        const collegeId = document.getElementById('collegeId').value;
        const password = document.getElementById('password').value;
        
        console.log('College ID:', collegeId);
        
        if (!collegeId || !password) {
            this.showError('Please enter both college ID and password');
            return;
        }

        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Logging in...';
        submitBtn.disabled = true;

        try {
            console.log('Attempting login...');
            
            // Direct API call - same as working simple login
            const response = await axios.post('/api/auth/login', {
                college_id: collegeId,
                password: password
            });
            
            console.log('Login response:', response.data);
            
            if (response.data.user && response.data.token) {
                // Store token and user data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                // Update auth object
                auth.token = response.data.token;
                auth.user = response.data.user;
                
                this.showSuccess('Login successful!');
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal.hide();
                
                // Clear form
                document.getElementById('loginForm').reset();
                
                // Update UI and redirect to dashboard
                auth.updateUI();
                this.showPage('dashboard');
            } else {
                this.showError('Invalid login response');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    getLoginPage() {
        return `
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body text-center py-5">
                            <i class="fas fa-utensils fa-4x text-primary mb-4"></i>
                            <h2 class="mb-4">College Canteen Management System</h2>
                            <p class="mb-4">Order your favorite meals online and get QR codes for quick pickup!</p>
                            <button class="btn btn-primary btn-lg" onclick="ui.showLoginModal()">
                                <i class="fas fa-sign-in-alt me-2"></i> Login Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDashboardPage() {
        const user = auth.getUser();
        return `
            <div class="fade-in">
                <h1 class="mb-4">Welcome, ${user.name}!</h1>
                <div class="row">
                    <div class="col-md-3 mb-4">
                        <div class="dashboard-card">
                            <div class="card-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="card-number" id="totalOrders">-</div>
                            <div class="card-text">Total Orders</div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-4">
                        <div class="dashboard-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <div class="card-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="card-number" id="pendingOrders">-</div>
                            <div class="card-text">Pending Orders</div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-4">
                        <div class="dashboard-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                            <div class="card-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="card-number" id="completedOrders">-</div>
                            <div class="card-text">Completed Orders</div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-4">
                        <div class="dashboard-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                            <div class="card-icon">
                                <i class="fas fa-rupee-sign"></i>
                            </div>
                            <div class="card-number" id="totalSpent">₹-</div>
                            <div class="card-text">Total Spent</div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Recent Orders</h5>
                            </div>
                            <div class="card-body">
                                <div id="recentOrders">
                                    <div class="text-center py-3">
                                        <div class="loading-spinner"></div>
                                        <p class="mt-2">Loading recent orders...</p>
                                    </div>
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
                                    <button class="btn btn-primary" onclick="ui.showPage('menu')">
                                        <i class="fas fa-utensils me-2"></i> View Menu
                                    </button>
                                    <button class="btn btn-success" onclick="ui.showPage('orders')">
                                        <i class="fas fa-list me-2"></i> My Orders
                                    </button>
                                    <button class="btn btn-info" onclick="ui.showPage('profile')">
                                        <i class="fas fa-user me-2"></i> My Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getMenuPage() {
        return `
            <div class="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h1>Today's Menu</h1>
                    <div>
                        <button class="btn btn-outline-primary" onclick="ui.loadMenu()">
                            <i class="fas fa-sync-alt me-1"></i> Refresh
                        </button>
                        <button class="btn btn-success position-relative" onclick="ui.showCart()">
                            <i class="fas fa-shopping-cart me-1"></i> Cart
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cartCount">
                                ${this.cart.length}
                            </span>
                        </button>
                    </div>
                </div>
                
                <div id="menuContent">
                    <div class="text-center py-5">
                        <div class="loading-spinner"></div>
                        <p class="mt-2">Loading menu...</p>
                    </div>
                </div>
            </div>
        `;
    }

    getOrdersPage() {
        return `
            <div class="fade-in">
                <h1 class="mb-4">My Orders</h1>
                <div id="ordersContent">
                    <div class="text-center py-5">
                        <div class="loading-spinner"></div>
                        <p class="mt-2">Loading orders...</p>
                    </div>
                </div>
            </div>
        `;
    }

    getProfilePage() {
        const user = auth.getUser();
        return `
            <div class="fade-in">
                <h1 class="mb-4">My Profile</h1>
                <div class="row">
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="fas fa-user fa-4x text-primary mb-3"></i>
                                <h4>${user.name}</h4>
                                <span class="badge role-${user.role}">${user.role.toUpperCase()}</span>
                                <p class="mt-2">${user.college_id}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Profile Information</h5>
                            </div>
                            <div class="card-body">
                                <form id="profileForm">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Name</label>
                                            <input type="text" class="form-control" id="profileName" value="${user.name}">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Email</label>
                                            <input type="email" class="form-control" id="profileEmail" value="${user.email}">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">College ID</label>
                                            <input type="text" class="form-control" value="${user.college_id}" disabled>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Phone</label>
                                            <input type="tel" class="form-control" id="profilePhone" value="${user.phone || ''}">
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Department</label>
                                        <input type="text" class="form-control" id="profileDepartment" value="${user.department || ''}">
                                    </div>
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save me-1"></i> Update Profile
                                    </button>
                                </form>
                            </div>
                        </div>
                        
                        <div class="card mt-4">
                            <div class="card-header">
                                <h5 class="mb-0">Change Password</h5>
                            </div>
                            <div class="card-body">
                                <form id="passwordForm">
                                    <div class="mb-3">
                                        <label class="form-label">Current Password</label>
                                        <input type="password" class="form-control" id="currentPassword" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">New Password</label>
                                        <input type="password" class="form-control" id="newPassword" required minlength="6">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Confirm New Password</label>
                                        <input type="password" class="form-control" id="confirmPassword" required minlength="6">
                                    </div>
                                    <button type="submit" class="btn btn-warning">
                                        <i class="fas fa-key me-1"></i> Change Password
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAdminPage() {
        return `
            <div class="fade-in">
                <h1 class="mb-4">Admin Dashboard</h1>
                <div id="adminContent">
                    <div class="text-center py-5">
                        <div class="loading-spinner"></div>
                        <p class="mt-2">Loading admin dashboard...</p>
                    </div>
                </div>
            </div>
        `;
    }

    getStaffPage() {
        return `
            <div class="fade-in">
                <h1 class="mb-4">Staff Dashboard</h1>
                <div id="staffContent">
                    <div class="text-center py-5">
                        <div class="loading-spinner"></div>
                        <p class="mt-2">Loading staff dashboard...</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Cart functionality
    addToCart(item) {
        const existingItem = this.cart.find(cartItem => cartItem.dish_name === item.dish_name);
        
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            this.cart.push({
                ...item,
                cartId: Date.now()
            });
        }
        
        this.saveCart();
        this.updateCartCount();
        this.showSuccess(`${item.dish_name} added to cart!`);
    }

    removeFromCart(cartId) {
        this.cart = this.cart.filter(item => item.cartId !== cartId);
        this.saveCart();
        this.updateCartCount();
        this.showCart();
    }

    updateCartQuantity(cartId, quantity) {
        const item = this.cart.find(item => item.cartId === cartId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
            this.showCart();
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.cart.length;
        }
    }

    showCart() {
        const modalHtml = `
            <div class="modal fade" id="cartModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Your Cart</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.getCartHTML()}
                        </div>
                        <div class="modal-footer">
                            <h5 class="me-auto">Total: ₹${this.getCartTotal()}</h5>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="ui.proceedToCheckout()">Checkout</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('cartModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body and show
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('cartModal'));
        modal.show();
    }

    getCartHTML() {
        if (this.cart.length === 0) {
            return '<p class="text-center">Your cart is empty</p>';
        }

        return `
            <div class="cart-items">
                ${this.cart.map(item => `
                    <div class="cart-item">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h6>${item.dish_name}</h6>
                                <p class="mb-0 text-muted">₹${item.price} each</p>
                            </div>
                            <div class="col-md-3">
                                <div class="quantity-controls">
                                    <button class="btn btn-sm btn-outline-secondary" onclick="ui.updateCartQuantity(${item.cartId}, ${item.quantity - 1})">-</button>
                                    <span class="mx-2">${item.quantity}</span>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="ui.updateCartQuantity(${item.cartId}, ${item.quantity + 1})">+</button>
                                </div>
                            </div>
                            <div class="col-md-2 text-end">
                                <strong>₹${item.price * item.quantity}</strong>
                            </div>
                            <div class="col-md-1 text-end">
                                <button class="btn btn-sm btn-danger" onclick="ui.removeFromCart(${item.cartId})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    async proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showError('Your cart is empty');
            return;
        }

        try {
            // Create order
            const orderData = {
                items: this.cart.map(item => ({
                    dish_name: item.dish_name,
                    quantity: item.quantity
                }))
            };

            const response = await api.createOrder(orderData);
            const order = response.data.order;

            // Create payment order
            const paymentResponse = await api.createPaymentOrder(order.order_id);
            const razorpayOrder = paymentResponse.data.razorpay_order;

            // Initialize Razorpay payment
            const options = {
                key: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890', // Use actual key in production
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'College Canteen',
                description: `Order ${order.order_id}`,
                order_id: razorpayOrder.id,
                handler: async (response) => {
                    try {
                        // Verify payment
                        const verifyResponse = await api.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            payment_id: paymentResponse.data.payment_id
                        });

                        // Clear cart
                        this.cart = [];
                        this.saveCart();
                        this.updateCartCount();

                        // Close cart modal
                        const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
                        modal.hide();

                        // Show QR code
                        this.showQRCode(verifyResponse.data.qr_code, verifyResponse.data.qr_data);
                        
                        this.showSuccess('Payment successful! Order confirmed.');
                    } catch (error) {
                        this.showError('Payment verification failed');
                    }
                },
                prefill: {
                    name: auth.getUser().name,
                    email: auth.getUser().email
                },
                theme: {
                    color: '#007bff'
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            this.showError('Failed to create order. Please try again.');
        }
    }

    showQRCode(qrCodeDataUrl, qrData) {
        const modalHtml = `
            <div class="modal fade" id="qrCodeModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Order QR Code</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div class="qr-code-container">
                                <img src="${qrCodeDataUrl}" alt="QR Code" class="mb-3">
                                <h6>Order ID: ${qrData.order_id}</h6>
                                <p class="mb-1"><strong>Name:</strong> ${qrData.payer_name}</p>
                                <p class="mb-1"><strong>College ID:</strong> ${qrData.college_id}</p>
                                <p class="mb-1"><strong>Amount:</strong> ₹${qrData.amount}</p>
                                <p class="mb-0"><strong>Status:</strong> <span class="badge bg-success">${qrData.payment_status}</span></p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="ui.downloadQRCode('${qrCodeDataUrl}', '${qrData.order_id}')">
                                <i class="fas fa-download me-1"></i> Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('qrCodeModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body and show
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
        modal.show();
    }

    downloadQRCode(dataUrl, orderId) {
        const link = document.createElement('a');
        link.download = `QR_${orderId}.png`;
        link.href = dataUrl;
        link.click();
    }

    // Utility methods
    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 9999;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert:last-of-type');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    // Data loading methods (to be implemented)
    async loadDashboard() {
        // Implementation will be added in the next part
    }

    async loadMenu() {
        // Implementation will be added in the next part
    }

    async loadOrders() {
        // Implementation will be added in the next part
    }

    async loadProfile() {
        // Implementation will be added in the next part
    }

    async loadAdminDashboard() {
        // Implementation will be added in the next part
    }

    async loadStaffDashboard() {
        // Implementation will be added in the next part
    }
}

// Create global UI instance
const ui = new UI();
