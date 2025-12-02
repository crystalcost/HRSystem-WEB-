import { BaseView } from './BaseView.js';

export class AuthView extends BaseView {
    constructor() {
        super('auth-view');
    }

    initialize() {
        this.setupTabs();
        this.setupRoleSelect();
        this.setupRealTimeValidation();
        this.setupPasswordToggle();
        this.setupPasswordMatchValidation();
    }
    
    setupRoleSelect() {
        const roleSelect = this.container?.querySelector('select[name="roleId"]');
        if (roleSelect && !roleSelect.value) roleSelect.value = '3';
    }

    setupTabs() {
        this.bindEvent('.tab-btn', 'click', (e) => {
            const tab = e.target.dataset.tab;
            this.switchTab(tab);
        });
    }

    setupRealTimeValidation() {
        const registerForm = this.container?.querySelector('#register-form');
        if (registerForm) {
            const inputs = registerForm.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('blur', (e) => this.validateField(e.target));
                input.addEventListener('input', (e) => this.clearFieldError(e.target));
            });
        }
    }

    setupPasswordToggle() {
        this.addPasswordToggle('login-password');
        this.addPasswordToggle('reg-password');
        this.addPasswordToggle('reg-confirm-password');
    }

    setupPasswordMatchValidation() {
        const passwordInput = this.container?.querySelector('#reg-password');
        const confirmPasswordInput = this.container?.querySelector('#reg-confirm-password');
        
        if (passwordInput && confirmPasswordInput) {
            passwordInput.addEventListener('input', () => {
                this.validateField(passwordInput);
                this.validatePasswordMatch();
            });
            confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    addPasswordToggle(passwordFieldId) {
        const passwordInput = this.container?.querySelector(`#${passwordFieldId}`);
        if (!passwordInput) return;
        const container = document.createElement('div');
        container.className = 'password-input-container';
        const existingClasses = passwordInput.className;
        const existingStyle = passwordInput.style.cssText;
        passwordInput.parentNode.insertBefore(container, passwordInput);
        container.appendChild(passwordInput);
        passwordInput.className = existingClasses;
        passwordInput.style.cssText = existingStyle;
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '◎';
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            toggleBtn.innerHTML = type === 'password' ? '◎' : '◉';
        });
        container.appendChild(toggleBtn);
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        this.clearFieldError(field);

        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'username':
                if (value.length < 3) {
                    isValid = false;
                    errorMessage = 'Логин должен содержать минимум 3 символа';
                } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Логин может содержать только буквы, цифры и подчеркивания';
                }
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Некорректный email адрес';
                }
                break;
            case 'password':
                if (value.length < 6) {
                    isValid = false;
                    errorMessage = 'Пароль должен содержать минимум 6 символов';
                } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                    isValid = false;
                    errorMessage = 'Пароль должен содержать заглавные, строчные буквы, и цифры';
                }
                break;
            case 'firstName':
            case 'lastName':
                if (value.length === 0) {
                    isValid = false;
                    errorMessage = 'Это поле обязательно для заполнения';
                } else if (value.length > 50) {
                    isValid = false;
                    errorMessage = 'Не более 50 символов';
                }
                break;
        }

        if (!isValid) this.showFieldError(field, errorMessage);
        else if (isValid && fieldName !== 'confirmPassword') this.showFieldSuccess(field);
        return isValid;
    }

    validatePasswordMatch() {
        const passwordInput = this.container?.querySelector('#reg-password');
        const confirmPasswordInput = this.container?.querySelector('#reg-confirm-password');
        if (!passwordInput || !confirmPasswordInput) return true;

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        this.clearFieldError(confirmPasswordInput);

        let isValid = true;
        let errorMessage = '';

        if (confirmPassword && password !== confirmPassword) {
            isValid = false;
            errorMessage = 'Пароли не совпадают';
        }

        if (!isValid) this.showFieldError(confirmPasswordInput, errorMessage);
        else if (confirmPassword && password === confirmPassword) this.showFieldSuccess(confirmPasswordInput);
        return isValid;
    }

    validateAllFields() {
        const registerForm = this.container?.querySelector('#register-form');
        if (!registerForm) return true;

        const inputs = registerForm.querySelectorAll('input[required]');
        let allValid = true;
        inputs.forEach(input => { if (!this.validateField(input)) allValid = false; });
        if (!this.validatePasswordMatch()) allValid = false;
        return allValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        if (field.parentNode.classList.contains('password-input-container')) {
            field.parentNode.parentNode.appendChild(errorElement);
        } else field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('error', 'success');
        let parent = field.parentNode.classList.contains('password-input-container') ? 
            field.parentNode.parentNode : field.parentNode;
        const existingError = parent.querySelector('.field-error');
        const existingSuccess = parent.querySelector('.field-success');
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();
    }

    showFieldSuccess(field) {
        field.classList.add('success');
        field.classList.remove('error');
        const successElement = document.createElement('div');
        successElement.className = 'field-success';
        successElement.textContent = '✓';
        if (field.parentNode.classList.contains('password-input-container')) {
            field.parentNode.parentNode.appendChild(successElement);
        } else field.parentNode.appendChild(successElement);
    }

    switchTab(tabName) {
        this.container?.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        this.container?.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        this.clearErrors();
    }

    bindLoginHandler(handler) {
        this.bindEvent('#login-form', 'submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password')
            };
            if (!credentials.username || !credentials.password) {
                this.showError('username', 'Логин и пароль обязательны');
                return;
            }
            handler(credentials);
        });
    }

    bindRegisterHandler(handler) {
        this.bindEvent('#register-form', 'submit', (e) => {
            e.preventDefault();
            this.clearErrors();
            if (!this.validateAllFields()) {
                this.showError('username', 'Исправьте ошибки в форме');
                return;
            }

            const formData = new FormData(e.target);
            let roleId = formData.get('roleId');
            if (!roleId || roleId === '') roleId = '3';
            
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            if (password !== confirmPassword) {
                this.showError('confirmPassword', 'Пароли не совпадают');
                const confirmPasswordInput = this.container?.querySelector('#reg-confirm-password');
                if (confirmPasswordInput) confirmPasswordInput.focus();
                return;
            }
            
            const userData = {
                username: formData.get('username'),
                password: password,
                email: formData.get('email'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                roleId: parseInt(roleId)
            };
            
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
        this.container?.querySelectorAll('form').forEach(form => {
            form.reset();
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => this.clearFieldError(input));
        });
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
            if (input.parentNode.classList.contains('password-input-container')) {
                input.parentNode.parentNode.appendChild(errorElement);
            } else input.parentNode.appendChild(errorElement);
        }
    }

    removeError(field) {
        const input = this.container?.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.remove('error');
            let parent = input.parentNode.classList.contains('password-input-container') ? 
                input.parentNode.parentNode : input.parentNode;
            const existingError = parent.querySelector('.error-message');
            if (existingError) existingError.remove();
        }
    }

    clearErrors() {
        this.container?.querySelectorAll('.error-message').forEach(error => error.remove());
        this.container?.querySelectorAll('.field-error').forEach(error => error.remove());
        this.container?.querySelectorAll('.field-success').forEach(success => success.remove());
        this.container?.querySelectorAll('.error').forEach(input => input.classList.remove('error'));
        this.container?.querySelectorAll('.success').forEach(input => input.classList.remove('success'));
    }
}