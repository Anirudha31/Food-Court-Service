let html5QrcodeScanner;

function onScanSuccess(decodedText, decodedResult) {

    html5QrcodeScanner.clear();

    verifyOrder(decodedText);
}

async function verifyOrder(qrData) {
    try {
        const res = await api.post('/staff/verify-qr', { qr_data: qrData });
        
        const order = res.data.order;
        
        document.getElementById('orderDetails').style.display = 'block';
        document.getElementById('orderContent').innerHTML = `
            <p><strong>User:</strong> ${order.user_id.name}</p>
            <p><strong>Items:</strong> ${order.items.length} items</p>
            <p><strong>Total:</strong> ₹${order.total_amount}</p>
            <p style="color: green">Status: Valid</p>
        `;
        

        window.currentOrderId = order._id;

    } catch (err) {
        alert(err.response?.data?.message || "Invalid or Used QR Code!");

        startScanner();
    }
}

async function confirmOrder() {
    try {
        await api.patch(`/staff/${window.currentOrderId}/serve`);
        alert("Order Served & QR Dissolved!");
        document.getElementById('orderDetails').style.display = 'none';
        startScanner();
    } catch (err) {
        alert("Error confirming order");
    }
}

function startScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess);
}

function logout() {
    localStorage.clear();
    window.location.href = '../html/login.html';
}

startScanner();