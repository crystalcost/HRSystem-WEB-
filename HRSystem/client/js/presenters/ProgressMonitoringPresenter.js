import { ApiService } from '../services/ApiService.js';
import { Evaluation } from '../models/Evaluation.js';
import { ProgressMonitoringView } from '../views/ProgressMonitoringView.js';

export class ProgressMonitoringPresenter {
    constructor(app) {
        this.app = app;
        this.apiService = new ApiService();
        this.view = new ProgressMonitoringView();
        this.employees = [];
        this.evaluations = [];
        this.currentEmployeeId = null;
    }

    async show() {
        this.view.show();
        await this.loadData();
        this.bindHandlers();
    }

    hide() {
        this.view.hide();
    }

    onViewShow() {
        this.loadData();
    }

    bindHandlers() {
        this.view.bindEmployeeSelectHandler((employeeId) => this.handleEmployeeSelect(employeeId));
        this.view.bindProgressChartHandler(() => this.showProgressChart());
    }

    async loadData() {
        try {
            this.view.showLoading(true);

            
            const managerEvaluations = await this.apiService.get(`/evaluations/manager/${this.app.currentUser.id}`);
            
            
            const employeeIds = [...new Set(managerEvaluations
                .map(evaluation => evaluation.user?.id)
                .filter(id => id && id !== this.app.currentUser.id)
            )];
            
            
            this.employees = [];
            for (const employeeId of employeeIds) {
                try {
                    const employee = await this.apiService.get(`/users/${employeeId}`);
                    if (employee && employee.id) {
                        this.employees.push(employee);
                    }
                } catch (error) {
                    console.warn(`Не удалось загрузить сотрудника ${employeeId}:`, error);
                }
            }

            
            this.employees = this.employees.filter((employee, index, self) => 
                index === self.findIndex(emp => emp.id === employee.id)
            );

            this.view.renderProgressMonitoring(this.employees);

        } catch (error) {
            console.error('❌ Ошибка загрузки данных мониторинга:', error);
            this.app.showNotification('Ошибка загрузки данных: ' + error.message, 'error');
        } finally {
            this.view.showLoading(false);
        }
    }

    async handleEmployeeSelect(employeeId) {
        this.currentEmployeeId = employeeId;
        
        if (!employeeId) {
            this.view.hideKpiSection();
            return;
        }
    
        try {
            this.view.showLoading(true);
    
            
            const evaluationsData = await this.apiService.get(`/evaluations/user/${employeeId}`);
            
            
            this.evaluations = evaluationsData.map(evalData => {
                const evaluation = new Evaluation(evalData);
                
                if (typeof evaluation.calculateOverallKpi === 'function' && !evaluation.overallKpi) {
                    evaluation.calculateOverallKpi();
                }
                return evaluation;
            });
    
            
            this.view.showKPIHistory(this.evaluations);
    
        } catch (error) {
            console.error('❌ Ошибка загрузки оценок сотрудника:', error);
            this.app.showNotification('Ошибка загрузки оценок сотрудника: ' + error.message, 'error');
        } finally {
            this.view.showLoading(false);
        }
    }

    showProgressChart() {
        if (!this.currentEmployeeId || this.evaluations.length === 0) {
            this.app.showNotification('Нет данных для построения графика', 'warning');
            return;
        }

        this.view.showProgressChart(this.evaluations);
    }
}