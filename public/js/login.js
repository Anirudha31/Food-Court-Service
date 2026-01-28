// Login Page JavaScript
let currentRole = 'admin';

const roleConfig = {
    admin: {
        title: 'Administrator Login',
        subtitle: 'College Canteen Management System',
        idLabel: 'College ID',
        icon: 'fa-user-shield',
        gradient: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
        color: '#dc3545',
        dashboard: 'admin-dashboard.html'
    },
    student: {
        title: 'Student Login',
        subtitle: 'College Canteen Ordering System',
        idLabel: 'College ID',
        icon: 'fa-graduation-cap',
        gradient: 'linear-gradient(135deg, #198754 0%, #157347 100%)',
        color: '#198754',
        dashboard: 'student-dashboard.html'
    },
    professor: {
        title: 'Professor Login',
        subtitle: 'College Canteen Management System',
        idLabel: 'College ID',
        icon: 'fa-chalkboard-teacher',
        gradient: 'linear-gradient(135deg, #6f42c1 0%, #9333ea 100%)',
        color: '#6f42c1',
        dashboard: 'professor-dashboard.html'
    },
    staff: {
        title: 'Staff Login',
        subtitle: 'College Canteen Management System',
        idLabel: 'College ID',
        icon: 'fa-user-tie',
        gradient: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
        color: '#ffc107',
        dashboard: 'staff-dashboard.html'
    }
};

// Get dashboard path based on role
function getDashboardPath(role) {
    if (!role) return null;
    
    const normalizedRole = role.toLowerCase().trim();
    
    switch(normalizedRole) {
        case 'admin':
            return 'admin-dashboard.html';
        case 'student':
            return 'student-dashboard.html';
        case 'professor':
        case 'teacher':
            return 'professor-dashboard.html';
        case 'staff':
            return 'staff-dashboard.html';
        default:
            console.warn('Unknown role:', normalizedRole);
            return null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    resetFormState();
    setupRoleButtons();
    setupForm();
    document.getElementById('collegeId').focus();
});

// Reset form state
function resetFormState() {
    const submitBtn = document.getElementById('loginBtn');
    if (!submitBtn) return;
    
    const config = roleConfig[currentRole];
    submitBtn.innerHTML = `<i class="fas ${config.icon}"></i><span>Login</span>`;
    submitBtn.disabled = false;
    
    // Clear form fields
    const collegeIdInput = document.getElementById('collegeId');
    const passwordInput = document.getElementById('password');
    if (collegeIdInput) collegeIdInput.value = '';
    if (passwordInput) passwordInput.value = '';
    hideError();
}

// Setup role selection buttons
function setupRoleButtons() {
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const role = this.getAttribute('data-role');
            selectRole(role, this);
        });
    });
}

// Select role
function selectRole(role, buttonElement) {
    currentRole = role;
    const config = roleConfig[role];
    
    // Update button states
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active', 'admin', 'student', 'professor', 'staff');
    });
    buttonElement.classList.add('active', role);
    
    // Update form header
    const header = document.getElementById('formHeader');
    const icon = document.getElementById('headerIcon');
    const title = document.getElementById('formTitle');
    const subtitle = document.getElementById('formSubtitle');
    
    if (header) header.style.background = config.gradient;
    if (icon) icon.className = `fas ${config.icon}`;
    if (title) title.textContent = config.title;
    if (subtitle) subtitle.textContent = config.subtitle;
    
    // Update form
    const idLabel = document.getElementById('idLabel');
    if (idLabel) idLabel.textContent = config.idLabel;
    
    const collegeIdInput = document.getElementById('collegeId');
    const passwordInput = document.getElementById('password');
    if (collegeIdInput) collegeIdInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    // Update submit button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.className = 'submit-btn ' + role;
        loginBtn.innerHTML = `<i class="fas ${config.icon}"></i><span>Login</span>`;
        loginBtn.disabled = false;
    }
    
    hideError();
}

// Setup form submission
function setupForm() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const collegeId = document.getElementById('collegeId')?.value.trim();
    const password = document.getElementById('password')?.value;
    
    // Validation
    if (!collegeId || !password) {
        showError('Please enter both College ID and Password');
        return;
    }
    
    hideError();
    
    // Show loading state
    const submitBtn = document.getElementById('loginBtn');
    if (!submitBtn) return;
    
    const config = roleConfig[currentRole];
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Logging in...</span>';
    submitBtn.disabled = true;
    
    try {
        // Make API call
        const response = await axios.post('/api/auth/login', {
            college_id: collegeId,
            password: password
        });
        
        if (response.data && response.data.user && response.data.token) {
            const user = response.data.user;
            const token = response.data.token;
            const userRole = user.role ? user.role.toLowerCase().trim() : null;
            const selectedRole = currentRole.toLowerCase().trim();
            
            // Verify role matches (allow teacher as professor)
            if (userRole !== selectedRole && !(userRole === 'teacher' && selectedRole === 'professor')) {
                showError(`This account is registered as ${userRole}, not ${selectedRole}. Please select the correct role.`);
                submitBtn.innerHTML = `<i class="fas ${config.icon}"></i><span>Login</span>`;
                submitBtn.disabled = false;
                return;
            }
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', user.role);
            
            // Get dashboard path based on user's actual role
            const dashboardPath = getDashboardPath(user.role);
            
            if (!dashboardPath) {
                showError('Dashboard not found for your role: ' + user.role + '. Please contact administrator.');
                submitBtn.innerHTML = `<i class="fas ${config.icon}"></i><span>Login</span>`;
                submitBtn.disabled = false;
                return;
            }
            
            // Show success
            submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Success! Redirecting...</span>';
            
            // Redirect to dashboard
            window.location.replace(dashboardPath);
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Restore button
        submitBtn.innerHTML = `<i class="fas ${config.icon}"></i><span>Login</span>`;
        submitBtn.disabled = false;
        
        // Show error
        const errorMsg = error.response?.data?.message || 
                        error.message || 
                        'An error occurred during login. Please try again.';
        showError(errorMsg);
    }
}

// Show error message
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    if (errorAlert && errorMessage) {
        errorMessage.textContent = message;
        errorAlert.style.display = 'flex';
    }
}

// Hide error message
function hideError() {
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) {
        errorAlert.style.display = 'none';
    }
}
