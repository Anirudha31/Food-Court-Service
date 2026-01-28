// Custom Modal System - Replacing Bootstrap Modals

class CustomModal {
    constructor() {
        this.activeModal = null;
        this.modalBackdrop = null;
        this.init();
    }

    init() {
        // Create backdrop if it doesn't exist
        if (!document.querySelector('.modal-backdrop')) {
            this.modalBackdrop = document.createElement('div');
            this.modalBackdrop.className = 'modal-backdrop fade';
            document.body.appendChild(this.modalBackdrop);
        } else {
            this.modalBackdrop = document.querySelector('.modal-backdrop');
        }
    }

    show(modalElement) {
        if (!modalElement) return;

        // Hide any existing modal
        if (this.activeModal) {
            this.hide(this.activeModal);
        }

        this.activeModal = modalElement;
        
        // Show backdrop
        this.modalBackdrop.classList.add('show');
        
        // Show modal
        modalElement.classList.add('show');
        modalElement.style.display = 'block';
        
        // Add body class to prevent scrolling
        document.body.style.overflow = 'hidden';
        
        // Focus management
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Add event listeners
        this.addEventListeners(modalElement);
    }

    hide(modalElement) {
        if (!modalElement) return;

        // Hide backdrop
        this.modalBackdrop.classList.remove('show');
        
        // Hide modal
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        
        // Restore body scrolling
        document.body.style.overflow = '';
        
        // Clear active modal
        this.activeModal = null;
        
        // Remove event listeners
        this.removeEventListeners(modalElement);
    }

    addEventListeners(modalElement) {
        // Close on backdrop click
        this.modalBackdrop.addEventListener('click', () => {
            this.hide(modalElement);
        });

        // Close on escape key
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hide(modalElement);
            }
        };
        document.addEventListener('keydown', this.escapeHandler);

        // Close on close button click
        const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.hide(modalElement);
            });
        });
    }

    removeEventListeners(modalElement) {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
    }

    createModal(options = {}) {
        const {
            id = 'customModal',
            title = 'Modal',
            size = 'modal-lg', // modal-sm, modal-lg, modal-xl
            body = '',
            footer = '',
            showClose = true
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-dialog ${size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        ${showClose ? '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>' : ''}
                    </div>
                    <div class="modal-body">
                        ${body}
                    </div>
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            </div>
        `;

        return modal;
    }

    // Static method to create and show modal in one call
    static show(options = {}) {
        const modalInstance = new CustomModal();
        const modal = modalInstance.createModal(options);
        document.body.appendChild(modal);
        modalInstance.show(modal);
        return modalInstance;
    }

    // Static method to show existing modal
    static showById(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const modalInstance = new CustomModal();
            modalInstance.show(modal);
            return modalInstance;
        }
        return null;
    }
}

// Global instance for easy access
window.customModal = new CustomModal();

// Helper function for backward compatibility with Bootstrap syntax
window.bootstrap = {
    Modal: class {
        constructor(element) {
            this.element = element;
        }

        show() {
            window.customModal.show(this.element);
        }

        hide() {
            window.customModal.hide(this.element);
        }
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomModal;
}
