import { BaseView } from './BaseView.js';

export class EvaluationView extends BaseView {
    constructor() {
        super('evaluations-view');
    }

    initialize() {
    }

    renderEvaluations(evaluations) {
        const tbody = this.container?.querySelector('#evaluations-tbody');
        if (!tbody) return;
    
        if (evaluations.length === 0) {
            tbody.innerHTML = this.getEmptyStateTemplate('📊', 'Оценки не найдены');
            return;
        }
    
        tbody.innerHTML = evaluations.map(evaluation => `
            <tr>
                <td>${evaluation.evaluationId}</td>
                <td>
                    <div class="user-info">
                        <div class="username">${evaluation.user?.firstName || ''} ${evaluation.user?.lastName || ''}</div>
                    </div>
                </td>
                <td>
                    <div class="user-info">
                        <div class="username">${evaluation.manager?.firstName || ''} ${evaluation.manager?.lastName || ''}</div>
                    </div>
                </td>
                <td>
                    <span class="performance-${evaluation.performanceLevel || this.getPerformanceLevel(evaluation.overallKpi)}">
                        ${evaluation.overallKpiFormatted || evaluation.overallKpi?.toFixed(2) + '%' || 'N/A'}
                    </span>
                </td>
                <td>${evaluation.evaluationDateFormatted || new Date(evaluation.evaluationDate).toLocaleDateString('ru-RU')}</td>
                <td>
                    <div class="action-buttons">
                        ${this.shouldShowEditButton(evaluation) ? `
                            <button class="btn btn-secondary btn-sm" data-action="edit" data-evaluation-id="${evaluation.evaluationId}">
                                ✏️ Редактировать
                            </button>
                        ` : ''}
                        ${this.shouldShowDeleteButton(evaluation) ? `
                            <button class="btn btn-danger btn-sm" data-action="delete" data-evaluation-id="${evaluation.evaluationId}">
                                🗑️ Удалить
                            </button>
                        ` : ''}
                        <button class="btn btn-primary btn-sm" data-action="view" data-evaluation-id="${evaluation.evaluationId}">
                            👁️ Просмотр
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    shouldShowEditButton(evaluation) {
        const app = window.app;
        if (!app || !app.currentUser) return false;
        
        return app.isManager() && evaluation.manager?.id === app.currentUser.id;
    }

    shouldShowDeleteButton(evaluation) {
        const app = window.app;
        if (!app || !app.currentUser) return false;
        
        return app.isManager() && evaluation.manager?.id === app.currentUser.id;
    }

    getPerformanceLevel(kpi) {
        if (!kpi) return 'unknown';
        if (kpi >= 90) return 'excellent';
        if (kpi >= 75) return 'good';
        if (kpi >= 60) return 'satisfactory';
        if (kpi >= 40) return 'needs_improvement';
        return 'poor';
    }

    getPerformanceText(level) {
        const texts = {
            'excellent': 'Отлично',
            'good': 'Хорошо',
            'satisfactory': 'Удовлетворительно',
            'needs_improvement': 'Требует улучшения',
            'poor': 'Неудовлетворительно',
            'unknown': 'Не оценено'
        };
        return texts[level] || level;
    }

    bindAddEvaluationHandler(handler) {
        this.bindEvent('#add-evaluation-btn', 'click', handler);
    }

    bindFilterHandler(handler) {
        this.bindEvent('#employee-filter', 'change', (e) => {
            handler(e.target.value);
        });
    }

    bindEvaluationActionsHandler(handler) {
        this.bindDelegate('[data-action]', 'click', (e, button) => {
            const action = button.dataset.action;
            const evaluationId = parseInt(button.dataset.evaluationId);
            
            if (action && evaluationId) {
                handler(action, evaluationId);
            }
        });
    }

    updateEmployeeFilter(employees, selectedId = '') {
        const filter = this.container?.querySelector('#employee-filter');
        if (!filter) return;
    
        const employeesOnly = employees.filter(user => {
            const roleName = user.role?.name || user.role;
            return roleName === 'EMPLOYEE';
        });
    
        console.log('🔍 Employees for filter:', employeesOnly);
    
        filter.innerHTML = '<option value="">Все сотрудники</option>' +
            employeesOnly.map(employee => 
                `<option value="${employee.id}" ${employee.id == selectedId ? 'selected' : ''}>
                    ${employee.firstName} ${employee.lastName}
                </option>`
            ).join('');
    }

    getEmptyStateTemplate(icon, message) {
        return `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="icon">${icon}</div>
                    <h3>${message}</h3>
                    <p>Начните с добавления первой оценки</p>
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