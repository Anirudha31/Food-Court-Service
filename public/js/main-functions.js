// Main Landing Page Functions
class MainManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('🏠 Main Manager initialized');
        this.setupAnimations();
        this.setupEventListeners();
    }

    setupAnimations() {
        // Animate cards on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.login-card').forEach(card => {
            observer.observe(card);
        });
    }

    setupEventListeners() {
        // Add click effects to login cards
        document.querySelectorAll('.login-card').forEach(card => {
            card.addEventListener('click', function(e) {
                // Don't trigger if clicking on the button
                if (!e.target.classList.contains('login-btn')) {
                    const link = this.querySelector('.login-btn');
                    if (link) {
                        link.click();
                    }
                }
            });
        });

        // Add ripple effect to buttons
        document.querySelectorAll('.login-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1.05)';
                }, 100);
            });
        });
    }

    navigateToLogin(role) {
        console.log(`🚀 Navigating to ${role} login`);
        // Add navigation logic if needed
    }
}

// Initialize main manager
const mainManager = new MainManager();
