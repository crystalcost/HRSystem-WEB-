import { BaseView } from './BaseView.js';

export class ProfileView extends BaseView {
    constructor() {
        super('profile-view');
        this.profileFormChanged = false;
    }

    initialize() {
        this.setupRealTimeValidation();
        this.setupPasswordMatchValidation();
        this.setupPasswordToggle();
    }

    setupRealTimeValidation() {
        const profileForm = this.container?.querySelector('#profile-form');
        if (profileForm) {
            const inputs = profileForm.querySelectorAll('input:not([readonly]):not([disabled])');
            inputs.forEach(input => {
                input.addEventListener('blur', (e) => this.validateField(e.target));
                input.addEventListener('input', (e) => this.clearFieldError(e.target));
            });
        }
    }

    setupPasswordToggle() {
        this.addPasswordToggle('current-password');
        this.addPasswordToggle('new-password');
        this.addPasswordToggle('confirm-password');
    }

    setupPasswordMatchValidation() {
        const newPasswordInput = this.container?.querySelector('#new-password');
        const confirmPasswordInput = this.container?.querySelector('#confirm-password');
        if (newPasswordInput && confirmPasswordInput) {
            newPasswordInput.addEventListener('input', () => {
                this.validateField(newPasswordInput);
                this.validatePasswordMatch();
            });
            confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    addPasswordToggle(passwordFieldId) {
        const passwordInput = this.container?.querySelector(`#${passwordFieldId}`);
        if (!passwordInput) return;
        const existingToggle = passwordInput.parentNode.querySelector('.password-toggle');
        if (existingToggle) {
            return;
        }
        if (passwordInput.parentNode.classList.contains('password-input-container')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle';
            toggleBtn.innerHTML = '◎';
            toggleBtn.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                toggleBtn.innerHTML = type === 'password' ? '◎' : '◉';
            });
            passwordInput.parentNode.appendChild(toggleBtn);
            return;
        }
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
        const fieldId = field.id;
        this.clearFieldError(field);

        let isValid = true;
        let errorMessage = '';

        switch (fieldId) {
            case 'profile-firstname':
            case 'profile-lastname':
                if (value.length === 0) {
                    isValid = false;
                    errorMessage = 'Это поле обязательно для заполнения';
                } else if (value.length > 50) {
                    isValid = false;
                    errorMessage = 'Не более 50 символов';
                } else if (!/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Можно использовать только буквы, пробелы и дефисы';
                }
                break;
            case 'profile-email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Некорректный email адрес';
                }
                break;
            case 'new-password':
                if (value && value.length < 6) {
                    isValid = false;
                    errorMessage = 'Пароль должен содержать минимум 6 символов';
                } else if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                    isValid = false;
                    errorMessage = 'Пароль должен содержать заглавные, строчные буквы и цифры';
                }
                break;
        }

        if (!isValid) this.showFieldError(field, errorMessage);
        else if (isValid && fieldId !== 'confirm-password') this.showFieldSuccess(field);
        return isValid;
    }

    validatePasswordMatch() {
        const newPasswordInput = this.container?.querySelector('#new-password');
        const confirmPasswordInput = this.container?.querySelector('#confirm-password');
        if (!newPasswordInput || !confirmPasswordInput) return true;

        const password = newPasswordInput.value;
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

    showFieldError(field, message) {
        if (!field) return;
        this.clearFieldError(field);
        field.classList.add('error');
        field.classList.remove('success');
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.appendChild(errorElement);
        }
    }
    
    showFieldSuccess(field) {
        if (!field) return;
        this.clearFieldError(field);
        field.classList.add('success');
        field.classList.remove('error');
        const successElement = document.createElement('div');
        successElement.className = 'field-success';
        successElement.textContent = '✓';
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.appendChild(successElement);
        }
    }
    
    clearFieldError(field) {
        if (!field) return;
        field.classList.remove('error', 'success');
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            const messages = formGroup.querySelectorAll('.field-error, .field-success');
            messages.forEach(msg => msg.remove());
        }
    }

    updateProfileInfo(user) {
        const profileUsername = this.container?.querySelector('#profile-username');
        const profileFirstname = this.container?.querySelector('#profile-firstname');
        const profileLastname = this.container?.querySelector('#profile-lastname');
        const profileEmail = this.container?.querySelector('#profile-email');
        const profileRole = this.container?.querySelector('#profile-role');
        if (profileUsername) profileUsername.value = user.username || '';
        if (profileFirstname) profileFirstname.value = user.firstName || '';
        if (profileLastname) profileLastname.value = user.lastName || '';
        if (profileEmail) profileEmail.value = user.email || '';
        if (profileRole) {
            let roleDisplay = '';
            if (typeof user.role === 'object' && user.role !== null) {
                roleDisplay = user.role.name || user.role.id || '';
            } else if (user.role) {
                roleDisplay = String(user.role);
            } else {
                roleDisplay = 'N/A';
            }
            profileRole.value = roleDisplay;
        }
        this.clearAllErrors();
    }

    bindProfileUpdateHandler(handler) {
        this.bindEvent('#profile-form', 'submit', (e) => {
            e.preventDefault();
            this.clearAllErrors();
            const formData = new FormData(e.target);
            handler(formData);
        });
    }

    bindPasswordChangeHandler(handler) {
        this.bindEvent('#change-password', 'click', () => {
            this.clearAllErrors();
            const currentPassword = this.container?.querySelector('#current-password');
            const newPassword = this.container?.querySelector('#new-password');
            const confirmPassword = this.container?.querySelector('#confirm-password');

            if (!currentPassword || !currentPassword.value) {
                this.showFieldError(currentPassword, 'Введите текущий пароль');
                return;
            }

            if (newPassword.value && newPassword.value.length < 6) {
                this.showFieldError(newPassword, 'Пароль должен содержать минимум 6 символов');
                return;
            }

            if (currentPassword.value === newPassword.value) {
                this.showFieldError(newPassword, 'Новый пароль должен отличаться от текущего');
                return;
            }

            const passwords = {
                oldPassword: currentPassword.value,
                newPassword: newPassword.value
            };
            handler(passwords);
        });
    }

    bindCancelEditHandler(handler) {
        this.bindEvent('#cancel-profile-edit', 'click', () => {
            this.clearAllErrors();
            handler();
        });
    }

    bindProfileFormChangeHandler(handler) {
        this.bindEvent('#profile-form', 'input', (e) => {
            this.clearFieldError(e.target);
            handler();
        });
    }

    showProfileUpdateButton() {
        const updateActions = this.container?.querySelector('#profile-update-actions');
        if (updateActions) updateActions.style.display = 'flex';
    }

    hideProfileUpdateButton() {
        const updateActions = this.container?.querySelector('#profile-update-actions');
        if (updateActions) updateActions.style.display = 'none';
        this.profileFormChanged = false;
    }

    clearPasswordFields() {
        const currentPassword = this.container?.querySelector('#current-password');
        const newPassword = this.container?.querySelector('#new-password');
        const confirmPassword = this.container?.querySelector('#confirm-password');
        if (currentPassword) { currentPassword.value = ''; this.clearFieldError(currentPassword); }
        if (newPassword) { newPassword.value = ''; this.clearFieldError(newPassword); }
        if (confirmPassword) { confirmPassword.value = ''; this.clearFieldError(confirmPassword); }
    }

    clearAllErrors() {
        this.container?.querySelectorAll('.field-error').forEach(error => error.remove());
        this.container?.querySelectorAll('.field-success').forEach(success => success.remove());
        this.container?.querySelectorAll('.error').forEach(input => input.classList.remove('error'));
        this.container?.querySelectorAll('.success').forEach(input => input.classList.remove('success'));
    }
}