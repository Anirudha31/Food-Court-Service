let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('studentName').textContent = user.name;

    const savedCart = sessionStorage.getItem('studentCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
    const lastSection = sessionStorage.getItem('activeSection') || 'menu';
    showSection(lastSection);
});

// Smart URL detector!
function getBackendURL() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    return 'https://food-court-service-backend.onrender.com';
}

function showSection(sectionId) {
    const sections = ['menuSection', 'ordersSection', 'walletSection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const activeSection = document.getElementById(`${sectionId}Section`);
    if (activeSection) {
        activeSection.style.display = 'block';
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick').includes(`'${sectionId}'`)) {
            link.classList.add('active');
        }
    });
    sessionStorage.setItem('activeSection', sectionId);

    if (sectionId === 'menu') loadMenu();
    if (sectionId === 'orders') loadHistory();
    if (sectionId === 'wallet') loadWallet();

    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }
}

async function loadMenu() {
    showLoader("Fetching Today's Menu...");
    const grid = document.getElementById('menuGrid');

    try {
        const backendURL = getBackendURL();
        const statusRes = await axios.get(`${backendURL}/api/menu/status`);
        const effectivelyOpen = statusRes.data.isOpen;

        let closedBanner = '';
        if (!effectivelyOpen) {
            closedBanner = `<div style="grid-column: 1/-1; background: #fee2e2; color: #b91c1c; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; margin-bottom: 20px;"><i class="fas fa-store-slash"></i> The Canteen is currently closed.</div>`;
        }

        const res = await api.getMenu();
        const menu = res.menu;
        let html = closedBanner;

        for (const [category, items] of Object.entries(menu)) {
            items.forEach(item => {
                const defaultImage = 'https://imgs.search.brave.com/eJrOBBqXjPdhO8ejCg9Vz4Tkubh4-rLONNGdACLq9vQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbHVz/LnVuc3BsYXNoLmNv/bS9wcmVtaXVtX3Zl/Y3Rvci0xNzEzMzY0/MzkzMDg1LTBmZGRh/MTNlYzdjZD9mbT1q/cGcmcT02MCZ3PTMw/MDAmaXhsaWI9cmIt/NC4xLjA';
                const imgSrc = item.image_url || defaultImage;
                const stockQty = item.available_quantity || 0;

                const stockDisplay = !effectivelyOpen
                    ? `<span style="color: #ef4444; font-size: 0.8rem; font-weight: 700;"><i class="fas fa-lock"></i> Closed</span>`
                    : (stockQty > 0
                        ? `<span style="color: #10b981; font-size: 0.8rem; font-weight: 700;"><i class="fas fa-box"></i> ${stockQty} Available</span>`
                        : `<span style="color: #ef4444; font-size: 0.8rem; font-weight: 700;"><i class="fas fa-times-circle"></i> Sold Out</span>`);

                const buttonHtml = getCartButtonHtml(item._id, item.dish_name, item.price, stockQty, effectivelyOpen);

                html += `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-size:0.75rem; color:var(--primary); font-weight:700; text-transform:uppercase;">
                            ${category}
                        </span>
                        ${stockDisplay} 
                    </div>
                    
                    <div class="food-img-container">
                        <img src="${imgSrc}" alt="${item.dish_name}" class="food-img">
                    </div>

                    <h3 style="margin: 15px 0 5px 0;">${item.dish_name}</h3>
                    <p style="font-size:0.9rem; color:var(--text-gray); min-height: 40px;">
                        ${item.description || ''}
                    </p>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
                        <span style="font-weight:800; font-size:1.3rem; color:var(--text-dark);">₹${item.price}</span>
                        
                        <div id="cart-action-${item._id}">
                            ${buttonHtml}
                        </div>
                    </div>
                </div>`;
            });
        }
        grid.innerHTML = html || '<p>No items available today.</p>';
        filterStudentMenu();

    } catch (err) {
        grid.innerHTML = '<p>Error loading menu.</p>';
        console.error("Menu Load Error:", err);
    } finally {
        hideLoader();
    }
}

