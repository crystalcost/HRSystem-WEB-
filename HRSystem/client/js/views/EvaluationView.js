import { BaseView } from './BaseView.js';

export class EvaluationView extends BaseView {
    constructor() {
        super('evaluations-view');
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
                                Редактировать
                            </button>
                        ` : ''}
                        ${this.shouldShowDeleteButton(evaluation) ? `
                            <button class="btn btn-danger btn-sm" data-action="delete" data-evaluation-id="${evaluation.evaluationId}">
                                Удалить
                            </button>
                        ` : ''}
                        <button class="btn btn-primary btn-sm" data-action="view" data-evaluation-id="${evaluation.evaluationId}">
                            Просмотр
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

    bindAddEvaluationHandler(handler) {
        this.bindEvent('#add-evaluation-btn', 'click', handler);
    }

    bindFilterHandler(handler) {
        this.bindEvent('#employee-filter', 'change', (e) => handler(e.target.value));
    }

    bindEvaluationActionsHandler(handler) {
        this.bindDelegate('[data-action]', 'click', (e, button) => {
            const action = button.dataset.action;
            const evaluationId = parseInt(button.dataset.evaluationId);
            if (action && evaluationId) handler(action, evaluationId);
        });
    }

    updateEmployeeFilter(employees, selectedId = '') {
        const filter = this.container?.querySelector('#employee-filter');
        if (!filter) return;
    
        const employeesOnly = employees.filter(user => {
            const roleName = user.role?.name || user.role;
            return roleName === 'EMPLOYEE';
        });
    
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
                    <div class="icon">
                        <img src="resources/images/eval.png" alt="Оценки сотрудников" class="empty-icon"
                             onerror="this.style.display='none'; this.parentNode.innerHTML='${icon}'">
                    </div>
                    <h3>${message}</h3>
                    <p>Начните с добавления первой оценки</p>
                </td>
            </tr>
        `;
    }

    showLoading(loading) {
        const table = this.container?.querySelector('.table-container');
        if (table) table.classList.toggle('loading', loading);
    }

