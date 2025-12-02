import { ApiService } from '../services/ApiService.js';
import { User } from '../models/User.js';
import { UserView } from '../views/UserView.js';

export class UserPresenter {
    constructor(app) {
        this.app = app;
        this.apiService = new ApiService();
        this.view = new UserView();
        this.users = [];
        this.filteredUsers = [];
        this.currentSort = { field: 'id', direction: 'asc' };
        this.searchQuery = '';
        this.roleFilter = '';
        this.init();
    }

    init() {
        this.view.bindAddUserHandler(() => this.showAddUserForm());
        this.view.bindSearchHandler((query) => this.handleSearch(query));
        this.view.bindUserActionsHandler((action, userId) => this.handleUserAction(action, userId));
        this.view.bindSortHandler((field) => this.handleSort(field));
        this.view.bindFilterHandler((filterType, value) => this.handleFilter(filterType, value));
    }

    async show() {
        this.view.show();
        await this.loadUsers();
    }

    async loadUsers() {
        try {
            this.view.showLoading(true);
            if (!this.app.isAdmin()) throw new Error('Недостаточно прав для просмотра пользователей');

            const users = await this.apiService.get('/users');
            this.users = users.map(userData => User.fromApiData(userData));
            this.applyFiltersAndSort();
            
        } catch (error) {
            this.app.showNotification(error.message, 'error');
            this.view.renderUsers([]);
        } finally {
            this.view.showLoading(false);
        }
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.applyFiltersAndSort();
    }

    handleSort(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        this.applyFiltersAndSort();
        this.view.updateSortIndicator(this.currentSort.field, this.currentSort.direction);
    }

    handleFilter(filterType, value) {
        if (filterType === 'role') this.roleFilter = value;
        this.applyFiltersAndSort();
    }

    applyFiltersAndSort() {
        let filtered = this.users;
        
        if (this.searchQuery) {
            filtered = filtered.filter(user => 
                user.username.toLowerCase().includes(this.searchQuery) ||
                user.email.toLowerCase().includes(this.searchQuery) ||
                (user.firstName && user.firstName.toLowerCase().includes(this.searchQuery)) ||
                (user.lastName && user.lastName.toLowerCase().includes(this.searchQuery)) ||
                (user.roleName && user.roleName.toLowerCase().includes(this.searchQuery))
            );
        }

        if (this.roleFilter) {
            filtered = filtered.filter(user => 
                user.role?.name === this.roleFilter || user.roleName === this.roleFilter
            );
        }

        filtered.sort((a, b) => {
            let aValue = a[this.currentSort.field];
            let bValue = b[this.currentSort.field];

            if (this.currentSort.field === 'role' && a.role && b.role) {
                aValue = a.role.name || a.role;
                bValue = b.role.name || b.role;
            }

            if (this.currentSort.field === 'roleName') {
                aValue = a.roleName || (a.role?.name || a.role);
                bValue = b.roleName || (b.role?.name || b.role);
            }

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.filteredUsers = filtered;
        this.view.renderUsers(this.filteredUsers, this.currentSort);
        this.view.updateSearchResults(this.filteredUsers.length, this.users.length);
    }

    showAddUserForm() {
        const formHtml = this.view.getAddUserFormHtml();
        this.app.showModal(formHtml, (form) => this.handleCreateUser(form));
        setTimeout(() => {
            this.setupUserFormValidation();
            this.app.setupProfilePasswordToggles();
        }, 100);
    }

    setupUserFormValidation() {
        const form = document.getElementById('user-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateUserField(e.target));
            input.addEventListener('input', (e) => this.clearUserFieldError(e.target));
        });
        const passwordInput = form.querySelector('#user-password');
        const confirmPasswordInput = form.querySelector('#user-confirm-password');
        if (passwordInput && confirmPasswordInput) {
            passwordInput.addEventListener('input', () => {
                this.validateUserField(passwordInput);
                this.validateUserPasswordMatch();
            });
            confirmPasswordInput.addEventListener('input', () => {
                this.validateUserPasswordMatch();
            });
        }
    }

    validateUserField(field) {
        const value = field.value.trim();
        const fieldName = field.name || field.id.replace('user-', '');
        this.clearUserFieldError(field);

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
                    errorMessage = 'Пароль должен содержать заглавные, строчные буквы и цифры';
                }
                break;
            case 'confirmPassword':
                return true;
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

        if (!isValid) {
            this.showUserFieldError(field, errorMessage);
        } else if (isValid && fieldName !== 'confirmPassword') {
            this.showUserFieldSuccess(field);
        }

        return isValid;
    }

    validateUserPasswordMatch() {
        const form = document.getElementById('user-form');
        if (!form) return true;

        const passwordInput = form.querySelector('#user-password');
        const confirmPasswordInput = form.querySelector('#user-confirm-password');
        
        if (!passwordInput || !confirmPasswordInput) return true;

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        this.clearUserFieldError(confirmPasswordInput);

        let isValid = true;
        let errorMessage = '';

        if (confirmPassword && password !== confirmPassword) {
            isValid = false;
            errorMessage = 'Пароли не совпадают';
        }

        if (!isValid) {
            this.showUserFieldError(confirmPasswordInput, errorMessage);
        } else if (confirmPassword && password === confirmPassword) {
            this.showUserFieldSuccess(confirmPasswordInput);
        }
        
        return isValid;
    }