// ==========================================
//       ADD / REMOVE ITEMS
// ==========================================
function updateItemQty(id, name, price, maxStock, change, effectivelyOpen) {
    const existing = cart.find(i => i.id === id);
    const currentQty = existing ? existing.qty : 0;
    const newQty = currentQty + change;

    if (newQty > maxStock) {
        showToast(`Sorry, only ${maxStock} ${name} available!`, "error");
        return;
    }

    if (newQty <= 0) {
        cart = cart.filter(i => i.id !== id);
    } else {
        if (existing) {
            existing.qty = newQty;
        } else {
            cart.push({ id, dish_name: name, price, qty: newQty });
            showToast(`${name} added!`, "success");
        }
    }

    sessionStorage.setItem('studentCart', JSON.stringify(cart));

    updateCartUI();

    const actionDiv = document.getElementById(`cart-action-${id}`);
    if (actionDiv) {
        actionDiv.innerHTML = getCartButtonHtml(id, name, price, maxStock, effectivelyOpen);
    }
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').innerText = count;
}

function viewCart() {
    if (cart.length === 0) {
        return showToast("Your cart is empty!", "error");
    }

    showLoader("Preparing Checkout...");

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    sessionStorage.setItem('pendingOrder', JSON.stringify({
        items: cart,
        total: total
    }));

    setTimeout(() => {
        window.location.href = 'payment.html';
    }, 500);
}

async function placeOrder() {
    showLoader("Processing Payment...");

    try {
        const orderData = {
            items: cart.map(i => ({
                dish_name: i.dish_name,
                quantity: i.qty,
                price: i.price
            }))
        };

        const res = await api.placeOrder(orderData);

        showToast("Payment Successful!", "success");

        cart = [];
        sessionStorage.removeItem('studentCart');
        updateCartUI();

        showSection('orders');

        if (res && res.order && res.order.qr_code_data) {
            openQrModal(encodeURIComponent(res.order.qr_code_data));
        }

    } catch (err) {
        showToast("Payment failed. Please check your connection.", "error");
    } finally {
        hideLoader();
    }
}

