import { ApiService } from '../services/ApiService.js';
import { Evaluation } from '../models/Evaluation.js';
import { TrainingRequest } from '../models/TrainingRequest.js';
import { IDPManagerView } from '../views/IDPManagerView.js';

export class IDPManagerPresenter {
    constructor(app) {
        this.app = app;
        this.apiService = new ApiService();
        this.view = new IDPManagerView();
        this.employees = [];
        this.evaluations = [];
        this.currentEmployeeId = null;
        this.employeeTrainingRequests = [];
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
        this.view.bindCreateTrainingRequestHandler((courseData) => this.handleCreateTrainingRequest(courseData));
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

            this.view.renderIDPManager(this.employees);

        } catch (error) {
            console.error('❌ Ошибка загрузки данных IDP менеджера:', error);
            this.app.showNotification('Ошибка загрузки данных: ' + error.message, 'error');
        } finally {
            this.view.showLoading(false);
        }
    }

    async handleEmployeeSelect(employeeId) {
        this.currentEmployeeId = employeeId;
        
        if (!employeeId) {
            this.view.hideEmployeeData();
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

            
            let requestsData = [];
            try {
                requestsData = await this.apiService.get(`/training-requests/user/${employeeId}`);
            } catch (error) {
                console.warn('Нет заявок на обучение:', error);
            }
            
            this.employeeTrainingRequests = requestsData.map(requestData => 
                new TrainingRequest(requestData)
            );

            
            const recommendedCourses = this.getRecommendedCourses(this.evaluations);

            
            const employee = this.employees.find(emp => emp.id == employeeId);
            if (employee) {
                this.view.showEmployeeData(employee, this.evaluations, recommendedCourses, this.employeeTrainingRequests);
            } else {
                this.app.showNotification('Сотрудник не найден', 'error');
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки данных сотрудника:', error);
            this.app.showNotification('Ошибка загрузки данных сотрудника: ' + error.message, 'error');
        } finally {
            this.view.showLoading(false);
        }
    }

    async handleCreateTrainingRequest(courseData) {
        if (!this.currentEmployeeId) {
            this.app.showNotification('Сначала выберите сотрудника', 'error');
            return;
        }

        try {
            this.view.showLoading(true);

            const requestData = {
                user: { id: parseInt(this.currentEmployeeId) },
                courseName: courseData.courseName,
                comments: courseData.comments || `Рекомендовано менеджером на основе оценок KPI`
            };

            const response = await this.apiService.post('/training-requests', requestData);
            
            if (response.status === 'SUCCESS') {
                this.app.showNotification('Заявка на обучение успешно создана', 'success');
                this.view.resetCourseForm();
                
                
                try {
                    const requestsData = await this.apiService.get(`/training-requests/user/${this.currentEmployeeId}`);
                    this.employeeTrainingRequests = requestsData.map(requestData => 
                        new TrainingRequest(requestData)
                    );
                } catch (error) {
                    console.warn('Не удалось обновить заявки:', error);
                    this.employeeTrainingRequests = [];
                }
                
                
                const employee = this.employees.find(emp => emp.id == this.currentEmployeeId);
                const recommendedCourses = this.getRecommendedCourses(this.evaluations);
                this.view.showEmployeeData(employee, this.evaluations, recommendedCourses, this.employeeTrainingRequests);
            } else {
                throw new Error(response.message || 'Неизвестная ошибка');
            }

        } catch (error) {
            console.error('❌ Ошибка создания заявки на обучение:', error);
            this.app.showNotification('Ошибка создания заявки: ' + error.message, 'error');
        } finally {
            this.view.showLoading(false);
        }
    }

    getRecommendedCourses(evaluations) {
        if (!evaluations || evaluations.length === 0) return [];
    
        const latestEvaluation = evaluations.sort((a, b) => 
            new Date(b.evaluationDate) - new Date(a.evaluationDate)
        )[0];
    
        const recommendations = [];
    
        
        if (latestEvaluation.kpiCompletedTasks < 70) {
            recommendations.push({
                courseName: 'Agile и Scrum методологии (Coursera - 16 часов)',
                reason: 'Низкий KPI выполненных задач (' + latestEvaluation.kpiCompletedTasks + '%)',
                priority: 'high'
            });
            recommendations.push({
                courseName: 'Тайм-менеджмент по методу Pomodoro (LinkedIn Learning - 8 часов)',
                reason: 'Для улучшения производительности',
                priority: 'medium'
            });
        }
    
        
        if (latestEvaluation.kpiFixTime < 60) {
            recommendations.push({
                courseName: 'Системное мышление и решение проблем (Stepik - 20 часов)',
                reason: 'Низкий KPI времени исправлений (' + latestEvaluation.kpiFixTime + '%)',
                priority: 'high'
            });
            recommendations.push({
                courseName: 'Основы алгоритмов и структур данных (Яндекс Практикум - 40 часов)',
                reason: 'Для улучшения качества кода',
                priority: 'medium'
            });
        }
    
        
        if (latestEvaluation.kpiTestCoverage < 50) {
            recommendations.push({
                courseName: 'Test-Driven Development (Udemy - 24 часа)',
                reason: 'Низкий KPI тестового покрытия (' + latestEvaluation.kpiTestCoverage + '%)',
                priority: 'medium'
            });
            recommendations.push({
                courseName: 'Автоматизация тестирования на Python (Stepik - 36 часов)',
                reason: 'Для повышения качества тестирования',
                priority: 'medium'
            });
        }
    
        
        if (latestEvaluation.kpiTimeliness < 75) {
            recommendations.push({
                courseName: 'Управление проектами по методологии PMI (Coursera - 30 часов)',
                reason: 'Низкий KPI соблюдения сроков (' + latestEvaluation.kpiTimeliness + '%)',
                priority: 'high'
            });
            recommendations.push({
                courseName: 'Эффективное планирование в Jira (LinkedIn Learning - 12 часов)',
                reason: 'Для лучшего контроля сроков',
                priority: 'medium'
            });
        }
    
        
        if (latestEvaluation.overallKpi < 60) {
            recommendations.push({
                courseName: 'Комплексное развитие IT-специалиста (Нетология - 60 часов)',
                reason: 'Низкий общий KPI (' + latestEvaluation.overallKpi.toFixed(2) + '%)',
                priority: 'high'
            });
            recommendations.push({
                courseName: 'Профессиональные навыки разработчика (Skillbox - 45 часов)',
                reason: 'Для всестороннего развития',
                priority: 'medium'
            });
        } else if (latestEvaluation.overallKpi >= 85) {
            recommendations.push({
                courseName: 'Лидерство в IT-командах (Coursera - 25 часов)',
                reason: 'Высокий потенциал для развития лидерских качеств',
                priority: 'low'
            });
            recommendations.push({
                courseName: 'Технический менеджмент и архитектура (Отус - 35 часов)',
                reason: 'Для карьерного роста в управлении',
                priority: 'low'
            });
        }
    
        
        if (latestEvaluation.overallKpi >= 90) {
            recommendations.push({
                courseName: 'Публичные выступления для IT-специалистов (Skillfactory - 15 часов)',
                reason: 'Отличные результаты, развитие софт-скиллов',
                priority: 'low'
            });
        }
    
        
        if (latestEvaluation.kpiCompletedTasks < 65 || latestEvaluation.kpiTimeliness < 70) {
            recommendations.push({
                courseName: 'Эффективная коммуникация в команде (Edureka - 18 часов)',
                reason: 'Для улучшения взаимодействия с коллегами',
                priority: 'medium'
            });
        }
    
        return recommendations;
    }
}