    validateAllUserFields() {
        const form = document.getElementById('user-form');
        if (!form) return true;

        const inputs = form.querySelectorAll('input[required]');
        let allValid = true;

        inputs.forEach(input => {
            if (!this.validateUserField(input)) {
                allValid = false;
            }
        });
        if (!this.validateUserPasswordMatch()) {
            allValid = false;
        }
        const roleSelect = form.querySelector('#user-role');
        if (roleSelect && !roleSelect.value) {
            this.showUserFieldError(roleSelect, 'Выберите роль');
            allValid = false;
        }

        return allValid;
    }

    showUserFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        if (field.parentNode.classList.contains('password-input-container')) {
            field.parentNode.parentNode.appendChild(errorElement);
        } else {
            field.parentNode.appendChild(errorElement);
        }
    }

    clearUserFieldError(field) {
        field.classList.remove('error', 'success');
        
        let parent;
        if (field.parentNode.classList.contains('password-input-container')) {
            parent = field.parentNode.parentNode;
        } else {
            parent = field.parentNode;
        }
        
        const existingError = parent.querySelector('.field-error');
        const existingSuccess = parent.querySelector('.field-success');
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();
    }

    showUserFieldSuccess(field) {
        field.classList.add('success');
        field.classList.remove('error');
        
        const successElement = document.createElement('div');
        successElement.className = 'field-success';
        successElement.textContent = '✓';
        
        if (field.parentNode.classList.contains('password-input-container')) {
            field.parentNode.parentNode.appendChild(successElement);
        } else {
            field.parentNode.appendChild(successElement);
        }
    }

    async handleCreateUser(form) {
        try {
            if (!this.validateAllUserFields()) {
                this.app.showNotification('Исправьте ошибки в форме', 'error');
                return;
            }
    
            const formData = new FormData(form);
            const userData = {
                username: formData.get('username').trim(),
                password: formData.get('password'),
                email: formData.get('email').trim(),
                firstName: formData.get('firstName').trim(),
                lastName: formData.get('lastName').trim(),
                roleId: parseInt(formData.get('roleId'))
            };
    
            const confirmPassword = formData.get('confirmPassword');
            if (userData.password !== confirmPassword) {
                this.app.showNotification('Пароли не совпадают', 'error');
                return;
            }
    
            const user = new User(userData);
            const validationErrors = user.validate();
            
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
            const response = await this.apiService.post('/users', user.toCreateDTO());
            if (response.status === 'SUCCESS' || response.id) {
                this.app.showNotification('Пользователь успешно создан', 'success');
                this.app.hideModal();
                await this.loadUsers();
            } else {
                throw new Error(response.message || 'Ошибка создания пользователя');
            }
            
        } catch (error) {
            this.app.showNotification('Ошибка создания пользователя: ' + error.message, 'error');
        }
    }

    async showEditUserForm(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) {
                this.app.showNotification('Пользователь не найден', 'error');
                return;
            }

            const formHtml = this.view.getEditUserFormHtml(user);
            this.app.showModal(formHtml, (form) => this.handleUpdateUser(userId, form));
            setTimeout(() => {
                this.setupEditFormValidation();
                this.app.setupProfilePasswordToggles();
            }, 100);
            
        } catch (error) {
            this.app.showNotification(error.message, 'error');
        }
    }

    setupEditFormValidation() {
        const form = document.getElementById('user-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input[type="text"], input[type="email"]');
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateUserField(e.target));
            input.addEventListener('input', (e) => this.clearUserFieldError(e.target));
        });
        const passwordInput = form.querySelector('#user-password');
        if (passwordInput) {
            passwordInput.addEventListener('blur', (e) => {
                if (e.target.value.trim()) {
                    this.validateUserField(e.target);
                }
            });
            passwordInput.addEventListener('input', (e) => {
                this.clearUserFieldError(e.target);
                if (!e.target.value.trim()) {
                    this.clearUserFieldError(e.target);
                }
            });
        }
    }

    async handleUserAction(action, userId) {
        switch (action) {
            case 'edit': await this.showEditUserForm(userId); break;
            case 'delete': await this.deleteUser(userId); break;
            case 'view': await this.showUserDetails(userId); break;
        }
    }

    async handleUpdateUser(userId, form) {
        try {
            const formData = new FormData(form);
            const userData = {
                username: formData.get('username').trim(),
                email: formData.get('email').trim(),
                firstName: formData.get('firstName').trim(),
                lastName: formData.get('lastName').trim(),
                roleId: parseInt(formData.get('roleId'))
            };

            const password = formData.get('password');
            if (password && password.trim().length > 0) {
                if (password.length < 6) {
                    this.app.showNotification('Пароль должен содержать минимум 6 символов', 'error');
                    return;
                }
                userData.password = password;
            }

            const user = new User(userData);
            const validationErrors = user.validate();
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }

            const response = await this.apiService.put(`/users/${userId}`, user.toUpdateDTO());
            this.app.showNotification('Пользователь успешно обновлен', 'success');
            this.app.hideModal();
            await this.loadUsers();
            
        } catch (error) {
            this.app.showNotification('Ошибка обновления пользователя: ' + error.message, 'error');
        }
    }

    async showUserDetails(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) {
                this.app.showNotification('Пользователь не найден', 'error');
                return;
            }

            const detailsHtml = this.view.getUserDetailsHtml(user);
            this.app.showModal(detailsHtml);
            
        } catch (error) {
            this.app.showNotification('Ошибка загрузки деталей пользователя', 'error');
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.app.showNotification('Пользователь не найден', 'error');
            return;
        }

        if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.username}" (ID: ${user.id})?`)) return;

        try {
            const response = await this.apiService.delete(`/users/${userId}`);
            this.app.showNotification('Пользователь успешно удален', 'success');
            await this.loadUsers();
            
        } catch (error) {
            this.app.showNotification('Ошибка удаления пользователя: ' + error.message, 'error');
        }
    }
}