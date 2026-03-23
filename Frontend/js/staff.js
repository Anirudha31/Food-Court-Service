let html5QrcodeScanner;
let currentScannedOrderId = null;

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const staffNameEl = document.getElementById('staffName');
    if (user && staffNameEl) {
        staffNameEl.textContent = `Staff | ${user.name || 'Member'}`;
    }
    showSection('scan');
});

function getBackendURL() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://food-court-service-backend.onrender.com';
}

function showSection(sectionId) {
    const scanSec = document.getElementById('scanSection');
    const orderSec = document.getElementById('ordersSection');

    if (scanSec) scanSec.style.display = sectionId === 'scan' ? 'block' : 'none';
    if (orderSec) orderSec.style.display = sectionId === 'orders' ? 'block' : 'none';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const onclickAttr = link.getAttribute('onclick') || "";
        if (onclickAttr.includes(`'${sectionId}'`)) link.classList.add('active');
    });

    if (sectionId === 'scan') {
        startScanner();
        loadServedOrders();
    } else {
        // If we leave the scan section, stop the camera to save battery/prevent crashes
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().catch(err => console.error("Scanner clear error", err));
            html5QrcodeScanner = null;
        }
    }
    if (sectionId === 'orders') loadPendingOrders();
}

// ---QUEUE: LOAD PAID BUT NOT SERVED ---
async function loadPendingOrders() {
    const list = document.getElementById('pendingList');
    if (!list) return;

    try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${getBackendURL()}/api/staff/orders/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const orders = res.data.orders || res.data || [];

        if (orders.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:20px; font-size:0.8rem;">No orders waiting.</p>';
            return;
        }

        list.innerHTML = orders.map(order => {
            const itemsSummary = order.items.map(i => `${i.quantity}x ${i.dish_name}`).join(', ');
            const orderTime = new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="queue-item-strip">
                    <div class="queue-left">
                        <span class="queue-id">#${order.order_id}</span>
                        <div class="queue-student">${order.user_id?.name || 'Student'}</div>
                        <div class="queue-items-text">${itemsSummary}</div>
                    </div>
                    <div class="queue-right">
                        <span class="queue-time">${orderTime}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Queue Error:", err);
    }
}

// ---  HISTORY: SERVED TODAY ---
async function loadServedOrders() {
    const list = document.getElementById('recentlyServedList');
    if (!list) return;

    try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${getBackendURL()}/api/staff/orders/served`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const servedOrders = res.data.orders || [];

        const countEl = document.getElementById('servedCount');
        if (countEl) countEl.innerText = servedOrders.length;

        if (servedOrders.length === 0) {
            list.innerHTML = '<p style="text-align: center; padding: 10px; color:var(--text-gray); font-size:0.8rem;">No orders served yet.</p>';
            return;
        }

        list.innerHTML = servedOrders.slice(0, 5).map(order => `
            <div class="served-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);">
                <div style="line-height: 1.2;">
                    <strong style="color:var(--text-dark); font-size: 0.9rem;">#${order.order_id}</strong>
                    <div style="font-size:0.65rem; color:var(--text-gray);">${new Date(order.served_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style="color: #10b981; font-weight: 700; font-size: 0.9rem;">₹${order.total_amount}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Served List Error:", err);
    }
}

// ---  SCANNER LOGIC ---
function startScanner() {
    const readerElement = document.getElementById('reader');
    if (!readerElement || html5QrcodeScanner) return;

    html5QrcodeScanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
    });

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function onScanSuccess(decodedText) {
    try {
        const orderData = JSON.parse(decodedText);
        currentScannedOrderId = orderData.order_id;

        // Populate UI
        document.getElementById('dispOrderId').innerText = orderData.order_id;
        document.getElementById('dispName').innerText = orderData.payer_name;
        document.getElementById('dispItems').innerHTML = orderData.items.map(i => `<li><span class="food-qty">${i.qty}x</span> ${i.dish}</li>`).join('');

        document.getElementById('orderVerifyCard').style.display = 'block';
        document.getElementById('reader').style.display = 'none';

        // Clear scanner after successful scan
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().then(() => {
                html5QrcodeScanner = null;
            }).catch(err => console.error(err));
        }
    } catch (e) {
        showToast("Invalid QR Data", true);
    }
}

function onScanFailure(error) { /* Routine failure - do nothing */ }

async function confirmServe() {
    if (!currentScannedOrderId) return;
    const btn = document.querySelector('.btn-confirm');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        await axios.patch(`${getBackendURL()}/api/staff/${currentScannedOrderId}/serve`, {}, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        });

        showToast("Order Served Successfully!");

        document.getElementById('orderVerifyCard').style.display = 'none';
        document.getElementById('reader').style.display = 'block';

        // Clear data
        document.getElementById('dispOrderId').innerText = "";
        document.getElementById('dispName').innerText = "";
        document.getElementById('dispItems').innerHTML = "";

        currentScannedOrderId = null;

        // Restart everything
        startScanner();
        loadServedOrders();
    } catch (err) {
        showToast(err.response?.data?.message || "Error", true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bell"></i> Confirm Food Served';
    }
}

function showToast(m, isErr = false) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.innerHTML = `<i class="fas ${isErr ? 'fa-times-circle' : 'fa-check-circle'}"></i> ${m}`;
    t.className = `toast show ${isErr ? 'error' : ''}`;
    setTimeout(() => t.classList.remove("show"), 3000);
}

function logout() { sessionStorage.clear(); window.location.href = 'login.html'; }

async function serveFromQueue(orderId) {
    if (!confirm(`Mark Order #${orderId} as served?`)) return;

    try {
        const token = sessionStorage.getItem('token');
        await axios.patch(`${getBackendURL()}/api/staff/${orderId}/serve`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        showToast("Order Served!");
        loadPendingOrders(); // Refresh the queue
        loadServedOrders();  // Refresh history if it's on the same page
    } catch (err) {
        showToast(err.response?.data?.message || "Error", true);
    }
}