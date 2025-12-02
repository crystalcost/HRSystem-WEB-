import { BaseView } from './BaseView.js';

export class UserView extends BaseView {
    constructor() {
        super('users-view');
    }

    renderUsers(users, sort = { field: 'id', direction: 'asc' }) {
        const tbody = this.container?.querySelector('#users-tbody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = this.getEmptyStateTemplate('👥', 'Пользователи не найдены');
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    <div class="user-info">
                        <div class="username">${user.username}</div>
                    </div>
                </td>
                <td>${user.firstName || '-'}</td>
                <td>${user.lastName || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>
                    <span class="status-badge ${user.role?.name?.toLowerCase() || ''}">
                        ${user.roleName || user.role?.name || 'N/A'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" data-action="view" data-user-id="${user.id}" title="Просмотр">
                            <img src="resources/images/view.png" alt="Просмотр" class="action-icon" 
                                 onerror="this.style.display='none'; this.parentNode.innerHTML='👁️'">
                        </button>
                        <button class="btn btn-secondary btn-sm" data-action="edit" data-user-id="${user.id}" title="Редактировать">
                            <img src="resources/images/edit.png" alt="Редактировать" class="action-icon"
                                 onerror="this.style.display='none'; this.parentNode.innerHTML='✏️'">
                        </button>
                        <button class="btn btn-danger btn-sm" data-action="delete" data-user-id="${user.id}" title="Удалить">
                            <img src="resources/images/delete.png" alt="Удалить" class="action-icon"
                                 onerror="this.style.display='none'; this.parentNode.innerHTML='🗑️'">
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    bindAddUserHandler(handler) {
        this.bindEvent('#add-user-btn', 'click', handler);
    }

    bindSearchHandler(handler) {
        this.bindEvent('#user-search', 'input', (e) => handler(e.target.value));
    }

    bindSortHandler(handler) {
        this.bindDelegate('.sortable', 'click', (e, th) => {
            const field = th.dataset.sort;
            if (field) handler(field);
        });
    }

    bindFilterHandler(handler) {
        this.bindEvent('#role-filter', 'change', (e) => handler('role', e.target.value));
    }

    bindUserActionsHandler(handler) {
        this.bindDelegate('[data-action]', 'click', (e, button) => {
            const action = button.dataset.action;
            const userId = parseInt(button.dataset.userId);
            if (action && userId) handler(action, userId);
        });
    }

    updateSortIndicator(field, direction) {
        this.container?.querySelectorAll('.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        const activeTh = this.container?.querySelector(`[data-sort="${field}"]`);
        if (activeTh) activeTh.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }

    updateSearchResults(filteredCount, totalCount) {
        const searchInfo = this.container?.querySelector('#search-info');
        if (searchInfo) searchInfo.textContent = `Показано: ${filteredCount} из ${totalCount}`;
    }

    getEmptyStateTemplate(icon, message) {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="icon">
                        <img src="resources/images/users.png" alt="Пользователи" class="empty-icon"
                             onerror="this.style.display='none'; this.parentNode.innerHTML='${icon}'">
                    </div>
                    <h3>${message}</h3>
                    <p>Попробуйте изменить параметры поиска или фильтрации</p>
                </td>
            </tr>
        `;
    }

    showLoading(loading) {
        const table = this.container?.querySelector('.table-container');
        if (table) table.classList.toggle('loading', loading);
    }

    getAddUserFormHtml() {
        return `
            <h2>Добавить пользователя</h2>
            <form id="user-form">
                <div class="form-group">
                    <label for="user-username">Логин:*</label>
                    <input type="text" id="user-username" name="username" required placeholder="Введите логин">
                </div>
                <div class="form-group">
                    <label for="user-password">Пароль:*</label>
                    <div class="password-input-container">
                        <input type="password" id="user-password" name="password" required placeholder="Введите пароль">
                    </div>
                </div>
                <div class="form-group">
                    <label for="user-confirm-password">Подтвердите пароль:*</label>
                    <div class="password-input-container">
                        <input type="password" id="user-confirm-password" name="confirmPassword" required placeholder="Подтвердите пароль">
                    </div>
                </div>
                <div class="form-group">
                    <label for="user-email">Email:*</label>
                    <input type="email" id="user-email" name="email" required placeholder="Введите email">
                </div>
                <div class="form-group">
                    <label for="user-firstname">Имя:*</label>
                    <input type="text" id="user-firstname" name="firstName" required placeholder="Введите имя">
                </div>
                <div class="form-group">
                    <label for="user-lastname">Фамилия:*</label>
                    <input type="text" id="user-lastname" name="lastName" required placeholder="Введите фамилию">
                </div>
                <div class="form-group">
                    <label for="user-role">Роль:*</label>
                    <select id="user-role" name="roleId" required>
                        <option value="">Выберите роль</option>
                        <option value="1">ADMIN</option>
                        <option value="2">MANAGER</option>
                        <option value="3">EMPLOYEE</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Создать пользователя</button>
                    <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Отмена</button>
                </div>
            </form>
        `;
    }

    getEditUserFormHtml(user) {
        return `
            <h2>Редактировать пользователя #${user.id}</h2>
            <form id="user-form">
                <div class="form-group">
                    <label for="user-username">Логин:*</label>
                    <input type="text" id="user-username" name="username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label for="user-email">Email:*</label>
                    <input type="email" id="user-email" name="email" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label for="user-firstname">Имя:*</label>
                    <input type="text" id="user-firstname" name="firstName" value="${user.firstName || ''}" required>
                </div>
                <div class="form-group">
                    <label for="user-lastname">Фамилия:*</label>
                    <input type="text" id="user-lastname" name="lastName" value="${user.lastName || ''}" required>
                </div>
                <div class="form-group">
                    <label for="user-role">Роль:*</label>
                    <select id="user-role" name="roleId" required>
                        <option value="1" ${(user.role?.id === 1 || user.role === 1) ? 'selected' : ''}>ADMIN</option>
                        <option value="2" ${(user.role?.id === 2 || user.role === 2) ? 'selected' : ''}>MANAGER</option>
                        <option value="3" ${(user.role?.id === 3 || user.role === 3) ? 'selected' : ''}>EMPLOYEE</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="user-password">Новый пароль (оставьте пустым, чтобы не менять):</label>
                    <div class="password-input-container">
                        <input type="password" id="user-password" name="password" placeholder="Введите новый пароль">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                    <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Отмена</button>
                </div>
            </form>
        `;
    }

    getUserDetailsHtml(user) {
        return `
            <h2>Детали пользователя #${user.id}</h2>
            <div class="user-details">
                <div class="detail-section">
                    <h3>Основная информация</h3>
                    <p><strong>ID:</strong> ${user.id}</p>
                    <p><strong>Логин:</strong> ${user.username}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Имя:</strong> ${user.firstName || 'Не указано'}</p>
                    <p><strong>Фамилия:</strong> ${user.lastName || 'Не указано'}</p>
                    <p><strong>Роль:</strong> ${user.roleName || user.role?.name || 'N/A'}</p>
                </div>
                <div class="action-buttons" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="app.presenters.users.showEditUserForm(${user.id})">
                        Редактировать
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="app.presenters.users.deleteUser(${user.id})">
                        Удалить
                    </button>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Закрыть</button>
            </div>
        `;
    }
}