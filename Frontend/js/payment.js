document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
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
            <div class="summary-item">
                <span>${item.dish_name} x ${item.qty}</span>
                <span style="font-weight:600;">₹${item.price * item.qty}</span>
            </div>
        `).join('');
    }
}
async function processPayment() {
    const pending = JSON.parse(sessionStorage.getItem('pendingOrder'));
    const payBtn = document.querySelector('.btn-pay');
    if (payBtn.disabled) return;
    try {
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        payBtn.disabled = true;
        const orderPayload = { 
            items: pending.items.map(i => ({ 
                dish_name: i.dish_name, 
                quantity: i.qty, 
                price: i.price 
            })) 
        };
        await api.placeOrder(orderPayload);
        sessionStorage.removeItem('pendingOrder');
        alert("Payment Successful! Order placed.");
        window.location.href = 'student.html';
    } catch (err) {
        payBtn.innerHTML = 'Confirm & Pay';
        payBtn.disabled = false;
        const errorMsg = err.response?.data?.message || "Payment failed. Please try again.";
        alert(errorMsg);
        console.error("Payment Error:", err);
    }
}