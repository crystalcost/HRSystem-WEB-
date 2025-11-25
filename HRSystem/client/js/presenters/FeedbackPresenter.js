import { ApiService } from '../services/ApiService.js';
import { Feedback } from '../models/Feedback.js';
import { FeedbackView } from '../views/FeedbackView.js';

export class FeedbackPresenter {
    constructor(app) {
        this.app = app;
        this.apiService = new ApiService();
        this.view = new FeedbackView();
        this.feedbackList = [];
        this.evaluations = [];
        this.filteredFeedback = [];
        this.init();
    }

    init() {
        this.view.bindAddFeedbackHandler(() => this.showAddFeedbackForm());
        this.view.bindFilterHandler((evaluationId) => this.handleFilter(evaluationId));
        this.view.bindFeedbackActionsHandler((action, feedbackId) => this.handleFeedbackAction(action, feedbackId));
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

            const feedback = await this.apiService.get('/feedback');
            this.feedbackList = feedback.map(feedbackData => Feedback.fromApiData(feedbackData));
            this.filteredFeedback = [...this.feedbackList];

            if (this.app.isAdmin()) {
                this.evaluations = await this.apiService.get('/evaluations');
            } else if (this.app.isManager()) {
                this.evaluations = await this.apiService.get(`/evaluations/manager/${this.app.currentUser.id}`);
                
                this.feedbackList = this.feedbackList.filter(fb => 
                    fb.evaluation?.manager?.id === this.app.currentUser.id
                );
                this.filteredFeedback = [...this.feedbackList];
            } else if (this.app.isEmployee()) {
                this.evaluations = await this.apiService.get(`/evaluations/user/${this.app.currentUser.id}`);
                
                this.feedbackList = this.feedbackList.filter(fb => 
                    fb.evaluation?.user?.id === this.app.currentUser.id
                );
                this.filteredFeedback = [...this.feedbackList];
            }

            this.view.renderFeedback(this.filteredFeedback);
            this.view.updateEvaluationFilter(this.evaluations);

            const addButton = document.getElementById('add-feedback-btn');
            if (addButton) {
                if (this.app.isAdmin() || this.app.isManager()) {
                    addButton.style.display = 'none';
                } else if (this.app.isEmployee()) {
                    addButton.style.display = 'block';
                    addButton.disabled = false;
                    addButton.title = 'Добавить отзыв';
                    addButton.style.opacity = '1';
                    addButton.style.cursor = 'pointer';
                }
            }

        } catch (error) {
            this.app.showNotification('Ошибка загрузки отзывов: ' + error.message, 'error');
            this.view.renderFeedback([]);
        } finally {
            this.view.showLoading(false);
        }
    }

    handleFilter(evaluationId) {
        if (!evaluationId) {
            this.filteredFeedback = [...this.feedbackList];
        } else {
            this.filteredFeedback = this.feedbackList.filter(feedback => 
                feedback.evaluation?.evaluationId == evaluationId
            );
        }
        
        this.view.renderFeedback(this.filteredFeedback);
    }

    showAddFeedbackForm() {
        if (this.app.isAdmin() || this.app.isManager()) {
            this.app.showNotification('Добавление отзывов доступно только сотрудникам', 'error');
            return;
        }
    
        if (this.evaluations.length === 0) {
            this.app.showNotification('Нет доступных оценок для добавления отзыва', 'error');
            return;
        }
    
        const formHtml = `
            <h2>Добавить отзыв на оценку</h2>
            <form id="feedback-form">
                <div class="form-group">
                    <label for="feedback-evaluation">Оценка:</label>
                    <select id="feedback-evaluation" name="evaluationId" required>
                        <option value="">Выберите оценку</option>
                        ${this.evaluations.map(evaluation => 
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
    
        this.app.showModal(formHtml, (form) => {
            const textarea = form.querySelector('#feedback-text');
            const counter = form.querySelector('#char-count');
            if (textarea && counter) {
                textarea.addEventListener('input', () => {
                    counter.textContent = textarea.value.length;
                });
            }
            return this.handleCreateFeedback(form);
        });
    }

    async handleCreateFeedback(form) {
        try {
            const formData = new FormData(form);
            
            const feedbackData = {
                evaluation: {
                    evaluationId: parseInt(formData.get('evaluationId'))
                },
                feedbackText: formData.get('feedbackText')
            };

            console.log('📤 Отправка данных на сервер:', feedbackData);

            const response = await this.apiService.post('/feedback', feedbackData);
            
            console.log('✅ Ответ от сервера:', response);
            
            if (response.status === 'SUCCESS') {
                this.app.showNotification('Отзыв успешно добавлен', 'success');
                this.app.hideModal();
                await this.loadData();
            } else {
                throw new Error(response.message || 'Неизвестная ошибка сервера');
            }
            
        } catch (error) {
            console.error('❌ Ошибка создания отзыва:', error);
            this.app.showNotification('Ошибка создания отзыва: ' + error.message, 'error');
        }
    }

    async handleFeedbackAction(action, feedbackId) {
        const feedback = this.feedbackList.find(f => f.feedbackId === feedbackId);
        if (!feedback) {
            this.app.showNotification('Отзыв не найден', 'error');
            return;
        }

        if (!this.hasAccessToFeedback(feedback)) {
            this.app.showNotification('У вас нет прав для выполнения этого действия', 'error');
            return;
        }

        switch (action) {
            case 'view':
                await this.showFeedbackDetails(feedbackId);
                break;
            case 'edit':
                await this.showEditFeedbackForm(feedbackId);
                break;
            case 'delete':
                await this.deleteFeedback(feedbackId);
                break;
        }
    }

    hasAccessToFeedback(feedback) {
        if (this.app.isAdmin()) {
            return true;
        } else if (this.app.isManager()) {
            return feedback.evaluation?.manager?.id === this.app.currentUser.id;
        } else if (this.app.isEmployee()) {
            return feedback.evaluation?.user?.id === this.app.currentUser.id;
        }
        return false;
    }

    showEditFeedbackForm(feedbackId) {
        const feedback = this.feedbackList.find(f => f.feedbackId === feedbackId);
        if (!feedback) return;
    
        if (!this.hasAccessToFeedback(feedback)) {
            this.app.showNotification('У вас нет прав для редактирования этого отзыва', 'error');
            return;
        }
    
        const formHtml = `
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
        this.app.showModal(formHtml, (form) => {
            const textarea = form.querySelector('#feedback-text');
            const counter = form.querySelector('#char-count');
            if (textarea && counter) {
                textarea.addEventListener('input', () => {
                    counter.textContent = textarea.value.length;
                });
            }
            return this.handleUpdateFeedback(feedbackId, form);
        });
    }

    async handleUpdateFeedback(feedbackId, form) {
        try {
            const formData = new FormData(form);
            
            const originalFeedback = this.feedbackList.find(f => f.feedbackId === feedbackId);
            if (!originalFeedback) {
                throw new Error('Отзыв не найден');
            }
    
            const feedbackData = {
                evaluation: originalFeedback.evaluation,
                feedbackText: formData.get('feedbackText')
            };
    
            console.log('📤 Отправка обновления отзыва:', feedbackData);
    
            const response = await this.apiService.put(`/feedback/${feedbackId}`, feedbackData);
            
            console.log('✅ Ответ от сервера:', response);
            
            if (response.status === 'SUCCESS') {
                this.app.showNotification('Отзыв успешно обновлен', 'success');
                this.app.hideModal();
                await this.loadData();
            } else {
                throw new Error(response.message || 'Неизвестная ошибка сервера');
            }
            
        } catch (error) {
            console.error('❌ Ошибка обновления отзыва:', error);
            this.app.showNotification('Ошибка обновления отзыва: ' + error.message, 'error');
        }
    }

    async showFeedbackDetails(feedbackId) {
        try {
            const feedback = this.feedbackList.find(f => f.feedbackId === feedbackId);
            if (!feedback) {
                this.app.showNotification('Отзыв не найден', 'error');
                return;
            }
    
            const canEdit = this.app.isEmployee() && this.hasAccessToFeedback(feedback);
            const canDelete = this.hasAccessToFeedback(feedback);
    
            const editButton = canEdit ? `
                <button class="btn btn-secondary btn-sm" onclick="app.presenters.feedback.showEditFeedbackForm(${feedback.feedbackId})">
                    ✏️ Редактировать
                </button>
            ` : '';
    
            const deleteButton = canDelete ? `
                <button class="btn btn-danger btn-sm" onclick="app.presenters.feedback.deleteFeedback(${feedback.feedbackId})">
                    🗑️ Удалить
                </button>
            ` : '';
    
            const detailsHtml = `
                <h2>Детали отзыва #${feedback.feedbackId}</h2>
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
                                ${feedback.getWordCount ? feedback.getWordCount() : feedback.feedbackText.split(' ').length} сл.
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
            `;
    
            this.app.showModal(detailsHtml);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки деталей отзыва:', error);
            this.app.showNotification('Ошибка загрузки деталей отзыва', 'error');
        }
    }

    async deleteFeedback(feedbackId) {
        if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
            return;
        }

        try {
            const response = await this.apiService.delete(`/feedback/${feedbackId}`);
            
            if (response.status === 'SUCCESS') {
                this.app.showNotification('Отзыв успешно удален', 'success');
                await this.loadData();
            } else {
                throw new Error(response.message || 'Неизвестная ошибка сервера');
            }
            
        } catch (error) {
            console.error('❌ Ошибка удаления отзыва:', error);
            this.app.showNotification('Ошибка удаления отзыва: ' + error.message, 'error');
        }
    }
}