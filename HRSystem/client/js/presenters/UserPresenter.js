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
        this.init();
    }

    init() {
        this.view.bindAddUserHandler(() => this.showAddUserForm());
        this.view.bindSearchHandler((query) => this.handleSearch(query));
        this.view.bindUserActionsHandler((action, userId) => this.handleUserAction(action, userId));
    }

    async show() {
        this.view.show();
        await this.loadUsers();
    }

    hide() {
        this.view.hide();
    }

    onViewShow() {
        this.loadUsers();
    }

    async loadUsers() {
        try {
            this.view.showLoading(true);
            
            if (!this.app.isAdmin()) {
                throw new Error('Недостаточно прав для просмотра пользователей');
            }

            const users = await this.apiService.get('/users');
            this.users = users.map(userData => User.fromApiData(userData));
            this.filteredUsers = [...this.users];
            
            this.view.renderUsers(this.filteredUsers);
            
        } catch (error) {
            this.app.showNotification(error.message, 'error');
            this.view.renderUsers([]);
        } finally {
            this.view.showLoading(false);
        }
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredUsers = [...this.users];
        } else {
            this.filteredUsers = this.users.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.firstName.toLowerCase().includes(searchTerm) ||
                user.lastName.toLowerCase().includes(searchTerm) ||
                user.roleName.toLowerCase().includes(searchTerm)
            );
        }
        
        this.view.renderUsers(this.filteredUsers);
        this.view.updateSearchResults(this.filteredUsers.length);
    }

    showAddUserForm() {
        const formHtml = `
            <h2>Добавить пользователя</h2>
            <form id="user-form">
                <div class="form-group">
                    <label for="user-username">Логин:</label>
                    <input type="text" id="user-username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="user-password">Пароль:</label>
                    <input type="password" id="user-password" name="password" required>
                </div>
                <div class="form-group">
                    <label for="user-email">Email:</label>
                    <input type="email" id="user-email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="user-firstname">Имя:</label>
                    <input type="text" id="user-firstname" name="firstName" required>
                </div>
                <div class="form-group">
                    <label for="user-lastname">Фамилия:</label>
                    <input type="text" id="user-lastname" name="lastName" required>
                </div>
                <div class="form-group">
                    <label for="user-role">Роль:</label>
                    <select id="user-role" name="roleId" required>
                        <option value="1">ADMIN</option>
                        <option value="2">MANAGER</option>
                        <option value="3">EMPLOYEE</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Создать</button>
                    <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Отмена</button>
                </div>
            </form>
        `;

        this.app.showModal(formHtml, (form) => this.handleCreateUser(form));
    }

    async handleCreateUser(form) {
        try {
            const formData = new FormData(form);
            const userData = {
                username: formData.get('username'),
                password: formData.get('password'),
                email: formData.get('email'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                roleId: parseInt(formData.get('roleId'))
            };

            const user = new User(userData);
            const validationErrors = user.validate();
            
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }

            await this.apiService.post('/users', user.toCreateDTO());
            
            this.app.showNotification('Пользователь успешно создан', 'success');
            this.app.hideModal();
            await this.loadUsers();
            
        } catch (error) {
            this.app.showNotification(error.message, 'error');
        }
    }

    async handleUserAction(action, userId) {
        switch (action) {
            case 'edit':
                await this.showEditUserForm(userId);
                break;
            case 'delete':
                await this.deleteUser(userId);
                break;
        }
    }

    async showEditUserForm(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) return;

            const formHtml = `
                <h2>Редактировать пользователя</h2>
                <form id="user-form">
                    <div class="form-group">
                        <label for="user-username">Логин:</label>
                        <input type="text" id="user-username" name="username" value="${user.username}" required>
                    </div>
                    <div class="form-group">
                        <label for="user-email">Email:</label>
                        <input type="email" id="user-email" name="email" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="user-firstname">Имя:</label>
                        <input type="text" id="user-firstname" name="firstName" value="${user.firstName}" required>
                    </div>
                    <div class="form-group">
                        <label for="user-lastname">Фамилия:</label>
                        <input type="text" id="user-lastname" name="lastName" value="${user.lastName}" required>
                    </div>
                    <div class="form-group">
                        <label for="user-role">Роль:</label>
                        <select id="user-role" name="roleId" required>
                            <option value="1" ${user.role?.id === 1 ? 'selected' : ''}>ADMIN</option>
                            <option value="2" ${user.role?.id === 2 ? 'selected' : ''}>MANAGER</option>
                            <option value="3" ${user.role?.id === 3 ? 'selected' : ''}>EMPLOYEE</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="user-password">Новый пароль (оставьте пустым, чтобы не менять):</label>
                        <input type="password" id="user-password" name="password">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Сохранить</button>
                        <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Отмена</button>
                    </div>
                </form>
            `;

            this.app.showModal(formHtml, (form) => this.handleUpdateUser(userId, form));
            
        } catch (error) {
            this.app.showNotification(error.message, 'error');
        }
    }

    async handleUpdateUser(userId, form) {
        try {
            const formData = new FormData(form);
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                roleId: parseInt(formData.get('roleId'))
            };

            const password = formData.get('password');
            if (password) {
                userData.password = password;
            }

            const user = new User(userData);
            const validationErrors = user.validate();
            
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }

            await this.apiService.put(`/users/${userId}`, user.toUpdateDTO());
            
            this.app.showNotification('Пользователь успешно обновлен', 'success');
            this.app.hideModal();
            await this.loadUsers();
            
        } catch (error) {
            this.app.showNotification(error.message, 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            return;
        }

        try {
            await this.apiService.delete(`/users/${userId}`);
            
            this.app.showNotification('Пользователь успешно удален', 'success');
            await this.loadUsers();
            
        } catch (error) {
            this.app.showNotification(error.message, 'error');
        }
    }
}