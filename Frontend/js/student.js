let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('studentName').textContent = user.name;
    
    // Default view
    showSection('menu');
});

function showSection(sectionId) {
    document.getElementById('menuSection').style.display = 'none';
    document.getElementById('ordersSection').style.display = 'none';
    
    document.getElementById(`${sectionId}Section`).style.display = 'grid'; // or block

    if (sectionId === 'menu') loadMenu();
    if (sectionId === 'orders') loadHistory();
}

async function loadMenu() {
    const grid = document.getElementById('menuSection');
    grid.innerHTML = '<p>Loading yummy food...</p>';
    
    try {
        const res = await api.getMenu();
        const menu = res.menu; 
        
        let html = '';
        // Handle grouped menu (Breakfast, Lunch, etc.)
        for (const [category, items] of Object.entries(menu)) {
            items.forEach(item => {
                html += `
                <div class="card">
                    <h3>${item.dish_name}</h3>
                    <p>${item.description || 'Tasty & Fresh'}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
                        <span style="font-weight:bold; font-size:1.2rem;">₹${item.price}</span>
                        <button class="btn btn-sm" onclick="addToCart('${item._id}', '${item.dish_name}', ${item.price})">
                            Add +
                        </button>
                    </div>
                </div>`;
            });
        }
        grid.innerHTML = html;
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
        await api.placeOrder({ items: cart.map(i => ({ dish_name: i.dish_name, quantity: i.qty, price: i.price })) });
        alert("Order Placed Successfully!");
        cart = [];
        updateCartUI();
        showSection('orders');
    } catch (err) {
        alert("Order failed.");
    }
}

async function loadHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = 'Loading...';
    try {
        const res = await api.getMyOrders();
        const orders = res.orders;
        
        list.innerHTML = orders.map(order => `
            <div style="border-bottom:1px solid #eee; padding: 10px 0;">
                <strong>Order #${order.order_id}</strong>
                <span style="float:right; color:${order.order_status === 'pending' ? 'orange' : 'green'}">${order.order_status}</span>
                <p>₹${order.total_amount} - ${new Date(order.order_date).toLocaleDateString()}</p>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = 'No orders found.';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}