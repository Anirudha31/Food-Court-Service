let html5QrcodeScanner;

function onScanSuccess(decodedText, decodedResult) {
    // 1. Stop scanning temporarily
    html5QrcodeScanner.clear();
    
    // 2. Send QR data to backend to verify
    verifyOrder(decodedText);
}

async function verifyOrder(qrData) {
    try {
        // Assume qrData contains Order ID or is a JSON string
        const res = await api.post('/staff/verify-qr', { qr_data: qrData });
        
        const order = res.data.order;
        
        document.getElementById('orderDetails').style.display = 'block';
        document.getElementById('orderContent').innerHTML = `
            <p><strong>User:</strong> ${order.user_id.name}</p>
            <p><strong>Items:</strong> ${order.items.length} items</p>
            <p><strong>Total:</strong> ₹${order.total_amount}</p>
            <p style="color: green">Status: Valid</p>
        `;
        
        // Store current order ID for confirmation
        window.currentOrderId = order._id;

    } catch (err) {
        alert(err.response?.data?.message || "Invalid or Used QR Code!");
        // Restart scanner
        startScanner();
    }
}

async function confirmOrder() {
    try {
        await api.patch(`/staff/${window.currentOrderId}/serve`);
        alert("Order Served & QR Dissolved!");
        document.getElementById('orderDetails').style.display = 'none';
        startScanner(); // Ready for next
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
// Start on load
startScanner();