    getEvaluationFormHtml(availableUsers, currentUser) {
        return `
            <h2>Добавить оценку</h2>
            <div class="modal-scroll-container" style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
                <form id="evaluation-form">
                    <div class="form-group">
                        <label for="eval-user">Сотрудник:</label>
                        <select id="eval-user" name="userId" required>
                            <option value="">Выберите сотрудника</option>
                            ${availableUsers.map(user => 
                                `<option value="${user.id}">
                                    ${user.firstName} ${user.lastName} (${user.email})
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="eval-manager">Менеджер:</label>
                        <input type="text" id="eval-manager" value="${currentUser.username}" readonly 
                               style="background-color: #f8f9fa; cursor: not-allowed;">
                        <input type="hidden" name="managerId" value="${currentUser.id}">
                        <small class="form-text" style="color: #6c757d; font-size: 0.8rem;">
                            Вы оцениваете как менеджер
                        </small>
                    </div>
                    
                    <div class="kpi-section" style="border: 1px solid #e9ecef; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <h4 style="margin-top: 0; color: var(--primary-color);">Показатели KPI</h4>
                        
                        <div class="form-group">
                            <label for="eval-completed-tasks">KPI выполненных задач (0-100):</label>
                            <input type="number" id="eval-completed-tasks" name="kpiCompletedTasks" 
                                   min="0" max="100" value="0" required
                                   oninput="window.updateKpiPreview && window.updateKpiPreview()">
                            <div class="kpi-preview" style="margin-top: 0.5rem;"><small>Вес: 40%</small></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="eval-fix-time">KPI времени исправлений (0-100):</label>
                            <input type="number" id="eval-fix-time" name="kpiFixTime" 
                                   min="0" max="100" value="0" required
                                   oninput="window.updateKpiPreview && window.updateKpiPreview()">
                            <div class="kpi-preview" style="margin-top: 0.5rem;"><small>Вес: 20%</small></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="eval-test-coverage">KPI тестового покрытия (0-100):</label>
                            <input type="number" id="eval-test-coverage" name="kpiTestCoverage" 
                                   min="0" max="100" value="0" required
                                   oninput="window.updateKpiPreview && window.updateKpiPreview()">
                            <div class="kpi-preview" style="margin-top: 0.5rem;"><small>Вес: 20%</small></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="eval-timeliness">KPI соблюдения сроков (0-100):</label>
                            <input type="number" id="eval-timeliness" name="kpiTimeliness" 
                                   min="0" max="100" value="0" required
                                   oninput="window.updateKpiPreview && window.updateKpiPreview()">
                            <div class="kpi-preview" style="margin-top: 0.5rem;"><small>Вес: 20%</small></div>
                        </div>
                        
                        <div class="overall-kpi-preview" style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
                            <strong>Предварительный общий KPI: <span id="kpi-preview-value">0</span>%</strong>
                            <div id="kpi-preview-level" style="font-size: 0.9rem; color: #6c757d;">Не оценено</div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="eval-comments">Комментарии:</label>
                        <textarea id="eval-comments" name="comments" rows="4" 
                                  placeholder="Добавьте комментарии к оценке..."></textarea>
                    </div>
                    
                    <div class="form-actions" style="position: sticky; bottom: 0; background: white; padding-top: 1rem; border-top: 1px solid #e9ecef;">
                        <button type="submit" class="btn btn-primary">Создать оценку</button>
                        <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Отмена</button>
                    </div>
                </form>
            </div>
        `;
    }

    getEvaluationDetailsHtml(evaluation) {
        const evaluationDate = evaluation.evaluationDate ? 
            new Date(evaluation.evaluationDate).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Дата не указана';

        return `
            <h2>Детали оценки #${evaluation.evaluationId}</h2>
            <div class="modal-scroll-container" style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
                <div class="evaluation-details">
                    <div class="detail-section">
                        <h3>Информация о сотруднике</h3>
                        <p><strong>Сотрудник:</strong> ${evaluation.user?.firstName} ${evaluation.user?.lastName}</p>
                        <p><strong>Username:</strong> ${evaluation.user?.username}</p>
                        <p><strong>Email:</strong> ${evaluation.user?.email}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Информация о менеджере</h3>
                        <p><strong>Менеджер:</strong> ${evaluation.manager?.firstName} ${evaluation.manager?.lastName}</p>
                        <p><strong>Username:</strong> ${evaluation.manager?.username}</p>
                        <p><strong>Email:</strong> ${evaluation.manager?.email}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Показатели KPI</h3>
                        <div class="kpi-breakdown">
                            <div class="kpi-item">
                                <span class="kpi-label">Выполненные задачи:</span>
                                <span class="kpi-value">${evaluation.kpiCompletedTasks}%</span>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Время исправлений:</span>
                                <span class="kpi-value">${evaluation.kpiFixTime}%</span>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Тестовое покрытие:</span>
                                <span class="kpi-value">${evaluation.kpiTestCoverage}%</span>
                            </div>
                            <div class="kpi-item">
                                <span class="kpi-label">Соблюдение сроков:</span>
                                <span class="kpi-value">${evaluation.kpiTimeliness}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Общая оценка</h3>
                        <div class="overall-kpi performance-${evaluation.getPerformanceLevel()}">
                            <strong>Общий KPI: ${evaluation.overallKpi?.toFixed(2)}%</strong>
                            <div>${evaluation.getPerformanceText()}</div>
                        </div>
                    </div>
                    
                    ${evaluation.comments ? `
                    <div class="detail-section">
                        <h3>Комментарии</h3>
                        <p style="background: #f8f9fa; padding: 1rem; border-radius: 6px; white-space: pre-wrap;">${evaluation.comments}</p>
                    </div>
                    ` : ''}
                    
                    <div class="detail-section">
                        <p><strong>Дата оценки:</strong> ${evaluationDate}</p>
                    </div>
                </div>
                
                <div class="form-actions" style="position: sticky; bottom: 0; background: white; padding-top: 1rem; border-top: 1px solid #e9ecef;">
                    <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Закрыть</button>
                </div>
            </div>
        `;
    }

    getEditEvaluationFormHtml(evaluation) {
        return `
            <h2>Редактировать оценку</h2>
            <div class="modal-scroll-container" style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
                <form id="evaluation-form">
                    <div class="form-group">
                        <label>Сотрудник:</label>
                        <input type="text" value="${evaluation.user?.firstName} ${evaluation.user?.lastName}" readonly 
                               style="background-color: #f8f9fa; cursor: not-allowed;">
                    </div>
                    
                    <div class="form-group">
                        <label>Менеджер:</label>
                        <input type="text" value="${evaluation.manager?.username}" readonly 
                               style="background-color: #f8f9fa; cursor: not-allowed;">
                    </div>
                    
                    <div class="kpi-section" style="border: 1px solid #e9ecef; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <h4 style="margin-top: 0; color: var(--primary-color);">Показатели KPI</h4>
                        
                        <div class="form-group">
                            <label for="eval-completed-tasks">KPI выполненных задач (0-100):</label>
                            <input type="number" id="eval-completed-tasks" name="kpiCompletedTasks" 
                                   min="0" max="100" value="${evaluation.kpiCompletedTasks}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="eval-fix-time">KPI времени исправлений (0-100):</label>
                            <input type="number" id="eval-fix-time" name="kpiFixTime" 
                                   min="0" max="100" value="${evaluation.kpiFixTime}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="eval-test-coverage">KPI тестового покрытия (0-100):</label>
                            <input type="number" id="eval-test-coverage" name="kpiTestCoverage" 
                                   min="0" max="100" value="${evaluation.kpiTestCoverage}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="eval-timeliness">KPI соблюдения сроков (0-100):</label>
                            <input type="number" id="eval-timeliness" name="kpiTimeliness" 
                                   min="0" max="100" value="${evaluation.kpiTimeliness}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="eval-comments">Комментарии:</label>
                        <textarea id="eval-comments" name="comments" rows="4">${evaluation.comments || ''}</textarea>
                    </div>
                    
                    <div class="current-kpi" style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                        <strong>Текущий общий KPI: ${evaluation.overallKpi?.toFixed(2)}%</strong>
                        <div class="performance-${evaluation.getPerformanceLevel()}">
                            ${evaluation.getPerformanceText()}
                        </div>
                    </div>
                    
                    <div class="form-actions" style="position: sticky; bottom: 0; background: white; padding-top: 1rem; border-top: 1px solid #e9ecef;">
                        <button type="submit" class="btn btn-primary">Сохранить</button>
                        <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Отмена</button>
                    </div>
                </form>
            </div>
        `;
    }
}