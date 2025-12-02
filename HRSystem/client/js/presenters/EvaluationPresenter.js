import { ApiService } from '../services/ApiService.js';
import { Evaluation } from '../models/Evaluation.js';
import { EvaluationView } from '../views/EvaluationView.js';

export class EvaluationPresenter {
    constructor(app) {
        this.app = app;
        this.apiService = new ApiService();
        this.view = new EvaluationView();
        this.evaluations = [];
        this.users = [];
        this.managers = [];
        this.filteredEvaluations = [];
        this.init();
    }

    init() {
        this.view.bindAddEvaluationHandler(() => this.showAddEvaluationForm());
        this.view.bindFilterHandler((employeeId) => this.handleFilter(employeeId));
        this.view.bindEvaluationActionsHandler((action, evaluationId) => this.handleEvaluationAction(action, evaluationId));
    }

    async show() {
        this.view.show();
        await this.loadData();
    }

    async loadData() {
        try {
            this.view.showLoading(true);
            const evaluations = await this.apiService.get('/evaluations');
            this.evaluations = evaluations.map(evalData => Evaluation.fromApiData(evalData));
            this.filteredEvaluations = [...this.evaluations];
            if (this.app.isAdmin() || this.app.isManager()) {
                this.users = await this.apiService.get('/users');
                this.managers = await this.apiService.get('/users/managers');
                this.employees = this.users.filter(user => {
                    const roleName = user.role?.name || user.role;
                    return roleName === 'EMPLOYEE';
                });
            }
            if (this.app.isManager()) {
                const managerEvaluations = await this.apiService.get(`/evaluations/manager/${this.app.currentUser.id}`);
                this.evaluations = managerEvaluations.map(evalData => Evaluation.fromApiData(evalData));
                this.filteredEvaluations = [...this.evaluations];
            }
            this.view.renderEvaluations(this.filteredEvaluations);
            this.view.updateEmployeeFilter(this.employees || this.users);
        } catch (error) {
            this.app.showNotification(error.message, 'error');
            this.view.renderEvaluations([]);
        } finally {
            this.view.showLoading(false);
        }
    }

    handleFilter(employeeId) {
        this.filteredEvaluations = !employeeId ? [...this.evaluations] : 
            this.evaluations.filter(evaluation => evaluation.user?.id == employeeId);
        this.view.renderEvaluations(this.filteredEvaluations);
    }

    showAddEvaluationForm() {
        if (!this.app.isManager()) {
            this.app.showNotification('Только менеджеры могут создавать оценки', 'error');
            return;
        }
    
        const availableUsers = (this.employees || this.users).filter(user => user.id !== this.app.currentUser.id);
        if (availableUsers.length === 0) {
            this.app.showNotification('Нет доступных сотрудников для оценки', 'warning');
            return;
        }
    
        const formHtml = this.view.getEvaluationFormHtml(availableUsers, this.app.currentUser);
        this.app.showModal(formHtml, (form) => this.handleCreateEvaluation(form));
        this.setupKpiPreview();
    }

    async handleCreateEvaluation(form) {
        try {
            const formData = new FormData(form);
            const evaluationData = {
                user: { id: parseInt(formData.get('userId')) },
                manager: { id: this.app.currentUser.id },
                kpiCompletedTasks: parseFloat(formData.get('kpiCompletedTasks')),
                kpiFixTime: parseFloat(formData.get('kpiFixTime')),
                kpiTestCoverage: parseFloat(formData.get('kpiTestCoverage')),
                kpiTimeliness: parseFloat(formData.get('kpiTimeliness')),
                comments: formData.get('comments')
            };
            const evaluation = new Evaluation(evaluationData);
            const validationErrors = evaluation.validate();
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
            evaluation.calculateOverallKpi();
            evaluationData.overallKpi = evaluation.overallKpi;
            const response = await this.apiService.post('/evaluations', evaluationData);
            this.app.showNotification('Оценка успешно создана', 'success');
            this.app.hideModal();
            await this.loadData();
        } catch (error) {
            this.app.showNotification('Ошибка при создании оценки: ' + error.message, 'error');
        }
    }

    async handleEvaluationAction(action, evaluationId) {
        if (this.app.isAdmin() && action !== 'view') {
            this.app.showNotification('Администратор может только просматривать оценки', 'error');
            return;
        }

        switch (action) {
            case 'edit': await this.showEditEvaluationForm(evaluationId); break;
            case 'delete': await this.deleteEvaluation(evaluationId); break;
            case 'view': await this.showEvaluationDetails(evaluationId); break;
        }
    }

