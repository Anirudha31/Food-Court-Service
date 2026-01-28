// Menu Page JavaScript
const API_BASE = '/api';
let menuItems = [];
let cart = [];
let currentCategory = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    const isAuthenticated = await checkAuthentication();
    if (isAuthenticated) {
        setupCategoryFilters();
        loadMenu();
        loadCart();
    }
});

// Check authentication
async function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        alert('Please login to view menu.');
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
            localStorage.removeItem('cart');
            window.location.href = 'login.html';
            return false;
        }
        console.warn('Could not verify token, but continuing:', error);
    }
    
    // Update user info
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        const roleIcon = {
            'admin': 'fa-user-shield',
            'student': 'fa-graduation-cap',
            'professor': 'fa-chalkboard-teacher',
            'teacher': 'fa-chalkboard-teacher',
            'staff': 'fa-user-tie'
        }[user.role] || 'fa-user';
        
        userInfo.innerHTML = `
            <i class="fas ${roleIcon}"></i>
            <span>${user.name || user.college_id}</span>
        `;
    }
}

// Setup category filters
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.getAttribute('data-category');
            displayMenu();
        });
    });
}

// Load menu
async function loadMenu() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/menu/today`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        menuItems = response.data.menu || response.data || [];
        displayMenu();
    } catch (error) {
        console.error('Error loading menu:', error);
        document.getElementById('menuGrid').innerHTML = 
            '<div class="loading">Error loading menu. Please try again.</div>';
    }
}

// Display menu
function displayMenu() {
    const grid = document.getElementById('menuGrid');
    
    let filteredItems = menuItems;
    if (currentCategory !== 'all') {
        filteredItems = menuItems.filter(item => item.category === currentCategory);
    }
    
    if (filteredItems.length === 0) {
        grid.innerHTML = '<div class="loading">No items available in this category</div>';
        return;
    }
    
    grid.innerHTML = filteredItems.map(item => {
        const cartItem = cart.find(c => c._id === item._id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const isAvailable = item.is_available && item.available_quantity > 0;
        
        return `
            <div class="menu-item">
                <div class="menu-item-image">
                    <i class="fas fa-utensils"></i>
                </div>
                <div class="menu-item-content">
                    <span class="availability-badge ${isAvailable ? 'available' : 'unavailable'}">
                        ${isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <div class="menu-item-name">${item.dish_name}</div>
                    <div class="menu-item-description">${item.description || 'Delicious dish'}</div>
                    <div class="menu-item-footer">
                        <div class="menu-item-price">₹${item.price}</div>
                        <div class="menu-item-actions">
                            ${quantity > 0 ? `
                                <div class="quantity-control">
                                    <button class="quantity-btn" onclick="updateQuantity('${item._id}', -1)">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span class="quantity-value">${quantity}</span>
                                    <button class="quantity-btn" onclick="updateQuantity('${item._id}', 1)" ${!isAvailable ? 'disabled' : ''}>
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            ` : `
                                <button class="add-btn" onclick="addToCart('${item._id}')" ${!isAvailable ? 'disabled' : ''}>
                                    Add to Cart
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Add to cart
function addToCart(itemId) {
    const item = menuItems.find(m => m._id === itemId);
    if (!item) return;
    
    const existingItem = cart.find(c => c._id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            _id: item._id,
            dish_name: item.dish_name,
            price: item.price,
            quantity: 1
        });
    }
    
    saveCart();
    loadCart();
    displayMenu();
}

// Update quantity
function updateQuantity(itemId, change) {
    const item = cart.find(c => c._id === itemId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        cart = cart.filter(c => c._id !== itemId);
    }
    
    saveCart();
    loadCart();
    displayMenu();
}

// Load cart
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    
    updateCartUI();
}

// Save cart
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toLocaleString();
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.dish_name}</div>
                    <div class="cart-item-price">₹${item.price} x ${item.quantity}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity('${item._id}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item._id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="cart-item-remove" onclick="removeFromCart('${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Remove from cart
function removeFromCart(itemId) {
    cart = cart.filter(c => c._id !== itemId);
    saveCart();
    loadCart();
    displayMenu();
}

// View cart
function viewCart() {
    document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('cartOverlay').classList.add('show');
}

// Close cart
function closeCart() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('show');
}

// Checkout
async function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const orderData = {
            items: cart.map(item => ({
                dish_name: item.dish_name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity
            }))
        };
        
        const response = await axios.post(`${API_BASE}/orders`, orderData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data && response.data.order) {
            alert('Order placed successfully! Redirecting to payment...');
            // Clear cart
            cart = [];
            saveCart();
            loadCart();
            closeCart();
            
            // Redirect to payment or dashboard
            const user = JSON.parse(localStorage.getItem('user'));
            const dashboard = {
                'admin': 'admin-dashboard.html',
                'student': 'student-dashboard.html',
                'professor': 'professor-dashboard.html',
                'teacher': 'professor-dashboard.html',
                'staff': 'staff-dashboard.html'
            }[user.role] || 'login.html';
            
            window.location.href = dashboard;
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Error placing order. Please try again.');
    }
}

// Go to dashboard
function goToDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const dashboard = {
        'admin': 'admin-dashboard.html',
        'student': 'student-dashboard.html',
        'professor': 'professor-dashboard.html',
        'teacher': 'professor-dashboard.html',
        'staff': 'staff-dashboard.html'
    }[user.role] || 'login.html';
    
    window.location.href = dashboard;
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('cart');
        window.location.href = 'login.html';
    }
}
