document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const pending = JSON.parse(sessionStorage.getItem('pendingOrder'));
    if (!pending || !pending.items || pending.items.length === 0) {
        window.location.href = 'student.html';
        return;
    }
    renderOrderSummary(pending);
});

function renderOrderSummary(pending) {
    const summaryContainer = document.getElementById('orderItems');
    const totalDisplay = document.getElementById('payTotal');
    if (totalDisplay) {
        totalDisplay.textContent = `₹${pending.total}`;
    }
    if (summaryContainer) {
        summaryContainer.innerHTML = pending.items.map(item => `
            <div class="summary-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>${item.dish_name} x ${item.qty}</span>
                <span style="font-weight:600;">₹${item.price * item.qty}</span>
            </div>
        `).join('');
    }
}

async function processPayment() {
    const pending = JSON.parse(sessionStorage.getItem('pendingOrder'));
    
    const payBtn = document.querySelector('.btn-online'); 

    if (!payBtn || payBtn.disabled) return;

    try {
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wait...';
        payBtn.disabled = true;

        const generatedOrderId = "ORD" + Date.now() + Math.floor(Math.random() * 1000);

        const orderPayload = {
            order_id: generatedOrderId,
            total_amount: pending.total,
            items: pending.items.map(i => ({
                dish_name: i.dish_name,
                quantity: i.qty,
                price: i.price
            }))
        };

        const orderRes = await api.placeOrder(orderPayload);
        const orderId = orderRes.order?.order_id || orderRes.data?.order?.order_id || orderRes.order_id || generatedOrderId;

        if (!orderId) throw new Error("Could not retrieve Order ID from the server.");

        const paymentRes = await api.createRazorpayOrder({ order_id: orderId });
        const razorpayOrder = paymentRes.razorpay_order || paymentRes.data?.razorpay_order;
        const paymentId = paymentRes.payment_id || paymentRes.data?.payment_id;
        const dynamicKeyId = paymentRes.key_id || paymentRes.data?.key_id;

        if (!dynamicKeyId) throw new Error("Razorpay Key ID missing from server response.");

        const options = {
            key: dynamicKeyId,
            amount: razorpayOrder.amount,
            currency: "INR",
            name: "College Food Court",
            description: `Order #${orderId}`,
            order_id: razorpayOrder.id,

            handler: async function (response) {
                try {
                    payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Done...';

                    const verifyRes = await api.verifyRazorpayPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        payment_id: paymentId
                    });

                    sessionStorage.removeItem('pendingOrder');

                    const paymentContainer = document.querySelector('.payment-container');
                    if (paymentContainer) paymentContainer.style.display = 'none';

                    document.getElementById('finalOrderNumber').innerText = `#${orderId}`;

                    const qrImageSrc = verifyRes.qr_code || verifyRes.data?.qr_code;
                    if (qrImageSrc) {
                        document.getElementById('generatedQR').src = qrImageSrc;
                    }

                    document.getElementById('successScreen').style.display = 'block';

                } catch (verifyErr) {
                    console.error("Verification Error:", verifyErr);
                    customAlert("Payment completed, but verification failed. Please contact admin.", true);
                    payBtn.innerHTML = '<i class="fas fa-credit-card"></i> Online';
                    payBtn.disabled = false;
                }
            },

            modal: {
                ondismiss: async function () {
                    payBtn.innerHTML = '<i class="fas fa-credit-card"></i> Online';
                    payBtn.disabled = false;

                    try {
                        const mongoOrderId = orderRes.order?._id || orderRes.data?.order?._id;
                        if (mongoOrderId) {
                            const backendURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                                ? 'http://localhost:5000'
                                : 'https://food-court-service-backend.onrender.com';

                            const token = sessionStorage.getItem('token');
                            await axios.patch(`${backendURL}/api/orders/${mongoOrderId}/cancel`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                        }
                    } catch (cancelErr) {
                        console.error("Failed to release stock:", cancelErr);
                    }
                }
            },
            theme: { color: "#10b981" }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
            customAlert("Payment Failed: " + response.error.description, true);
            payBtn.innerHTML = '<i class="fas fa-credit-card"></i> Online';
            payBtn.disabled = false;
        });
        rzp.open();

    } catch (err) {
        payBtn.innerHTML = '<i class="fas fa-credit-card"></i> Online';
        payBtn.disabled = false;
        const errorMsg = err.response?.data?.message || err.message || "Failed to initiate payment.";
        
        customAlert(errorMsg, true);
        console.error("Payment Flow Error:", err);
    }
}

// ==========================================
//  INSTANT WALLET CHECKOUT
// ==========================================
async function payWithWallet() {
    const pending = JSON.parse(sessionStorage.getItem('pendingOrder'));
    const walletBtn = document.getElementById('walletPayBtn');

    if (!pending) return alert("Your cart is empty!");

    try {
        walletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        walletBtn.disabled = true;

        const generatedOrderId = "ORD" + Date.now() + Math.floor(Math.random() * 1000);
        const token = sessionStorage.getItem('token');

        // Smart URL detector
        const backendURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000'
            : 'https://food-court-service-backend.onrender.com';

        // 1. Tell the backend to use the Wallet!
        const orderPayload = {
            order_id: generatedOrderId,
            total_amount: pending.total,
            payment_method: 'wallet',
            items: pending.items.map(i => ({
                dish_name: i.dish_name,
                quantity: i.qty,
                price: i.price
            }))
        };

        // 2. Send the instant order request
        const res = await axios.post(`${backendURL}/api/orders`, orderPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. Success! Clear cart and show the QR code
        sessionStorage.removeItem('pendingOrder');

        // If you are using your success screen, trigger it here:
        const paymentContainer = document.querySelector('.payment-container');
        if (paymentContainer) paymentContainer.style.display = 'none';

        document.getElementById('finalOrderNumber').innerText = `#${generatedOrderId}`;

        // Display the backend-generated QR
        const qrData = res.data?.order?.qr_code_data;
        if (qrData) {
            document.getElementById('generatedQR').src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
        }

        document.getElementById('successScreen').style.display = 'block';

    } catch (err) {
        const walletBtn = document.getElementById('walletPayBtn');
        walletBtn.innerHTML = '<i class="fas fa-wallet"></i> Pay via Wallet';
        walletBtn.disabled = false;
        
        const errorMsg = err.response?.data?.message || "Wallet payment failed. Please try again.";
        
        customAlert(errorMsg, true);
    }
}

// ==========================================
// CUSTOM MODAL CONTROLLERS
// ==========================================
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
    
    modal.style.display = 'flex'; // Uses flex to center
}

function closeCustomAlert() {
    document.getElementById('customAlertModal').style.display = 'none';
}