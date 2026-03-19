// ==========================================
// 1. POPUP & NOTIFICATION SYSTEM (No Alerts)
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return; // Failsafe if HTML is missing

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-times-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Auto-remove after animation
    setTimeout(() => {
        toast.remove();
    }, 3300);
}

let confirmActionCallback = null;

function showConfirm(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'block';
    confirmActionCallback = callback;
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmActionCallback = null;
}

// Attach listener to the Yes button only once
document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmYesBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (confirmActionCallback) confirmActionCallback();
            closeConfirmModal();
        });
    }
});


// ==========================================
// 2. INITIALIZATION & NAVIGATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Security Kick-out
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('adminName').textContent = user.name;
    document.getElementById('currentDate').textContent = new Date().toDateString();
    
    showSection('overview');
});

function showSection(sectionId) {
    const sections = {
        'overview': 'overviewSection',
        'manage-users': 'manageUsersSection',
        'manage-menu': 'manageMenuSection'
    };

    // Hide all
    Object.values(sections).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Show active
    const activeEl = document.getElementById(sections[sectionId]);
    if (activeEl) activeEl.style.display = 'block';

    // Update Sidebar highlighting
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`'${sectionId}'`)) {
            link.classList.add('active');
        }
    });

    // Load Data
    if (sectionId === 'manage-users') loadUsers();
    if (sectionId === 'manage-menu') loadAdminMenu();
}


// ==========================================
// 3. USER MANAGEMENT
// ==========================================
async function loadUsers() {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Fetching users...</td></tr>';
    
    try {
        // Because api.js returns res.data, users is the final array
        const users = await api.getUsers(); 

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No users found.</td></tr>';
            return;
        }

        const countEl = document.getElementById('activeUsersCount');
        if (countEl) countEl.innerText = users.length;

        tbody.innerHTML = users.map(u => `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.college_id}</td>
                <td><span class="role-badge role-${u.role}">${u.role}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="triggerDeleteUser('${u._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Load Users Error:", err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Failed to load users from database.</td></tr>';
    }
}

async function handleUserSubmit(event) {
    event.preventDefault();
    
    // Safely grabbing optional fields if they exist, otherwise applying defaults for Mongoose
    const phoneInput = document.getElementById('userPhone');
    const deptInput = document.getElementById('userDept');

    const userData = {
        name: document.getElementById('userName').value,
        college_id: document.getElementById('userCollegeId').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPass').value,
        role: document.getElementById('userRole').value,
        phone: phoneInput ? phoneInput.value : "0000000000",
        department: deptInput ? deptInput.value : "N/A",
        status: "active"
    };

    try {
        await api.addUser(userData);
        showToast("User added successfully!", "success");
        closeModals();
        loadUsers(); 
    } catch (err) {
        console.error("Add User Error:", err);
        showToast(err.response?.data?.message || "Error adding user to database", "error");
    }
}

function triggerDeleteUser(id) {
    showConfirm("Are you sure you want to permanently delete this user?", async () => {
        try {
            await api.deleteUser(id);
            showToast("User deleted successfully.", "success");
            loadUsers();
        } catch (err) { 
            showToast("Failed to delete user.", "error"); 
        }
    });
}


// ==========================================
// 4. MENU MANAGEMENT
// ==========================================
async function loadAdminMenu() {
    const grid = document.getElementById('adminMenuGrid');
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Loading menu...</p>';
    
    try {
        const response = await api.getMenu();
        // Handle both possible backend structures (array vs categorized object)
        const menu = response.menu || response; 
        let html = '';

        for (const [category, items] of Object.entries(menu)) {
            // Ensure items is an array before trying to loop
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const imgSrc = item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80';
                    html += `
                    <div class="card" style="padding: 15px;">
                        <img src="${imgSrc}" style="width:100%; height:120px; object-fit:cover; border-radius:10px; margin-bottom:10px;">
                        <h4 style="margin: 5px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.dish_name}</h4>
                        <p style="font-size:0.85rem; color:var(--text-gray);">₹${item.price} | <span style="text-transform:capitalize;">${category}</span></p>
                        <div style="margin-top:12px; display:flex; gap:10px;">
                            <button class="btn btn-sm btn-danger" style="flex:1;" onclick="triggerDeleteItem('${item._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>`;
                });
            }
        }
        grid.innerHTML = html || '<p style="grid-column: 1/-1; text-align:center;">Menu is empty.</p>';
    } catch (err) {
        console.error("Load Menu Error:", err);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:red;">Error loading menu.</p>';
    }
}

async function handleMenuSubmit(event) {
    event.preventDefault();
    const dishData = {
        dish_name: document.getElementById('dishName').value,
        price: document.getElementById('dishPrice').value,
        category: document.getElementById('dishCategory').value,
        image_url: document.getElementById('dishImg').value,
        available_quantity: 50 // Default stock
    };

    try {
        await api.addMenuItem(dishData);
        showToast("Dish added successfully!", "success");
        closeModals();
        loadAdminMenu();
    } catch (err) {
        showToast(err.response?.data?.message || "Error adding dish.", "error");
    }
}

function triggerDeleteItem(id) {
    showConfirm("Remove this dish from the canteen menu?", async () => {
        try {
            await api.deleteMenuItem(id);
            showToast("Dish removed from menu.", "success");
            loadAdminMenu();
        } catch (err) { 
            showToast("Failed to delete dish.", "error"); 
        }
    });
}


// ==========================================
// 5. UTILITY FUNCTIONS
// ==========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

function closeModals() {
    const userModal = document.getElementById('userModal');
    const menuModal = document.getElementById('menuModal');
    if (userModal) userModal.style.display = 'none';
    if (menuModal) menuModal.style.display = 'none';
    
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) addUserForm.reset();
    
    const addMenuForm = document.getElementById('addMenuForm');
    if (addMenuForm) addMenuForm.reset();
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Close modals if clicking outside the white box
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModals();
        closeConfirmModal();
    }
};