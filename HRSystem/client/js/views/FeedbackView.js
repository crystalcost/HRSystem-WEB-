import { BaseView } from './BaseView.js';

export class FeedbackView extends BaseView {
    constructor() {
        super('feedback-view');
    }

    renderFeedback(feedbackList) {
        const tbody = this.container?.querySelector('#feedback-tbody');
        if (!tbody) return;
        if (feedbackList.length === 0) {
            tbody.innerHTML = this.getEmptyStateTemplate('💬', 'Отзывы не найдены');
            return;
        }
        tbody.innerHTML = feedbackList.map(feedback => `
            <tr>
                <td>${feedback.feedbackId}</td>
                <td>
                    <div class="evaluation-info">
                        <div class="evaluation-id">Оценка #${feedback.evaluation?.evaluationId}</div>
                        <div class="kpi">KPI: ${feedback.evaluation?.overallKpi?.toFixed(2)}%</div>
                        <div class="user">Сотрудник: ${feedback.evaluation?.user?.firstName} ${feedback.evaluation?.user?.lastName}</div>
                    </div>
                </td>
                <td>
                    <div class="feedback-text">
                        <div class="preview">${feedback.preview || feedback.feedbackText}</div>
                    </div>
                </td>
                <td>${feedback.createdAtFormatted || new Date(feedback.createdAt).toLocaleDateString('ru-RU')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" data-action="view" data-feedback-id="${feedback.feedbackId}">
                            Просмотр
                        </button>
                        ${this.shouldShowEditButton(feedback) ? `
                            <button class="btn btn-secondary btn-sm" data-action="edit" data-feedback-id="${feedback.feedbackId}">
                                Редактировать
                            </button>
                        ` : ''}
                        ${this.shouldShowDeleteButton(feedback) ? `
                            <button class="btn btn-danger btn-sm" data-action="delete" data-feedback-id="${feedback.feedbackId}">
                                Удалить
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    shouldShowEditButton(feedback) {
        const app = window.app;
        if (!app || !app.currentUser) return false;
        if (app.isEmployee()) return feedback.evaluation?.user?.id === app.currentUser.id;
        return false;
    }

    shouldShowDeleteButton(feedback) {
        const app = window.app;
        if (!app || !app.currentUser) return false;
        if (app.isAdmin()) return true;
        if (app.isManager()) return feedback.evaluation?.manager?.id === app.currentUser.id;
        if (app.isEmployee()) return feedback.evaluation?.user?.id === app.currentUser.id;
        return false;
    }

    bindAddFeedbackHandler(handler) {
        this.bindEvent('#add-feedback-btn', 'click', handler);
    }

    bindFilterHandler(handler) {
        this.bindEvent('#evaluation-filter', 'change', (e) => handler(e.target.value));
    }

    bindFeedbackActionsHandler(handler) {
        this.bindDelegate('[data-action]', 'click', (e, button) => {
            const action = button.dataset.action;
            const feedbackId = parseInt(button.dataset.feedbackId);
            if (action && feedbackId) handler(action, feedbackId);
        });
    }

    updateEvaluationFilter(evaluations, selectedId = '') {
        const filter = this.container?.querySelector('#evaluation-filter');
        if (!filter) return;

        filter.innerHTML = '<option value="">Все оценки</option>' +
            evaluations.map(evaluation => 
                `<option value="${evaluation.evaluationId}" ${evaluation.evaluationId == selectedId ? 'selected' : ''}>
                    Оценка #${evaluation.evaluationId} - ${evaluation.user?.firstName} ${evaluation.user?.lastName} (${evaluation.overallKpi?.toFixed(2)}%)
                </option>`
            ).join('');
    }

    getEmptyStateTemplate(icon, message) {
        return `
            <tr>
                <td colspan="5" class="empty-state">
                    <div class="icon">
                        <img src="resources/images/feedback.png" alt="Отзывы" class="empty-icon"
                             onerror="this.style.display='none'; this.parentNode.innerHTML='${icon}'">
                    </div>
                    <h3>${message}</h3>
                    <p>Начните с добавления первого отзыва</p>
                </td>
            </tr>
        `;
    }

    showLoading(loading) {
        const table = this.container?.querySelector('.table-container');
        if (table) table.classList.toggle('loading', loading);
    }

    getFeedbackFormHtml(evaluations) {
        return `
            <h2>Добавить отзыв на оценку</h2>
            <form id="feedback-form">
                <div class="form-group">
                    <label for="feedback-evaluation">Оценка:</label>
                    <select id="feedback-evaluation" name="evaluationId" required>
                        <option value="">Выберите оценку</option>
                        ${evaluations.map(evaluation => 
                            `<option value="${evaluation.evaluationId}">
                                Оценка #${evaluation.evaluationId} - KPI: ${evaluation.overallKpi?.toFixed(2)}% (${new Date(evaluation.evaluationDate).toLocaleDateString('ru-RU')})
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="feedback-text">Текст отзыва:</label>
                    <textarea id="feedback-text" name="feedbackText" rows="6" maxlength="1000" required 
                              placeholder="Введите ваш отзыв здесь..."></textarea>
                    <div class="char-counter">
                        <span id="char-count">0</span>/1000 символов
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Добавить отзыв</button>
                    <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Отмена</button>
                </div>
            </form>
        `;
    }

    getEditFeedbackFormHtml(feedback) {
        return `
            <h2>Редактировать отзыв</h2>
            <form id="feedback-form">
                <div class="form-group">
                    <label>Оценка:</label>
                    <input type="text" value="Оценка #${feedback.evaluation?.evaluationId} - KPI: ${feedback.evaluation?.overallKpi?.toFixed(2)}%" readonly 
                           style="background-color: #f8f9fa; cursor: not-allowed;">
                </div>
                <div class="form-group">
                    <label for="feedback-text">Текст отзыва:</label>
                    <textarea id="feedback-text" name="feedbackText" rows="6" maxlength="1000" required 
                              placeholder="Введите ваш отзыв здесь...">${feedback.feedbackText}</textarea>
                    <div class="char-counter">
                        <span id="char-count">${feedback.feedbackText.length}</span>/1000 символов
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                    <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Отмена</button>
                </div>
            </form>
        `;
    }

    getFeedbackDetailsHtml(feedback, hasAccess) {
        const canEdit = window.app.isEmployee() && hasAccess;
        const canDelete = hasAccess;
        const editButton = canEdit ? `
            <button class="btn btn-secondary btn-sm" onclick="app.presenters.feedback.showEditFeedbackForm(${feedback.feedbackId})">
                Редактировать
            </button>
        ` : '';
        const deleteButton = canDelete ? `
            <button class="btn btn-danger btn-sm" onclick="app.presenters.feedback.deleteFeedback(${feedback.feedbackId})">
                Удалить
            </button>
        ` : '';

        return `
            <h2>Детали отзыва #${feedback.feedbackId}</h2>
            <div class="modal-scroll-container" style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
                <div class="feedback-details">
                    <div class="detail-section">
                        <h3>Информация об оценке</h3>
                        <p><strong>Оценка #:</strong> ${feedback.evaluation?.evaluationId}</p>
                        <p><strong>Сотрудник:</strong> ${feedback.evaluation?.user?.firstName} ${feedback.evaluation?.user?.lastName}</p>
                        <p><strong>Менеджер:</strong> ${feedback.evaluation?.manager?.firstName} ${feedback.evaluation?.manager?.lastName}</p>
                        <p><strong>Общий KPI:</strong> ${feedback.evaluation?.overallKpi?.toFixed(2)}%</p>
                        <h3>Текст отзыва</h3>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; border: 1px solid #dee2e6; margin: 0.5rem 0;">
                            ${feedback.feedbackText}
                        </div>
                        <div class="feedback-meta" style="margin-top: 1rem;">
                            <span class="word-count" style="color: #6c757d;">
                                ${feedback.feedbackText.split(' ').length} сл.
                            </span>
                        </div>
                        <p><strong>Дата создания:</strong> ${feedback.createdAtFormatted || new Date(feedback.createdAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                    
                    <div class="action-buttons" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        ${editButton}
                        ${deleteButton}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Закрыть</button>
                </div>
            </div>
        `;
    }
}