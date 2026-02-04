document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('adminName').textContent = user.name;
    loadView('stats');
});

function loadView(viewName) {
    const views = ['statsView', 'menuView'];
    views.forEach(v => {
        const element = document.getElementById(v);
        if (element) element.style.display = 'none';
    });
    const activeView = document.getElementById(`${viewName}View`);
    if (activeView) {
        activeView.style.display = viewName === 'stats' ? 'grid' : 'block';
    }
    const titleMap = {
        'stats': 'Overview',
        'menu': 'Manage Menu',
        'users': 'Manage Users'
    };
    document.getElementById('viewTitle').textContent = titleMap[viewName] || 'Dashboard';
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const clickedButton = document.querySelector(`button[onclick="loadView('${viewName}')"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    if (viewName === 'menu') loadMenuEditor();
}

function openAddModal() { document.getElementById('addModal').style.display = 'block'; }
function closeModal() { document.getElementById('addModal').style.display = 'none'; }
document.getElementById('addMenuForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        dish_name: document.getElementById('dishName').value,
        price: Number(document.getElementById('dishPrice').value),
        available_quantity: Number(document.getElementById('dishQty').value),
        category: document.getElementById('dishCategory').value
    };
    try {
        await api.addMenuItem(data);
        alert("Dish added successfully!");
        closeModal();
        loadMenuEditor();
    } catch (err) {
        alert("Failed to add item. Check console.");
        console.error(err);
    }
});
async function loadMenuEditor() {
    const list = document.getElementById('menuList');
    list.innerHTML = 'Loading...';
    try {
        const res = await api.getMenu();
        const grouped = res.menu;
        let html = '';
        for (const [category, items] of Object.entries(grouped)) {
            html += `<h4 style="margin: 15px 0 10px; text-transform: capitalize; color: var(--primary);">${category}</h4>`;
            items.forEach(item => {
                html += `
                <div class="card" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; padding: 12px;">
                    <div>
                        <strong>${item.dish_name}</strong> - ₹${item.price}
                        <br><small>Qty: ${item.available_quantity}</small>
                    </div>
                    <button class="btn btn-sm" style="background: var(--danger);" onclick="deleteItem('${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>`;
            });
        }
        list.innerHTML = html || '<p>No items found.</p>';
    } catch (err) {
        list.innerHTML = '<p>Error loading menu.</p>';
    }
}
async function deleteItem(id) {
    if (!confirm("Delete this dish?")) return;
    try {
        await api.deleteMenuItem(id);
        loadMenuEditor();
    } catch (err) {
        alert("Delete failed.");
    }
}
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}