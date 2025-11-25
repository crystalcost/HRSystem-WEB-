import { BaseView } from './BaseView.js';

export class UserView extends BaseView {
    constructor() {
        super('users-view');
    }

    initialize() {
    }

    renderUsers(users) {
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
                        ${user.email ? `<div class="email">${user.email}</div>` : ''}
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
                        <button class="btn btn-secondary btn-sm" data-action="edit" data-user-id="${user.id}">
                            ✏️ Редактировать
                        </button>
                        <button class="btn btn-danger btn-sm" data-action="delete" data-user-id="${user.id}">
                            🗑️ Удалить
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
        this.bindEvent('#user-search', 'input', (e) => {
            handler(e.target.value);
        });
    }

    bindUserActionsHandler(handler) {
        this.bindDelegate('[data-action]', 'click', (e, button) => {
            const action = button.dataset.action;
            const userId = parseInt(button.dataset.userId);
            
            if (action && userId) {
                handler(action, userId);
            }
        });
    }

    getEmptyStateTemplate(icon, message) {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="icon">${icon}</div>
                    <h3>${message}</h3>
                    <p>Начните с добавления первого пользователя</p>
                </td>
            </tr>
        `;
    }

    showLoading(loading) {
        const table = this.container?.querySelector('.table-container');
        if (table) {
            table.classList.toggle('loading', loading);
        }
    }

    updateSearchResults(count) {
        const searchInput = this.container?.querySelector('#user-search');
        if (searchInput && count !== undefined) {
            const existingCounter = searchInput.parentNode.querySelector('.search-counter');
            if (existingCounter) {
                existingCounter.remove();
            }
            
            if (count >= 0) {
                const counter = document.createElement('div');
                counter.className = 'search-counter';
                counter.textContent = `Найдено: ${count}`;
                counter.style.fontSize = '0.8rem';
                counter.style.color = '#666';
                counter.style.marginTop = '0.5rem';
                searchInput.parentNode.appendChild(counter);
            }
        }
    }
}