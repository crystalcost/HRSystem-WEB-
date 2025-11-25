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

    hide() {
        this.view.hide();
    }

    onViewShow() {
        this.loadAssessments();
    }

    async loadAssessments() {
        try {
            this.view.showLoading(true);

            const userId = this.app.currentUser.id;
            console.log('🔄 Loading self-assessments for user ID:', userId);
            
            const assessments = await this.apiService.get(`/self-assessments/user/${userId}`);
            console.log('✅ Self-assessments received:', assessments);
            
            this.assessments = assessments.map(assessmentData => {
                const assessment = SelfAssessment.fromApiData(assessmentData);
                assessment.getProgressPercentage = () => (assessment.skillLevel / 10) * 100;
                return assessment;
            });
            
            this.view.renderAssessments(this.assessments);

        } catch (error) {
            console.error('❌ Failed to load self-assessments:', error);
            this.app.showNotification('Ошибка загрузки самооценок: ' + error.message, 'error');
            this.view.renderAssessments([]);
        } finally {
            this.view.showLoading(false);
        }
    }

    async handleCreateAssessment(assessmentData) {
        try {
            this.view.showLoading(true);

            console.log('📝 Creating self-assessment with data:', assessmentData);

            const assessmentPayload = {
                user: { 
                    id: this.app.currentUser.id 
                },
                skillName: assessmentData.skillName,
                skillLevel: assessmentData.skillLevel
            };

            console.log('📤 Sending payload to server:', assessmentPayload);

            const response = await this.apiService.post('/self-assessments', assessmentPayload);
            
            console.log('✅ Server response:', response);
            
            if (response.status === 'SUCCESS') {
                this.app.showNotification('Самооценка успешно отправлена', 'success');
                this.view.resetForm();
                await this.loadAssessments();
            } else {
                throw new Error(response.message || 'Неизвестная ошибка сервера');
            }
            
        } catch (error) {
            console.error('❌ Failed to create self-assessment:', error);
            
            let errorMessage = 'Ошибка создания самооценки';
            if (error.message.includes('500')) {
                errorMessage += ': Ошибка сервера';
            } else if (error.message.includes('уже существует')) {
                errorMessage += ': Самооценка этого навыка уже существует';
            } else {
                errorMessage += ': ' + error.message;
            }
            
            this.app.showNotification(errorMessage, 'error');
        } finally {
            this.view.showLoading(false);
        }
    }

    async handleAssessmentAction(action, assessmentId) {
        switch (action) {
            case 'delete':
                await this.deleteAssessment(assessmentId);
                break;
        }
    }

    async deleteAssessment(assessmentId) {
        if (!confirm('Вы уверены, что хотите удалить эту самооценку?')) {
            return;
        }

        try {
            await this.apiService.delete(`/self-assessments/${assessmentId}`);
            
            this.app.showNotification('Самооценка успешно удалена', 'success');
            await this.loadAssessments();
            
        } catch (error) {
            console.error('❌ Failed to delete assessment:', error);
            this.app.showNotification('Ошибка удаления самооценки: ' + error.message, 'error');
        }
    }
}