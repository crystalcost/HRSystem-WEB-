import { BaseView } from './BaseView.js';

export class AuthView extends BaseView {
    constructor() {
        super('auth-view');
    }

    initialize() {
        this.setupTabs();
        this.setupRoleSelect(); 
    }
    
    setupRoleSelect() {
        const roleSelect = this.container?.querySelector('select[name="roleId"]');
        if (roleSelect && !roleSelect.value) {
            roleSelect.value = '3'; 
        }
    }

    setupTabs() {
        this.bindEvent('.tab-btn', 'click', (e) => {
            const tab = e.target.dataset.tab;
            this.switchTab(tab);
        });
    }

    switchTab(tabName) {
        this.container?.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        this.container?.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    bindLoginHandler(handler) {
        this.bindEvent('#login-form', 'submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password')
            };
            handler(credentials);
        });
    }

    bindRegisterHandler(handler) {
        this.bindEvent('#register-form', 'submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            let roleId = formData.get('roleId');
            if (!roleId || roleId === '') {
                roleId = '3'; 
            }
            
            const userData = {
                username: formData.get('username'),
                password: formData.get('password'),
                email: formData.get('email'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                roleId: parseInt(roleId)
            };
    
            console.log('📝 Form registration data:', userData);
            handler(userData);
        });
    }

    setLoading(loading) {
        const buttons = this.container?.querySelectorAll('button[type="submit"]');
        buttons?.forEach(button => {
            button.disabled = loading;
            const originalText = button.closest('#login-form') ? 'Войти' : 'Зарегистрироваться';
            button.textContent = loading ? 'Загрузка...' : originalText;
        });
    }

    clearForms() {
        this.container?.querySelectorAll('form').forEach(form => form.reset());
        
        setTimeout(() => this.setupRoleSelect(), 100);
    }

    showError(field, message) {
        const input = this.container?.querySelector(`[name="${field}"]`);
        if (input) {
            this.removeError(field);
            
            input.classList.add('error');
            
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            errorElement.style.color = 'var(--danger-color)';
            errorElement.style.fontSize = '0.8rem';
            errorElement.style.marginTop = '0.25rem';
            
            input.parentNode.appendChild(errorElement);
        }
    }

    removeError(field) {
        const input = this.container?.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.remove('error');
            const existingError = input.parentNode.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
        }
    }

    clearErrors() {
        this.container?.querySelectorAll('.error-message').forEach(error => error.remove());
        this.container?.querySelectorAll('.error').forEach(input => input.classList.remove('error'));
    }
}