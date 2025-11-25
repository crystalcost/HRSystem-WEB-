import { BaseView } from './BaseView.js';

export class TrainingView extends BaseView {
    constructor() {
        super('training-view');
    }

    initialize() {
    }

    renderRequests(requests, isManagerOrAdmin = false) {
        const tbody = this.container?.querySelector('#training-tbody');
        if (!tbody) return;
    
        const addButton = this.container?.querySelector('#add-training-btn');
        if (addButton) {
            addButton.style.display = isManagerOrAdmin ? 'none' : 'block';
        }
    
        if (requests.length === 0) {
            tbody.innerHTML = this.getEmptyStateTemplate('🎓', 'Заявки не найдены');
            return;
        }
    
        tbody.innerHTML = requests.map(request => `
            <tr>
                <td>${request.requestId}</td>
                <td>
                    <div class="course-info">
                        <div class="course-name">${request.courseName}</div>
                        ${request.priority === 'high' ? '<div class="priority high">Высокий приоритет</div>' : ''}
                    </div>
                </td>
                <td>
                    <div class="user-info">
                        <div class="username">${request.user?.firstName || 'Не указан'} ${request.user?.lastName || ''}</div>
                        <div class="email">${request.user?.email || 'Не указан'}</div>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${request.status?.toLowerCase()}">
                        ${request.statusText || request.status}
                    </span>
                </td>
                <td>${request.submittedAtFormatted || new Date(request.submittedAt).toLocaleDateString('ru-RU')}</td>
                <td>${request.getDurationDescription ? request.getDurationDescription() : (request.duration?.description || '')}</td>
                <td>
                    <div class="action-buttons">
                        ${request.canViewDetails ? `
                            <button class="btn btn-primary btn-sm" data-action="view" data-request-id="${request.requestId}">
                                👁️ Просмотр
                            </button>
                        ` : ''}
                        ${request.canBeModified ? `
                            <button class="btn btn-danger btn-sm" data-action="cancel" data-request-id="${request.requestId}">
                                ❌ Отменить
                            </button>
                        ` : ''}
                        ${request.canBeManaged ? `
                            <button class="btn btn-success btn-sm" data-action="approve" data-request-id="${request.requestId}">
                                ✅ Одобрить
                            </button>
                            <button class="btn btn-warning btn-sm" data-action="deny" data-request-id="${request.requestId}">
                                ❌ Отклонить
                            </button>
                        ` : ''}
                        ${request.canDelete ? `
                            <button class="btn btn-danger btn-sm" data-action="delete" data-request-id="${request.requestId}">
                                🗑️ Удалить
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    bindAddRequestHandler(handler) {
        this.bindEvent('#add-training-btn', 'click', handler);
    }

    bindSubmitRequestHandler(handler) {
        this.bindEvent('#submit-training', 'click', () => {
            const courseInput = this.container?.querySelector('#training-course');
            if (!courseInput) return;

            const requestData = {
                courseName: courseInput.value.trim()
            };

            handler(requestData);
        });
    }

    bindCancelRequestHandler(handler) {
        this.bindEvent('#cancel-training', 'click', handler);
    }

    bindRequestActionsHandler(handler) {
        this.bindDelegate('[data-action]', 'click', (e, button) => {
            const action = button.dataset.action;
            const requestId = parseInt(button.dataset.requestId);
            
            if (action && requestId) {
                handler(action, requestId);
            }
        });
    }

    showRequestForm() {
        this.showElement('#training-form');
        this.hideElement('#add-training-btn');
    }

    hideRequestForm() {
        this.hideElement('#training-form');
        this.showElement('#add-training-btn');
        this.resetForm();
    }

    resetForm() {
        const courseInput = this.container?.querySelector('#training-course');
        if (courseInput) courseInput.value = '';
    }

    getEmptyStateTemplate(icon, message) {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="icon">${icon}</div>
                    <h3>${message}</h3>
                    <p>Начните с подачи первой заявки на обучение</p>
                </td>
            </tr>
        `;
    }

    showLoading(loading) {
        const buttons = this.container?.querySelectorAll('#submit-training, #add-training-btn');
        buttons?.forEach(button => {
            button.disabled = loading;
        });
    }
}