    async showEditEvaluationForm(evaluationId) {
        try {
            const evaluation = this.evaluations.find(e => e.evaluationId === evaluationId);
            if (!evaluation) return;

            if (evaluation.manager?.id !== this.app.currentUser.id) {
                this.app.showNotification('Вы можете редактировать только свои оценки', 'error');
                return;
            }

            const formHtml = this.view.getEditEvaluationFormHtml(evaluation);
            this.app.showModal(formHtml, (form) => this.handleUpdateEvaluation(evaluationId, form));
        } catch (error) {
            this.app.showNotification(error.message, 'error');
        }
    }

    async handleUpdateEvaluation(evaluationId, form) {
        try {
            const formData = new FormData(form);
            const originalEvaluation = this.evaluations.find(e => e.evaluationId === evaluationId);
            if (!originalEvaluation) throw new Error('Оценка не найдена');
            
            const evaluationData = {
                user: { id: originalEvaluation.user?.id },
                manager: { id: originalEvaluation.manager?.id },
                kpiCompletedTasks: parseFloat(formData.get('kpiCompletedTasks')),
                kpiFixTime: parseFloat(formData.get('kpiFixTime')),
                kpiTestCoverage: parseFloat(formData.get('kpiTestCoverage')),
                kpiTimeliness: parseFloat(formData.get('kpiTimeliness')),
                comments: formData.get('comments')
            };
            const evaluation = new Evaluation(evaluationData);
            const validationErrors = evaluation.validate();
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
            evaluation.calculateOverallKpi();
            evaluationData.overallKpi = evaluation.overallKpi;
            const response = await this.apiService.put(`/evaluations/${evaluationId}`, evaluationData);
            this.app.showNotification('Оценка успешно обновлена', 'success');
            this.app.hideModal();
            await this.loadData();
        } catch (error) {
            this.app.showNotification('Ошибка при обновлении оценки: ' + error.message, 'error');
        }
    }

    async showEvaluationDetails(evaluationId) {
        try {
            const evaluation = this.evaluations.find(e => e.evaluationId === evaluationId);
            if (!evaluation) return;
    
            const detailsHtml = this.view.getEvaluationDetailsHtml(evaluation);
            this.app.showModal(detailsHtml);
        } catch (error) {
            this.app.showNotification(error.message, 'error');
        }
    }

    async deleteEvaluation(evaluationId) {
        if (!confirm('Вы уверены, что хотите удалить эту оценку?')) return;

        try {
            await this.apiService.delete(`/evaluations/${evaluationId}`);
            this.app.showNotification('Оценка успешно удалена', 'success');
            await this.loadData();
        } catch (error) {
            this.app.showNotification(error.message, 'error');
        }
    }

    setupKpiPreview() {
        window.updateKpiPreview = () => {
            const completedTasks = parseFloat(document.getElementById('eval-completed-tasks')?.value) || 0;
            const fixTime = parseFloat(document.getElementById('eval-fix-time')?.value) || 0;
            const testCoverage = parseFloat(document.getElementById('eval-test-coverage')?.value) || 0;
            const timeliness = parseFloat(document.getElementById('eval-timeliness')?.value) || 0;
            const weights = { completedTasks: 0.4, fixTime: 0.2, testCoverage: 0.2, timeliness: 0.2 };
            const overallKpi = (completedTasks * weights.completedTasks) + (fixTime * weights.fixTime) + 
                             (testCoverage * weights.testCoverage) + (timeliness * weights.timeliness);
            const roundedKpi = Math.round(overallKpi * 100) / 100;
            const previewValue = document.getElementById('kpi-preview-value');
            if (previewValue) previewValue.textContent = roundedKpi;
            let level = 'unknown', levelText = 'Не оценено';
            if (roundedKpi >= 90) { level = 'excellent'; levelText = 'Отлично'; }
            else if (roundedKpi >= 75) { level = 'good'; levelText = 'Хорошо'; }
            else if (roundedKpi >= 60) { level = 'satisfactory'; levelText = 'Удовлетворительно'; }
            else if (roundedKpi >= 40) { level = 'needs_improvement'; levelText = 'Требует улучшения'; }
            else if (roundedKpi > 0) { level = 'poor'; levelText = 'Неудовлетворительно'; }
            const levelElement = document.getElementById('kpi-preview-level');
            if (levelElement) {
                levelElement.textContent = levelText;
                levelElement.className = 'performance-' + level;
            }
        };

        const inputs = document.querySelectorAll('#eval-completed-tasks, #eval-fix-time, #eval-test-coverage, #eval-timeliness');
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', window.updateKpiPreview);
                input.addEventListener('change', window.updateKpiPreview);
            }
        });
        window.updateKpiPreview();
    }
}