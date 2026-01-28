// Authentication Module
class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        if (this.token && this.user) {
            this.updateUI();
            this.setupTokenRefresh();
        }
    }

    async login(collegeId, password) {
        try {
            const response = await api.post('/auth/login', {
                college_id: collegeId,
                password: password
            });

            if (response.data.user && response.data.token) {
                this.token = response.data.token;
                this.user = response.data.user;
                
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.updateUI();
                this.setupTokenRefresh();
                
                return { success: true, data: response.data };
            }
            
            return { success: false, message: 'Invalid login response' };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed' 
            };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        this.updateUI();
        ui.showPage('login');
    }

    updateUI() {
        const navMenu = document.getElementById('navMenu');
        
        if (this.token && this.user) {
            // User is logged in
            navMenu.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="ui.showPage('dashboard')">
                        <i class="fas fa-home me-1"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="ui.showPage('menu')">
                        <i class="fas fa-utensils me-1"></i> Menu
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="ui.showPage('orders')">
                        <i class="fas fa-shopping-cart me-1"></i> Orders
                    </a>
                </li>
                ${this.user.role === 'admin' ? `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="ui.showPage('admin')">
                        <i class="fas fa-cog me-1"></i> Admin
                    </a>
                </li>
                ` : ''}
                ${this.user.role === 'staff' || this.user.role === 'admin' ? `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="ui.showPage('staff')">
                        <i class="fas fa-qrcode me-1"></i> Staff
                    </a>
                </li>
                ` : ''}
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user me-1"></i> ${this.user.name}
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="ui.showPage('profile')">
                            <i class="fas fa-user-circle me-1"></i> Profile
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="auth.logout()">
                            <i class="fas fa-sign-out-alt me-1"></i> Logout
                        </a></li>
                    </ul>
                </li>
            `;
            
            // Show dashboard by default after login
            if (window.location.hash === '#login' || !window.location.hash) {
                ui.showPage('dashboard');
            }
        } else {
            // User is not logged in
            navMenu.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="ui.showPage('login')">
                        <i class="fas fa-sign-in-alt me-1"></i> Login
                    </a>
                </li>
            `;
            
            ui.showPage('login');
        }
    }

    setupTokenRefresh() {
        // Set up token refresh before expiry (24 hours - 1 hour = 23 hours)
        if (this.token) {
            setTimeout(() => {
                this.refreshToken();
            }, 23 * 60 * 60 * 1000); // 23 hours
        }
    }

    async refreshToken() {
        try {
            const response = await api.post('/auth/refresh', {}, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.data.token) {
                this.token = response.data.token;
                localStorage.setItem('token', this.token);
                this.setupTokenRefresh();
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    hasRole(role) {
        return this.user && this.user.role === role;
    }

    hasAnyRole(roles) {
        return this.user && roles.includes(this.user.role);
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }
}

// Create global auth instance
const auth = new Auth();
