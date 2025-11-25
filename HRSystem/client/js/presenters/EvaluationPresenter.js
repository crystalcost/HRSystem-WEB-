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

    hide() {
        this.view.hide();
    }

    onViewShow() {
        this.loadData();
    }

    async loadData() {
        try {
            this.view.showLoading(true);
            console.log('🔄 Loading evaluations data...');
    
            const evaluations = await this.apiService.get('/evaluations');
            console.log('✅ Evaluations loaded:', evaluations);
            
            this.evaluations = evaluations.map(evalData => {
                const evaluation = new Evaluation(evalData);
                
                evaluation.getPerformanceLevel = Evaluation.prototype.getPerformanceLevel;
                evaluation.getPerformanceText = Evaluation.prototype.getPerformanceText;
                return evaluation;
            });
            
            this.filteredEvaluations = [...this.evaluations];
    
            if (this.app.isAdmin() || this.app.isManager()) {
                this.users = await this.apiService.get('/users');
                this.managers = await this.apiService.get('/users/managers');
                
                console.log('🔍 Users with roles:', this.users.map(user => ({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    roleName: user.role?.name
                })));
                
                this.employees = this.users.filter(user => {
                    const roleName = user.role?.name || user.role;
                    return roleName === 'EMPLOYEE';
                });
                
                console.log('✅ Users loaded:', this.users.length);
                console.log('✅ Employees filtered:', this.employees.length);
                console.log('✅ Managers loaded:', this.managers.length);
            }
    
            if (this.app.isManager()) {
                console.log('🔍 Loading manager evaluations for user:', this.app.currentUser.id);
                const managerEvaluations = await this.apiService.get(`/evaluations/manager/${this.app.currentUser.id}`);
                
                this.evaluations = managerEvaluations.map(evalData => {
                    const evaluation = new Evaluation(evalData);
                    evaluation.getPerformanceLevel = Evaluation.prototype.getPerformanceLevel;
                    evaluation.getPerformanceText = Evaluation.prototype.getPerformanceText;
                    return evaluation;
                });
                this.filteredEvaluations = [...this.evaluations];
            }
    
            this.view.renderEvaluations(this.filteredEvaluations);
            
            this.view.updateEmployeeFilter(this.employees || this.users);
    
            if (this.app.isAdmin()) {
                const addButton = document.getElementById('add-evaluation-btn');
                if (addButton) {
                    addButton.style.display = 'none';
                }
            }
    
        } catch (error) {
            console.error('❌ Error loading evaluations:', error);
            this.app.showNotification(error.message, 'error');
            this.view.renderEvaluations([]);
        } finally {
            this.view.showLoading(false);
        }
    }

    handleFilter(employeeId) {
        console.log('🔍 Filtering evaluations by employee:', employeeId);
        if (!employeeId) {
            this.filteredEvaluations = [...this.evaluations];
        } else {
            this.filteredEvaluations = this.evaluations.filter(evaluation => 
                evaluation.user?.id == employeeId
            );
        }
        console.log('✅ Filtered evaluations count:', this.filteredEvaluations.length);
        this.view.renderEvaluations(this.filteredEvaluations);
    }

    showAddEvaluationForm() {
        if (!this.app.isManager()) {
            this.app.showNotification('Только менеджеры могут создавать оценки', 'error');
            return;
        }
    
        const availableUsers = (this.employees || this.users).filter(user => 
            user.id !== this.app.currentUser.id
        );
        console.log('👥 Available employees for evaluation:', availableUsers);
    
        if (availableUsers.length === 0) {
            this.app.showNotification('Нет доступных сотрудников для оценки', 'warning');
            return;
        }
    
        const formHtml = `
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
                        <input type="text" id="eval-manager" value="${this.app.currentUser.username}" readonly 
                               style="background-color: #f8f9fa; cursor: not-allowed;">
                        <input type="hidden" name="managerId" value="${this.app.currentUser.id}">
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
                            <div class="kpi-preview" style="margin-top: 0.5rem;">
                                <small>Вес: 40%</small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="eval-fix-time">KPI времени исправлений (0-100):</label>
                            <input type="number" id="eval-fix-time" name="kpiFixTime" 
                                   min="0" max="100" value="0" required
                                   oninput="window.updateKpiPreview && window.updateKpiPreview()">
                            <div class="kpi-preview" style="margin-top: 0.5rem;">
                                <small>Вес: 20%</small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="eval-test-coverage">KPI тестового покрытия (0-100):</label>
                            <input type="number" id="eval-test-coverage" name="kpiTestCoverage" 
                                   min="0" max="100" value="0" required
                                   oninput="window.updateKpiPreview && window.updateKpiPreview()">
                            <div class="kpi-preview" style="margin-top: 0.5rem;">
                                <small>Вес: 20%</small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="eval-timeliness">KPI соблюдения сроков (0-100):</label>
                            <input type="number" id="eval-timeliness" name="kpiTimeliness" 
                                   min="0" max="100" value="0" required
                                   oninput="window.updateKpiPreview && window.updateKpiPreview()">
                            <div class="kpi-preview" style="margin-top: 0.5rem;">
                                <small>Вес: 20%</small>
                            </div>
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
    
        this.app.showModal(formHtml, (form) => this.handleCreateEvaluation(form));
    
        setTimeout(() => {
            this.setupKpiPreview();
        }, 100);
    }
    
    setupKpiPreview() {
        window.updateKpiPreview = () => {
            const completedTasks = parseFloat(document.getElementById('eval-completed-tasks')?.value) || 0;
            const fixTime = parseFloat(document.getElementById('eval-fix-time')?.value) || 0;
            const testCoverage = parseFloat(document.getElementById('eval-test-coverage')?.value) || 0;
            const timeliness = parseFloat(document.getElementById('eval-timeliness')?.value) || 0;
            
            const weights = { completedTasks: 0.4, fixTime: 0.2, testCoverage: 0.2, timeliness: 0.2 };
            const overallKpi = (completedTasks * weights.completedTasks) + 
                              (fixTime * weights.fixTime) + 
                              (testCoverage * weights.testCoverage) + 
                              (timeliness * weights.timeliness);
            
            const roundedKpi = Math.round(overallKpi * 100) / 100;
            
            const previewValue = document.getElementById('kpi-preview-value');
            if (previewValue) {
                previewValue.textContent = roundedKpi;
            }
            
            let level = 'unknown';
            let levelText = 'Не оценено';
            if (roundedKpi >= 90) {
                level = 'excellent';
                levelText = 'Отлично';
            } else if (roundedKpi >= 75) {
                level = 'good';
                levelText = 'Хорошо';
            } else if (roundedKpi >= 60) {
                level = 'satisfactory';
                levelText = 'Удовлетворительно';
            } else if (roundedKpi >= 40) {
                level = 'needs_improvement';
                levelText = 'Требует улучшения';
            } else if (roundedKpi > 0) {
                level = 'poor';
                levelText = 'Неудовлетворительно';
            }
            
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

    async handleCreateEvaluation(form) {
        try {
            const formData = new FormData(form);
            console.log('📝 Creating evaluation with form data:', Object.fromEntries(formData));
            
            const evaluationData = {
                user: { id: parseInt(formData.get('userId')) },
                manager: { id: this.app.currentUser.id },
                kpiCompletedTasks: parseFloat(formData.get('kpiCompletedTasks')),
                kpiFixTime: parseFloat(formData.get('kpiFixTime')),
                kpiTestCoverage: parseFloat(formData.get('kpiTestCoverage')),
                kpiTimeliness: parseFloat(formData.get('kpiTimeliness')),
                comments: formData.get('comments')
            };
    
            console.log('🔍 Evaluation data before validation:', evaluationData);
    
            const evaluation = new Evaluation(evaluationData);
            const validationErrors = evaluation.validate();
            
            if (validationErrors.length > 0) {
                console.warn('❌ Validation errors:', validationErrors);
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
    
            evaluation.calculateOverallKpi();
            evaluationData.overallKpi = evaluation.overallKpi;
            console.log('✅ Calculated overall KPI:', evaluation.overallKpi);
    
            console.log('🚀 Sending evaluation data to server:', evaluationData);
            const response = await this.apiService.post('/evaluations', evaluationData);
            console.log('✅ Server response:', response);
            
            this.app.showNotification('Оценка успешно создана', 'success');
            this.app.hideModal();
            await this.loadData();
            
        } catch (error) {
            console.error('❌ Error creating evaluation:', error);
            this.app.showNotification('Ошибка при создании оценки: ' + error.message, 'error');
        }
    }

    async handleEvaluationAction(action, evaluationId) {
        console.log('🔧 Handling evaluation action:', action, 'for evaluation:', evaluationId);
        
        if (this.app.isAdmin() && action !== 'view') {
            this.app.showNotification('Администратор может только просматривать оценки', 'error');
            return;
        }

        switch (action) {
            case 'edit':
                if (this.app.isManager()) {
                    await this.showEditEvaluationForm(evaluationId);
                }
                break;
            case 'delete':
                if (this.app.isManager()) {
                    await this.deleteEvaluation(evaluationId);
                }
                break;
            case 'view':
                await this.showEvaluationDetails(evaluationId);
                break;
        }
    }

    async showEditEvaluationForm(evaluationId) {
        try {
            console.log('📝 Opening edit form for evaluation:', evaluationId);
            const evaluation = this.evaluations.find(e => e.evaluationId === evaluationId);
            if (!evaluation) {
                console.warn('❌ Evaluation not found:', evaluationId);
                return;
            }

            if (evaluation.manager?.id !== this.app.currentUser.id) {
                console.warn('🚫 Unauthorized edit attempt by manager:', this.app.currentUser.id);
                this.app.showNotification('Вы можете редактировать только свои оценки', 'error');
                return;
            }

            const formHtml = `
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

            this.app.showModal(formHtml, (form) => this.handleUpdateEvaluation(evaluationId, form));
            
        } catch (error) {
            console.error('❌ Error opening edit form:', error);
            this.app.showNotification(error.message, 'error');
        }
    }

    async handleUpdateEvaluation(evaluationId, form) {
        try {
            const formData = new FormData(form);
            console.log('📝 Updating evaluation:', evaluationId, 'with data:', Object.fromEntries(formData));
            
            const originalEvaluation = this.evaluations.find(e => e.evaluationId === evaluationId);
            if (!originalEvaluation) {
                throw new Error('Оценка не найдена');
            }
            
            const evaluationData = {
                user: { id: originalEvaluation.user?.id },
                manager: { id: originalEvaluation.manager?.id },
                kpiCompletedTasks: parseFloat(formData.get('kpiCompletedTasks')),
                kpiFixTime: parseFloat(formData.get('kpiFixTime')),
                kpiTestCoverage: parseFloat(formData.get('kpiTestCoverage')),
                kpiTimeliness: parseFloat(formData.get('kpiTimeliness')),
                comments: formData.get('comments')
            };
    
            console.log('🔍 Evaluation update data before validation:', evaluationData);
    
            const evaluation = new Evaluation(evaluationData);
            const validationErrors = evaluation.validate();
            
            if (validationErrors.length > 0) {
                console.warn('❌ Validation errors:', validationErrors);
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
    
            evaluation.calculateOverallKpi();
            evaluationData.overallKpi = evaluation.overallKpi;
            console.log('✅ Calculated overall KPI:', evaluation.overallKpi);
    
            console.log('🚀 Sending full update data to server:', evaluationData);
            const response = await this.apiService.put(`/evaluations/${evaluationId}`, evaluationData);
            console.log('✅ Server response:', response);
            
            this.app.showNotification('Оценка успешно обновлена', 'success');
            this.app.hideModal();
            await this.loadData();
            
        } catch (error) {
            console.error('❌ Error updating evaluation:', error);
            this.app.showNotification('Ошибка при обновлении оценки: ' + error.message, 'error');
        }
    }

    async showEvaluationDetails(evaluationId) {
        try {
            console.log('👀 Showing details for evaluation:', evaluationId);
            const evaluation = this.evaluations.find(e => e.evaluationId === evaluationId);
            if (!evaluation) {
                console.warn('❌ Evaluation not found:', evaluationId);
                return;
            }
    
            const evaluationDate = evaluation.evaluationDate ? 
                new Date(evaluation.evaluationDate).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Дата не указана';
    
            const detailsHtml = `
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
    
            this.app.showModal(detailsHtml);
            
        } catch (error) {
            console.error('❌ Error showing evaluation details:', error);
            this.app.showNotification(error.message, 'error');
        }
    }

    async deleteEvaluation(evaluationId) {
        if (!confirm('Вы уверены, что хотите удалить эту оценку?')) {
            return;
        }

        try {
            console.log('🗑️ Deleting evaluation:', evaluationId);
            await this.apiService.delete(`/evaluations/${evaluationId}`);
            
            this.app.showNotification('Оценка успешно удалена', 'success');
            await this.loadData();
            
        } catch (error) {
            console.error('❌ Error deleting evaluation:', error);
            this.app.showNotification(error.message, 'error');
        }
    }
}