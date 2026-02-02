const mainContent = document.getElementById('main-content');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuToggle = document.getElementById('menuToggle');

const toggleMenu = () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    menuToggle.classList.toggle('open');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
};

menuToggle.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

function switchTab(tab, element) {
    // 1. Handle Sidebar/Overlay for mobile
    if (window.innerWidth < 768 && sidebar.classList.contains('active')) {
        toggleMenu();
    }

    // 2. Visual State Management: Update blue active color
    const allButtons = document.querySelectorAll('.side-action-btn, .profile-btn');
    allButtons.forEach(btn => btn.classList.remove('primary'));

    if (element) {
        element.classList.add('primary');
    } else {
        // Fallback: If page loads and no element passed, find the default button
        const defaultBtn = document.querySelector(`[onclick*="switchTab('${tab}'"]`);
        if (defaultBtn) defaultBtn.classList.add('primary');
    }

    // 3. Render Content
    let html = '';
    switch(tab) {
        case 'menu':
            html = `
                <div class="page-header"><h1>Canteen Menu</h1></div>
                <div class="stats-grid">
                    <div class="stat-card"><h3>12</h3><p>Available Today</p></div>
                    <div class="stat-card"><h3>₹40</h3><p>Avg. Price</p></div>
                    <div class="stat-card"><h3>Hot</h3><p>Status</p></div>
                </div>
                <div class="section"><div class="actions-grid" id="menu-items">Loading items...</div></div>
            `;
            setTimeout(loadMenuItems, 100);
            break;
        case 'orders':
            html = `
                <div class="page-header"><h1>My Orders</h1></div>
                <div class="stats-grid">
                    <div class="stat-card"><h3>05</h3><p>Past Orders</p></div>
                    <div class="stat-card"><h3>01</h3><p>In Kitchen</p></div>
                </div>
                <div class="section"><p>Order list history will load here...</p></div>
            `;
            break;
        case 'spend':
            html = `
                <div class="page-header"><h1>Total Spend</h1></div>
                <div class="stats-grid">
                    <div class="stat-card"><h3>₹1,450</h3><p>Monthly</p></div>
                    <div class="stat-card"><h3>₹8,900</h3><p>Lifetime</p></div>
                </div>
                <div class="section"><p>Detailed spending chart coming soon.</p></div>
            `;
            break;
        case 'support':
            html = `
                <div class="page-header"><h1>Support</h1></div>
                <div class="section"><button class="action-btn">Contact Canteen Manager</button></div>
            `;
            break;
        case 'profile':
            html = `
                <div class="page-header"><h1>Profile Settings</h1></div>
                <div class="section">
                    <p><strong>Name:</strong> Student User</p>
                    <p><strong>Code:</strong> 2024-STU</p>
                </div>
            `;
            break;
    }
    mainContent.innerHTML = html;
}

function loadMenuItems() {
    const items = ["Veg Burger", "Chicken Wrap", "Pasta", "Iced Tea"];
    const grid = document.getElementById('menu-items');
    if (grid) {
        grid.innerHTML = items.map(item => `<button class="action-btn">${item}</button>`).join('');
    }
}


//Logout Fn
function logout() { 

}


window.onload = () => switchTab('menu');