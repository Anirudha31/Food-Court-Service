document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Auth
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('adminName').textContent = user.name;

    // 2. Load Initial View
    loadView('stats');
});

function loadView(viewName) {
    // Hide all views
    document.getElementById('statsView').style.display = 'none';
    document.getElementById('menuView').style.display = 'none';
    
    // Show selected
    document.getElementById(`${viewName}View`).style.display = viewName === 'stats' ? 'grid' : 'block';

    if (viewName === 'menu') loadMenuEditor();
}

async function loadMenuEditor() {
    const list = document.getElementById('menuList');
    list.innerHTML = '<p>Loading...</p>';

    try {
        const res = await api.getMenu();
        const menuItems = res.menu; // Adjust based on your backend response structure

        // Flatten menu object if it's grouped by category
        let allItems = [];
        if (Array.isArray(menuItems)) {
            allItems = menuItems;
        } else {
            Object.values(menuItems).forEach(arr => allItems.push(...arr));
        }

        list.innerHTML = allItems.map(item => `
            <div class="card" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${item.dish_name}</strong> - ₹${item.price}
                    <br><small>${item.category}</small>
                </div>
                <button class="btn btn-sm" style="background: #ef4444;" onclick="deleteItem('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = '<p>Error loading menu.</p>';
    }
}

async function deleteItem(id) {
    if(!confirm("Delete this item?")) return;
    try {
        await api.deleteMenuItem(id);
        loadMenuEditor(); // Refresh
    } catch (err) {
        alert("Failed to delete");
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '../html/login.html';
}