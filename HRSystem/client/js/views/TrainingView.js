import { BaseView } from './BaseView.js';

export class TrainingView extends BaseView {
    constructor() {
        super('training-view');
    }

    renderRequests(requests, isManagerOrAdmin = false) {
        const tbody = this.container?.querySelector('#training-tbody');
        if (!tbody) return;
        const addButton = this.container?.querySelector('#add-training-btn');
        if (addButton) addButton.style.display = isManagerOrAdmin ? 'none' : 'block';
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
                    </div>
                </td>
                <td>
                    <div class="user-info">
                        <div class="username">${request.user?.firstName || 'Не указан'} ${request.user?.lastName || ''}</div>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${request.status?.toLowerCase()}">
                        ${this.getStatusText(request.status)}
                    </span>
                </td>
                <td>${request.submittedAtFormatted || new Date(request.submittedAt).toLocaleDateString('ru-RU')}</td>
                <td>${this.calculateDurationDescription(request.submittedAt)}</td>
                <td>
                    <div class="action-buttons">
                        ${request.canViewDetails !== false ? `
                            <button class="btn btn-primary btn-sm" data-action="view" data-request-id="${request.requestId}">
                                Просмотр
                            </button>
                        ` : ''}
                        ${request.user?.id === window.app?.currentUser?.id && request.status === 'PENDING' ? `
                            <button class="btn btn-danger btn-sm" data-action="cancel" data-request-id="${request.requestId}">
                                Отменить
                            </button>
                        ` : ''}
                        ${(isManagerOrAdmin && request.status === 'PENDING') ? `
                            <button class="btn btn-success btn-sm" data-action="approve" data-request-id="${request.requestId}">
                                Одобрить
                            </button>
                            <button class="btn btn-warning btn-sm" data-action="deny" data-request-id="${request.requestId}">
                                Отклонить
                            </button>
                        ` : ''}
                        ${(isManagerOrAdmin && (request.status === 'APPROVED' || request.status === 'DENIED' || request.status === 'COMPLETED')) ? `
                            <button class="btn btn-danger btn-sm" data-action="delete" data-request-id="${request.requestId}">
                                Удалить
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
            const requestData = { courseName: courseInput.value.trim() };
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
            if (action && requestId) handler(action, requestId);
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
                    <div class="icon">
                        <img src="resources/images/training.png" alt="Заявки на обучение" class="empty-icon"
                             onerror="this.style.display='none'; this.parentNode.innerHTML='${icon}'">
                    </div>
                    <h3>${message}</h3>
                    <p>Начните с подачи первой заявки на обучение</p>
                </td>
            </tr>
        `;
    }

    showLoading(loading) {
        const buttons = this.container?.querySelectorAll('#submit-training, #add-training-btn');
        buttons?.forEach(button => { button.disabled = loading; });
    }

    getStatusText(status) {
        const statusMap = {
            'PENDING': 'На рассмотрении',
            'APPROVED': 'Одобрено',
            'DENIED': 'Отклонено',
            'CANCELLED': 'Отменено',
            'COMPLETED': 'Завершено'
        };
        return statusMap[status] || status;
    }

    calculateDurationDescription(submittedAt) {
        if (!submittedAt) return 'Н/Д';
        try {
            const submittedDate = new Date(submittedAt);
            const now = new Date();
            const diffTime = Math.abs(now - submittedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) return '1 дн.';
            if (diffDays < 7) return `${diffDays} дн.`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед.`;
            return `${Math.floor(diffDays / 30)} мес.`;
        } catch (error) {
            return 'Н/Д';
        }
    }

    getRequestDetailsHtml(request, app) {
        const canManage = (app.isAdmin() || app.isManager()) && request.status === 'PENDING';
        const canCancel = request.user?.id === app.currentUser.id && request.status === 'PENDING';
        const canDelete = (request.status === 'APPROVED' || request.status === 'DENIED' || request.status === 'COMPLETED') && 
            (app.isAdmin() || app.isManager());
        const statusActions = canManage ? `
            <div class="action-buttons" style="margin: 15px 0; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-success btn-sm" onclick="app.presenters.training.updateRequestStatus(${request.requestId}, 'APPROVED')">
                    Одобрить
                </button>
                <button class="btn btn-warning btn-sm" onclick="app.presenters.training.updateRequestStatus(${request.requestId}, 'DENIED')">
                    Отклонить
                </button>
            </div>
        ` : '';
    
        const userActions = (canCancel || canDelete) ? `
            <div class="action-buttons" style="margin: 10px 0; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${canCancel ? `
                    <button class="btn btn-danger btn-sm" onclick="app.presenters.training.cancelRequest(${request.requestId})">
                        Отменить заявку
                    </button>
                ` : ''}
                ${canDelete ? `
                    <button class="btn btn-danger btn-sm" onclick="app.presenters.training.deleteRequest(${request.requestId})">
                        Удалить заявку
                    </button>
                ` : ''}
            </div>
        ` : '';
    
        const pendingWarning = request.status === 'PENDING' && this.calculateDaysSince(request.submittedAt) > 7 ? `
            <div class="detail-section warning">
                <div class="warning-header">
                    <img src="resources/images/warning.png" alt="Внимание" class="warning-icon">
                    <h3>Внимание</h3>
                </div>
                <p>Эта заявка находится на рассмотрении более 7 дней.</p>
            </div>
        ` : '';
        return `
            <h2>Детали заявки на обучение #${request.requestId}</h2>
            <div class="request-details">
                <div class="detail-section">
                    <h3>Информация о заявке</h3>
                    <p><strong>Курс:</strong> ${request.courseName}</p>
                    <p><strong>Статус:</strong> 
                        <span class="status-badge status-${request.status?.toLowerCase()}">
                            ${this.getStatusText(request.status)}
                        </span>
                    </p>
                </div>
                <div class="detail-section">
                    <h3>Информация о сотруднике</h3>
                    <p><strong>Сотрудник:</strong> ${request.user?.firstName || 'Не указан'} ${request.user?.lastName || ''}</p>
                    <p><strong>Email:</strong> ${request.user?.email || 'Не указан'}</p>
                    <p><strong>Роль:</strong> ${request.user?.role?.name || 'Не указана'}</p>
                </div>
                <div class="detail-section">
                    <h3>Временные метки</h3>
                    <p><strong>Дата подачи:</strong> ${request.submittedAtFormatted || new Date(request.submittedAt).toLocaleDateString('ru-RU')}</p>
                    <p><strong>Длительность рассмотрения:</strong> ${this.calculateDurationDescription(request.submittedAt)}</p>
                </div>
                ${pendingWarning}
                ${statusActions}
                ${userActions}
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Закрыть</button>
            </div>
        `;
    }

    calculateDaysSince(submittedAt) {
        if (!submittedAt) return 0;
        try {
            const submittedDate = new Date(submittedAt);
            const now = new Date();
            const diffTime = Math.abs(now - submittedDate);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            return 0;
        }
    }
}