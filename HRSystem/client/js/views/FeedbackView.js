import { BaseView } from './BaseView.js';

export class FeedbackView extends BaseView {
    constructor() {
        super('feedback-view');
    }

    initialize() {
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
                            👁️ Просмотр
                        </button>
                        ${this.shouldShowEditButton(feedback) ? `
                            <button class="btn btn-secondary btn-sm" data-action="edit" data-feedback-id="${feedback.feedbackId}">
                                ✏️ Редактировать
                            </button>
                        ` : ''}
                        ${this.shouldShowDeleteButton(feedback) ? `
                            <button class="btn btn-danger btn-sm" data-action="delete" data-feedback-id="${feedback.feedbackId}">
                                🗑️ Удалить
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
        
        if (app.isEmployee()) {
            return feedback.evaluation?.user?.id === app.currentUser.id;
        }
        
        return false;
    }

    shouldShowDeleteButton(feedback) {
        const app = window.app;
        if (!app || !app.currentUser) return false;
        
        if (app.isAdmin()) {
            return true;
        }
        
        if (app.isManager()) {
            const managerId = feedback.evaluation?.manager?.id;
            
            return managerId == app.currentUser.id;
        }
        
        if (app.isEmployee()) {
            const userId = feedback.evaluation?.user?.id;
            
            return userId == app.currentUser.id;
        }
        
        return false;
    }

    bindAddFeedbackHandler(handler) {
        this.bindEvent('#add-feedback-btn', 'click', handler);
    }

    bindFilterHandler(handler) {
        this.bindEvent('#evaluation-filter', 'change', (e) => {
            handler(e.target.value);
        });
    }

    bindFeedbackActionsHandler(handler) {
        this.bindDelegate('[data-action]', 'click', (e, button) => {
            const action = button.dataset.action;
            const feedbackId = parseInt(button.dataset.feedbackId);
            
            if (action && feedbackId) {
                handler(action, feedbackId);
            }
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
                    <div class="icon">${icon}</div>
                    <h3>${message}</h3>
                    <p>Начните с добавления первого отзыва</p>
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
}