async function loadHistory() {
    showLoader("Fetching Order History...");
    const list = document.getElementById('historyList');

    try {
        const res = await api.getMyOrders();
        const orders = res.orders;

        if (orders.length === 0) {
            list.innerHTML = '<p>No orders found.</p>';
            return;
        }

        list.innerHTML = orders.map(order => {
            let qrBtnHtml = '';
            if (order.payment_status === 'paid' && order.order_status === 'pending') {
                const encodedData = encodeURIComponent(order.qr_code_data || '');
                qrBtnHtml = `
                    <button class="btn" style="margin-top: 10px; padding: 5px 12px; font-size: 0.8rem;" 
                            onclick="openQrModal('${encodedData}')">
                        <i class="fas fa-qrcode"></i> View QR
                    </button>
                `;
            }

            return `
            <div style="border-bottom:1px solid var(--border); padding: 15px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap;">
                <div>
                    <strong>Order #${order.order_id || 'N/A'}</strong>
                    <p style="font-size:0.85rem; color:var(--text-gray);">₹${order.total_amount} | ${new Date(order.order_date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                    ${qrBtnHtml}
                </div>
                <div style="text-align: right;">
                    <span style="background:var(--primary-light); color:var(--primary); padding:5px 12px; border-radius:20px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">
                        ${order.order_status}
                    </span>
                    <p style="font-size: 0.75rem; margin-top: 5px; color: ${order.payment_status === 'paid' ? 'green' : 'orange'};">
                        Payment: ${order.payment_status}
                    </p>
                </div>
            </div>
            `;
        }).join('');
    } catch (err) {
        console.error("Order History Error:", err);
        list.innerHTML = '<p>Error loading orders.</p>';
    } finally {
        hideLoader();
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

function openQrModal(encodedQrData) {
    if (!encodedQrData || encodedQrData === 'undefined') {
        customAlert("QR Code is still generating or missing.", true);
        return;
    }

    showLoader("Generating QR Code...");

    const rawData = decodeURIComponent(encodedQrData);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(rawData)}`;

    const img = document.getElementById('modalQrImage');

    img.onload = () => {
        hideLoader();
        document.getElementById('qrModal').style.display = 'block';
    };

    img.onerror = () => {
        hideLoader();
        customAlert("Failed to load QR code. Check connection.", true);
    };

    img.src = qrImageUrl;
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) return;

    container.style.cssText = `
        position: fixed; 
        bottom: 30px; 
        left: 50%; 
        transform: translateX(-50%); 
        z-index: 9999; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        gap: 10px;
        pointer-events: none;
    `;

    const toast = document.createElement('div');
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-times-circle';

    toast.innerHTML = `<i class="fas ${icon}" style="font-size: 1.2rem;"></i> <span style="margin-left: 10px; white-space: nowrap;">${message}</span>`;

    toast.style.cssText = `
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: #ffffff; 
        padding: 14px 24px; 
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
        display: flex; 
        align-items: center; 
        font-size: 1rem;
        font-weight: 500;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease-out;
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
//  LIVE SEARCH FILTER 
// ==========================================
function filterStudentMenu() {
    const searchInput = document.getElementById('studentMenuSearch');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('#menuGrid .card'); // Fixed ID

    // Reset category pills to "All" when typing
    const allPills = document.querySelectorAll('.filter-pill');
    allPills.forEach(pill => pill.classList.remove('active'));
    if (allPills[0]) allPills[0].classList.add('active');

    cards.forEach(card => {
        const dishNameTag = card.querySelector('h3');
        if (!dishNameTag) return;

        const dishName = dishNameTag.textContent.toLowerCase();
        card.style.display = dishName.includes(query) ? 'block' : 'none';
    });
}

// ==========================================
//  CATEGORY PILL FILTER
// ==========================================
function filterByCategory(categoryName, clickedButton) {
    const allPills = document.querySelectorAll('.filter-pill');
    allPills.forEach(pill => pill.classList.remove('active'));
    if (clickedButton) clickedButton.classList.add('active');

    const searchInput = document.getElementById('studentMenuSearch');
    if (searchInput) searchInput.value = '';

    const cards = document.querySelectorAll('#menuGrid .card'); // Fixed ID
    cards.forEach(card => {
        const categorySpan = card.querySelector('span[style*="uppercase"]');
        if (!categorySpan) return;

        const cardCategory = categorySpan.textContent.trim().toLowerCase();

        if (categoryName === 'all' || cardCategory === categoryName) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ==========================================
//  LOAD WALLET BALANCE
// ==========================================
async function loadWallet() {
    showLoader("Checking Balance...");
    try {
        const token = sessionStorage.getItem('token');
        const backendURL = getBackendURL();

        const res = await axios.get(`${backendURL}/api/orders/wallet/balance`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        document.getElementById('walletBalanceDisplay').innerText = `₹${res.data.balance}`;
    } catch (err) {
        console.error("Could not load wallet balance:", err);
    } finally {
        hideLoader();
    }
}

// ==========================================
// ONLINE WALLET RECHARGE
// ==========================================
function startWalletRecharge() {
    customPrompt("Add Funds to Wallet", "500", async (amountStr) => {
        if (!amountStr) return;

        const amount = parseInt(amountStr);
        if (isNaN(amount) || amount < 10) {
            return customAlert("Please enter a valid amount (minimum ₹10).", true);
        }

        showLoader("Initializing Razorpay...");

        try {
            const token = sessionStorage.getItem('token');
            const backendURL = getBackendURL();
            const endpointBase = `${backendURL}/api/payment`;

            const { data } = await axios.post(`${endpointBase}/recharge/create`, { amount }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            hideLoader();

            const options = {
                key: data.key_id,
                amount: data.razorpay_order.amount,
                currency: "INR",
                name: "FoodCourt Wallet",
                description: "Adding Funds to Wallet",
                order_id: data.razorpay_order.id,

                handler: async function (response) {
                    showLoader("Verifying Payment...");
                    try {
                        const verifyRes = await axios.post(`${endpointBase}/recharge/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: amount
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        document.getElementById('walletBalanceDisplay').innerText = `₹${verifyRes.data.new_balance}`;
                        customAlert(`₹${amount} has been successfully added to your wallet!`, false);

                    } catch (verifyErr) {
                        customAlert("Payment completed, but verification failed. Please contact admin.", true);
                    } finally {
                        hideLoader();
                    }
                },
                theme: { color: "#10b981" }
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
                hideLoader();
                customAlert("Payment Failed: " + response.error.description, true);
            });
            rzp.open();

        } catch (verifyErr) {
            hideLoader();
            console.error(" VERIFICATION CRASH:", verifyErr);
            const realError = verifyErr.response?.data?.message || verifyErr.message || "Unknown Error";
            customAlert("Verification Failed: " + realError, true);
        }
    });
}

// ==========================================
// CUSTOM MODAL CONTROLLERS
// ==========================================

// 1. Custom Alert (Replaces window.alert)
function customAlert(message, isError = false) {
    const modal = document.getElementById('customAlertModal');
    const icon = document.getElementById('customAlertIcon');
    const title = document.getElementById('customAlertTitle');

    document.getElementById('customAlertMessage').innerText = message;

    if (isError) {
        icon.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>';
        title.innerText = 'Oops!';
    } else {
        icon.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i>';
        title.innerText = 'Success!';
    }

    modal.style.display = 'flex'; // Uses flex to center it perfectly
}

function closeCustomAlert() {
    document.getElementById('customAlertModal').style.display = 'none';
}

// 2. Custom Prompt (Replaces window.prompt)
let promptCallback = null;

function customPrompt(title, defaultVal, callback) {
    const modal = document.getElementById('customPromptModal');
    document.getElementById('customPromptTitle').innerText = title;

    const input = document.getElementById('customPromptInput');
    input.value = defaultVal;

    // Make the input border green when clicked
    input.onfocus = () => input.style.borderColor = '#10b981';
    input.onblur = () => input.style.borderColor = 'var(--border)';

    promptCallback = callback;
    modal.style.display = 'flex';
    input.focus();
}

function closeCustomPrompt() {
    document.getElementById('customPromptModal').style.display = 'none';
    promptCallback = null;
}

function submitCustomPrompt() {
    const val = document.getElementById('customPromptInput').value;

    const callbackToRun = promptCallback;

    closeCustomPrompt();

    if (callbackToRun) {
        callbackToRun(val);
    }
}

// ==========================================
//         LOADER CONTROLS 
// ==========================================
function showLoader(text = "Loading...") {
    const loader = document.getElementById('globalLoader');
    const textEl = document.getElementById('loaderText');
    if (loader && textEl) {
        textEl.innerText = text;
        loader.classList.add('active');
    }
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.classList.remove('active');
}


// ==========================================
//      DYNAMIC CART BUTTON GENERATOR
// ==========================================
function getCartButtonHtml(id, name, price, maxStock, effectivelyOpen) {
    const exactStyle = "height: 38px; width: 90px; border-radius: 10px; box-sizing: border-box;";

    if (!effectivelyOpen) {
        return `<button class="btn" style="${exactStyle} background: var(--border); color: var(--text-gray); cursor: not-allowed;" disabled>Closed</button>`;
    }
    if (maxStock <= 0) {
        return `<button class="btn" style="${exactStyle} background: var(--border); color: var(--text-gray); cursor: not-allowed;" disabled>Sold Out</button>`;
    }

    const safeName = name.replace(/'/g, "\\'");
    const existing = cart.find(i => i.id === id);
    const qty = existing ? existing.qty : 0;

    if (qty === 0) {
        return `<button class="btn" style="${exactStyle} padding: 0; display: flex; justify-content: center; align-items: center; border: 1px solid transparent;" 
                onclick="updateItemQty('${id}', '${safeName}', ${price}, ${maxStock}, 1, true)">Add +</button>`;
    } else {
        return `
            <div style="${exactStyle} display: flex; align-items: center; background: #e8f5e9; border: 1px solid var(--primary); overflow: hidden; box-shadow: 0 4px 10px rgba(76,175,80,0.15);">
                
                <button style="height: 100%; flex: 1; background: transparent; color: var(--primary); border: none; font-weight: bold; cursor: pointer; font-size: 1.2rem; display: flex; justify-content: center; align-items: center;" 
                        onclick="updateItemQty('${id}', '${safeName}', ${price}, ${maxStock}, -1, true)">-</button>
                
                <span style="font-weight: 800; color: var(--text-dark); min-width: 24px; text-align: center; font-size: 0.95rem;">${qty}</span>
                
                <button style="height: 100%; flex: 1; background: var(--primary); color: white; border: none; font-weight: bold; cursor: pointer; font-size: 1.2rem; display: flex; justify-content: center; align-items: center;" 
                        onclick="updateItemQty('${id}', '${safeName}', ${price}, ${maxStock}, 1, true)">+</button>
            </div>
        `;
    }
}
