import { BaseView } from './BaseView.js';

export class IDPManagerView extends BaseView {
    constructor() {
        super('idp-manager-view');
        this.onCreateTrainingRequest = null;
        this.onEmployeeSelect = null;
    }

    renderIDPManager(employees) {
        const container = this.container?.querySelector('#idp-manager-content');
        if (!container) return;

        container.innerHTML = `
            <div class="idp-manager-container">
                <div class="employee-selection-section">
                    <h3>Выбор сотрудника</h3>
                    <div class="form-group">
                        <label for="idp-employee-select">Сотрудник:</label>
                        <select id="idp-employee-select">
                            <option value="">Выберите сотрудника</option>
                            ${employees.map(employee => `
                                <option value="${employee.id}">
                                    ${employee.firstName} ${employee.lastName} - ${employee.email}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="employee-data-section" id="employee-data-section" style="display: none;">
                </div>
            </div>
        `;
    }

    showEmployeeData(employee, evaluations, recommendedCourses, trainingRequests) {
        const section = this.container?.querySelector('#employee-data-section');
        if (!section) return;

        const latestEvaluation = evaluations.length > 0 
            ? evaluations.sort((a, b) => new Date(b.evaluationDate) - new Date(a.evaluationDate))[0]
            : null;

        section.innerHTML = `
            <div class="employee-overview">
                <h3>Данные сотрудника: ${employee.firstName} ${employee.lastName}</h3>
                <div class="employee-info">
                    <p><strong>Email:</strong> ${employee.email}</p>
                    <p><strong>Всего оценок:</strong> ${evaluations.length}</p>
                    ${latestEvaluation ? `
                        <p><strong>Последняя оценка:</strong> ${new Date(latestEvaluation.evaluationDate).toLocaleDateString('ru-RU')}</p>
                        <p><strong>Текущий KPI:</strong> <span class="performance-${latestEvaluation.getPerformanceLevel()}">
                            ${latestEvaluation.overallKpi?.toFixed(2)}% - ${latestEvaluation.getPerformanceText()}
                        </span></p>
                    ` : ''}
                </div>
            </div>

            <div class="evaluations-section">
                <h4>История оценок KPI</h4>
                ${this.renderEvaluationsTable(evaluations)}
            </div>

            <div class="recommendations-section">
                <h4>Рекомендации по обучению</h4>
                ${this.renderRecommendedCourses(recommendedCourses)}
            </div>

            <div class="training-requests-section">
                <h4>Заявки на обучение</h4>
                ${this.renderTrainingRequests(trainingRequests)}
            </div>
        `;
        section.style.display = 'block';
        section.querySelectorAll('.use-recommendation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseName = e.target.dataset.courseName;
                const courseData = {
                    courseName: courseName,
                    comments: 'Рекомендовано системой на основе оценок KPI'
                };
                if (this.onCreateTrainingRequest) this.onCreateTrainingRequest(courseData);
            });
        });
    }

    renderEvaluationsTable(evaluations) {
        if (evaluations.length === 0) return '<p class="no-data">Нет данных об оценках</p>';

        const sortedEvaluations = [...evaluations].sort((a, b) => new Date(b.evaluationDate) - new Date(a.evaluationDate));

        return `
            <div class="table-container">
                <table class="evaluations-table">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Общий KPI</th>
                            <th>Уровень</th>
                            <th>Задачи</th>
                            <th>Исправления</th>
                            <th>Тесты</th>
                            <th>Сроки</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedEvaluations.map(evaluation => `
                            <tr>
                                <td>${new Date(evaluation.evaluationDate).toLocaleDateString('ru-RU')}</td>
                                <td class="kpi-value">${evaluation.overallKpi?.toFixed(2)}%</td>
                                <td>
                                    <span class="performance-${evaluation.getPerformanceLevel()}">
                                        ${evaluation.getPerformanceText()}
                                    </span>
                                </td>
                                <td>${evaluation.kpiCompletedTasks}%</td>
                                <td>${evaluation.kpiFixTime}%</td>
                                <td>${evaluation.kpiTestCoverage}%</td>
                                <td>${evaluation.kpiTimeliness}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderRecommendedCourses(recommendedCourses) {
        if (recommendedCourses.length === 0) return '<p class="no-data">Нет рекомендаций по обучению на основе текущих оценок</p>';

        return `
            <div class="recommended-courses-list">
                ${recommendedCourses.map(course => `
                    <div class="course-recommendation priority-${course.priority}">
                        <div class="course-info">
                            <h5>${course.courseName}</h5>
                            <p class="recommendation-reason">${course.reason}</p>
                        </div>
                        <button class="btn btn-primary btn-sm use-recommendation-btn" 
                                data-course-name="${course.courseName}">
                            Создать заявку
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTrainingRequests(trainingRequests) {
        if (trainingRequests.length === 0) return '<p class="no-data">Нет активных заявок на обучение</p>';

        return `
            <div class="training-requests-list">
                ${trainingRequests.map(request => `
                    <div class="training-request-item status-${request.status?.toLowerCase()}">
                        <div class="request-info">
                            <h5>${request.courseName}</h5>
                            <div class="request-meta">
                                <span class="request-status">${this.getStatusText(request.status)}</span>
                                <span class="request-date">${new Date(request.submittedAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                            ${request.comments ? `<p class="request-comments">${request.comments}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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

    bindEmployeeSelectHandler(handler) {
        this.onEmployeeSelect = handler;
        const select = this.container?.querySelector('#idp-employee-select');
        if (select && handler) {
            select.replaceWith(select.cloneNode(true));
            const newSelect = this.container?.querySelector('#idp-employee-select');
            newSelect.addEventListener('change', (e) => handler(e.target.value));
        }
    }

    bindCreateTrainingRequestHandler(handler) {
        this.onCreateTrainingRequest = handler;
    }

    hideEmployeeData() {
        const section = this.container?.querySelector('#employee-data-section');
        if (section) section.style.display = 'none';
    }

    showLoading(loading) {
        const container = this.container?.querySelector('#idp-manager-content');
        if (container) loading ? container.classList.add('loading') : container.classList.remove('loading');
    }

    resetCourseForm() {
    }
}