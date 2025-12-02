import { ApiService } from '../services/ApiService.js';
import { SelfAssessment } from '../models/SelfAssessment.js';
import { SelfAssessmentView } from '../views/SelfAssessmentView.js';

export class SelfAssessmentPresenter {
    constructor(app) {
        this.app = app;
        this.apiService = new ApiService();
        this.view = new SelfAssessmentView();
        this.assessments = [];
        this.init();
    }

    init() {
        this.view.bindSubmitHandler((assessmentData) => this.handleCreateAssessment(assessmentData));
        this.view.bindAssessmentActionsHandler((action, assessmentId) => this.handleAssessmentAction(action, assessmentId));
    }

    async show() {
        this.view.show();
        await this.loadAssessments();
    }

    async loadAssessments() {
        try {
            this.view.showLoading(true);
            const userId = this.app.currentUser.id;
            const assessments = await this.apiService.get(`/self-assessments/user/${userId}`);
            this.assessments = assessments.map(assessmentData => SelfAssessment.fromApiData(assessmentData));
            this.view.renderAssessments(this.assessments);
        } catch (error) {
            this.app.showNotification('Ошибка загрузки самооценок: ' + error.message, 'error');
            this.view.renderAssessments([]);
        } finally {
            this.view.showLoading(false);
        }
    }

    async handleCreateAssessment(assessmentData) {
        try {
            this.view.showLoading(true);
            const existingAssessment = this.assessments.find(assessment => 
                assessment.skillName.toLowerCase() === assessmentData.skillName.toLowerCase() &&
                assessment.user?.id === this.app.currentUser.id
            );
            if (existingAssessment) {
                this.app.showNotification('Самооценка с таким названием навыка уже существует', 'error');
                return;
            }
            const assessmentPayload = {
                user: { id: this.app.currentUser.id },
                skillName: assessmentData.skillName,
                skillLevel: assessmentData.skillLevel
            };
            const assessment = new SelfAssessment(assessmentPayload);
            const validationErrors = assessment.validate();
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
            const response = await this.apiService.post('/self-assessments', assessmentPayload);
            this.app.showNotification('Самооценка успешно отправлена', 'success');
            this.view.resetForm();
            await this.loadAssessments();
        } catch (error) {
            this.app.showNotification('Ошибка создания самооценки: ' + error.message, 'error');
        } finally {
            this.view.showLoading(false);
        }
    }

    async handleAssessmentAction(action, assessmentId) {
        switch (action) {
            case 'delete': await this.deleteAssessment(assessmentId); break;
        }
    }

    async deleteAssessment(assessmentId) {
        if (!confirm('Вы уверены, что хотите удалить эту самооценку?')) return;

        try {
            await this.apiService.delete(`/self-assessments/${assessmentId}`);
            this.app.showNotification('Самооценка успешно удалена', 'success');
            await this.loadAssessments();
        } catch (error) {
            this.app.showNotification('Ошибка удаления самооценки: ' + error.message, 'error');
        }
    }
}