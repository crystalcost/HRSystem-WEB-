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
                this.feedbackList = this.feedbackList.filter(fb => fb.evaluation?.manager?.id === this.app.currentUser.id);
                this.filteredFeedback = [...this.feedbackList];
            } else if (this.app.isEmployee()) {
                this.evaluations = await this.apiService.get(`/evaluations/user/${this.app.currentUser.id}`);
                this.feedbackList = this.feedbackList.filter(fb => fb.evaluation?.user?.id === this.app.currentUser.id);
                this.filteredFeedback = [...this.feedbackList];
            }

            this.view.renderFeedback(this.filteredFeedback);
            this.view.updateEvaluationFilter(this.evaluations);
        } catch (error) {
            this.app.showNotification('Ошибка загрузки отзывов: ' + error.message, 'error');
            this.view.renderFeedback([]);
        } finally {
            this.view.showLoading(false);
        }
    }

    handleFilter(evaluationId) {
        this.filteredFeedback = !evaluationId ? [...this.feedbackList] : 
            this.feedbackList.filter(feedback => feedback.evaluation?.evaluationId == evaluationId);
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
    
        const formHtml = this.view.getFeedbackFormHtml(this.evaluations);
        this.app.showModal(formHtml, (form) => this.handleCreateFeedback(form));
    }

    async handleCreateFeedback(form) {
        try {
            const formData = new FormData(form);
            const evaluationId = parseInt(formData.get('evaluationId'));
            const feedbackText = formData.get('feedbackText');
            const existingFeedback = this.feedbackList.find(feedback => 
                feedback.evaluation?.evaluationId === evaluationId &&
                feedback.evaluation?.user?.id === this.app.currentUser.id
            );
            if (existingFeedback) {
                this.app.showNotification('Вы уже добавляли отзыв к этой оценке', 'error');
                return;
            }
            const feedbackData = {
                evaluation: { evaluationId: evaluationId },
                feedbackText: feedbackText
            };
            const feedback = new Feedback(feedbackData);
            const validationErrors = feedback.validate();
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
            const response = await this.apiService.post('/feedback', feedbackData);
            this.app.showNotification('Отзыв успешно добавлен', 'success');
            this.app.hideModal();
            await this.loadData();
        } catch (error) {
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
            case 'view': await this.showFeedbackDetails(feedbackId); break;
            case 'edit': await this.showEditFeedbackForm(feedbackId); break;
            case 'delete': await this.deleteFeedback(feedbackId); break;
        }
    }

    hasAccessToFeedback(feedback) {
        if (this.app.isAdmin()) return true;
        if (this.app.isManager()) return feedback.evaluation?.manager?.id === this.app.currentUser.id;
        if (this.app.isEmployee()) return feedback.evaluation?.user?.id === this.app.currentUser.id;
        return false;
    }

    async showEditFeedbackForm(feedbackId) {
        const feedback = this.feedbackList.find(f => f.feedbackId === feedbackId);
        if (!feedback) return;
    
        if (!this.hasAccessToFeedback(feedback)) {
            this.app.showNotification('У вас нет прав для редактирования этого отзыва', 'error');
            return;
        }
    
        const formHtml = this.view.getEditFeedbackFormHtml(feedback);
        this.app.showModal(formHtml, (form) => this.handleUpdateFeedback(feedbackId, form));
    }

    async handleUpdateFeedback(feedbackId, form) {
        try {
            const formData = new FormData(form);
            const originalFeedback = this.feedbackList.find(f => f.feedbackId === feedbackId);
            if (!originalFeedback) throw new Error('Отзыв не найден');
            const feedbackData = {
                evaluation: originalFeedback.evaluation,
                feedbackText: formData.get('feedbackText')
            };
            const feedback = new Feedback(feedbackData);
            const validationErrors = feedback.validate();
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
            const response = await this.apiService.put(`/feedback/${feedbackId}`, feedbackData);
            this.app.showNotification('Отзыв успешно обновлен', 'success');
            this.app.hideModal();
            await this.loadData();
        } catch (error) {
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
    
            const detailsHtml = this.view.getFeedbackDetailsHtml(feedback, this.hasAccessToFeedback(feedback));
            this.app.showModal(detailsHtml);
        } catch (error) {
            this.app.showNotification('Ошибка загрузки деталей отзыва', 'error');
        }
    }

    async deleteFeedback(feedbackId) {
        if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

        try {
            const response = await this.apiService.delete(`/feedback/${feedbackId}`);
            this.app.showNotification('Отзыв успешно удален', 'success');
            await this.loadData();
        } catch (error) {
            this.app.showNotification('Ошибка удаления отзыва: ' + error.message, 'error');
        }
    }
}