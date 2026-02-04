let cart = [];
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('studentName').textContent = user.name;
    showSection('menu');
});
function showSection(sectionId) {
    const sections = ['menuSection', 'ordersSection', 'walletSection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const activeSection = document.getElementById(`${sectionId}Section`);
    if (activeSection) {
        activeSection.style.display = (sectionId === 'menu') ? 'grid' : 'block';
    }
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick').includes(`'${sectionId}'`)) {
            link.classList.add('active');
        }
    });
    if (sectionId === 'menu') loadMenu();
    if (sectionId === 'orders') loadHistory();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar.classList.contains('active')) {
        toggleSidebar();
    }
}
async function loadMenu() {
    const grid = document.getElementById('menuSection');
    grid.innerHTML = '<p>Loading yummy food...</p>';
    try {
        const res = await api.getMenu();
        const menu = res.menu; 
        let html = '';
        for (const [category, items] of Object.entries(menu)) {
            items.forEach(item => {
                html += `
                <div class="card">
                    <span style="font-size:0.75rem; color:var(--primary); font-weight:700; text-transform:uppercase;">${category}</span>
                    <h3 style="margin: 5px 0;">${item.dish_name}</h3>
                    <p style="font-size:0.9rem; color:var(--text-gray);">${item.description || 'Tasty & Fresh'}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem;">
                        <span style="font-weight:800; font-size:1.3rem; color:var(--text-dark);">₹${item.price}</span>
                        <button class="btn" onclick="addToCart('${item._id}', '${item.dish_name}', ${item.price})">
                            Add +
                        </button>
                    </div>
                </div>`;
            });
        }
        grid.innerHTML = html || '<p>No items available today.</p>';
    } catch (err) {
        grid.innerHTML = '<p>Error loading menu.</p>';
    }
}
function addToCart(id, name, price) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id, dish_name: name, price, qty: 1 });
    }
    updateCartUI();
}
function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').innerText = count;
}
function viewCart() {
    if (cart.length === 0) return alert("Cart is empty!");
    let text = "Your Cart:\n";
    let total = 0;
    cart.forEach(item => {
        text += `${item.dish_name} x ${item.qty} = ₹${item.price * item.qty}\n`;
        total += item.price * item.qty;
    });
    if (confirm(`${text}\nTotal: ₹${total}\n\nPlace Order?`)) {
        placeOrder();
    }
}
async function placeOrder() {
    try {
        const orderData = { 
            items: cart.map(i => ({ 
                dish_name: i.dish_name, 
                quantity: i.qty, 
                price: i.price 
            })) 
        };
        await api.placeOrder(orderData);
        alert("Order Placed Successfully!");
        cart = [];
        updateCartUI();
        showSection('orders');
    } catch (err) {
        alert("Order failed. Please check your connection.");
    }
}
async function loadHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '<p>Loading orders...</p>';
    try {
        const res = await api.getMyOrders();
        const orders = res.orders;
        list.innerHTML = orders.map(order => `
            <div style="border-bottom:1px solid var(--border); padding: 15px 0; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>Order #${order.order_id || 'N/A'}</strong>
                    <p style="font-size:0.85rem; color:var(--text-gray);">₹${order.total_amount} | ${new Date(order.order_date).toLocaleDateString()}</p>
                </div>
                <span style="background:var(--primary-light); color:var(--primary); padding:5px 12px; border-radius:20px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">
                    ${order.order_status}
                </span>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = '<p>No orders found.</p>';
    }
}
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function viewCart() {
    if (cart.length === 0) return alert("Cart is empty!");
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    sessionStorage.setItem('pendingOrder', JSON.stringify({
        items: cart,
        total: total
    }));
    window.location.href = 'payment.html';
}