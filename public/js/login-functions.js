// Common Login Functions
class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔐 Login Manager initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add enter key support for all forms
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.form) {
                    const submitBtn = activeElement.form.querySelector('button[type="button"]');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            }
        });

        // Auto-focus on first input field
        window.addEventListener('load', () => {
            const firstInput = document.querySelector('input[type="text"], input[type="password"]');
            if (firstInput) {
                firstInput.focus();
            }
        });
    }

    async performLogin(userType, credentials) {
        const { collegeId, password } = credentials;
        
        if (!collegeId || !password) {
            this.showError(`Please enter both ${userType} ID and Password`);
            return false;
        }

        console.log(`🔐 ${userType} login attempt:`, collegeId);
        
        // Show loading
        const btn = document.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="loading-spinner"></span> Logging in...';
        btn.disabled = true;

        try {
            // Direct API call
            const response = await axios.post('/api/auth/login', {
                college_id: collegeId,
                password: password
            });

            console.log(`✅ ${userType} login success:`, response.data);

            // Store user data
            const user = response.data.user;
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('userRole', user.role);

            // Show success
            btn.innerHTML = '<i class="fas fa-check me-2"></i>Success! Redirecting...';

            // Determine dashboard based on actual user role
            let dashboardPath = `${user.role}-dashboard.html`;
            
            // Map teacher role to professor dashboard
            if (user.role === 'teacher') {
                dashboardPath = 'professor-dashboard.html';
            }
            
            // Redirect to appropriate dashboard
            setTimeout(() => {
                window.location.href = dashboardPath;
            }, 1500);

            return true;

        } catch (error) {
            console.error(`❌ ${userType} login failed:`, error);
            btn.innerHTML = originalText;
            btn.disabled = false;
            this.showError('Login failed: ' + (error.response?.data?.message || 'Invalid credentials'));
            return false;
        }
    }

    showError(message) {
        alert(message);
    }

    showSuccess(message) {
        alert(message);
    }

    logout() {
        console.log('🚪 Logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        window.location.href = 'index.html';
    }
}

// Role-specific login functions
async function adminLogin() {
    const adminId = document.getElementById('adminId').value;
    const password = document.getElementById('adminPassword').value;
    
    await loginManager.performLogin('admin', { collegeId: adminId, password });
}

async function studentLogin() {
    const studentId = document.getElementById('studentId').value;
    const password = document.getElementById('studentPassword').value;
    
    await loginManager.performLogin('student', { collegeId: studentId, password });
}

async function staffLogin() {
    const staffId = document.getElementById('staffId').value;
    const password = document.getElementById('staffPassword').value;
    
    await loginManager.performLogin('staff', { collegeId: staffId, password });
}

async function professorLogin() {
    const professorId = document.getElementById('professorId')?.value || document.getElementById('collegeId')?.value;
    const password = document.getElementById('professorPassword')?.value || document.getElementById('password')?.value;
    
    await loginManager.performLogin('professor', { collegeId: professorId, password });
}

// Initialize login manager
const loginManager = new LoginManager();
