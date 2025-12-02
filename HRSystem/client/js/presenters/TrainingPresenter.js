import { ApiService } from '../services/ApiService.js';
import { TrainingRequest } from '../models/TrainingRequest.js';
import { TrainingView } from '../views/TrainingView.js';

export class TrainingPresenter {
    constructor(app) {
        this.app = app;
        this.apiService = new ApiService();
        this.view = new TrainingView();
        this.requests = [];
        this.init();
    }

    init() {
        this.view.bindAddRequestHandler(() => this.showRequestForm());
        this.view.bindSubmitRequestHandler((requestData) => this.handleCreateRequest(requestData));
        this.view.bindCancelRequestHandler(() => this.hideRequestForm());
        this.view.bindRequestActionsHandler((action, requestId) => this.handleRequestAction(action, requestId));
    }

    async show() {
        this.view.show();
        await this.loadRequests();
    }

    async loadRequests() {
        try {
            this.view.showLoading(true);
            let requests;
            if (this.app.isAdmin() || this.app.isManager()) {
                requests = await this.apiService.get('/training-requests');
            } else {
                const userId = this.app.currentUser.id;
                requests = await this.apiService.get(`/training-requests/user/${userId}`);
            }
            
            this.requests = requests.map(requestData => TrainingRequest.fromApiData(requestData));
            this.view.renderRequests(this.requests, this.app.isManager() || this.app.isAdmin());
        } catch (error) {
            this.app.showNotification('Ошибка загрузки заявок: ' + error.message, 'error');
            this.view.renderRequests([]);
        } finally {
            this.view.showLoading(false);
        }
    }

    showRequestForm() {
        if (this.app.isManager() && !this.app.isAdmin()) {
            this.app.showNotification('Менеджеры не могут создавать заявки на обучение', 'info');
            return;
        }
        this.view.showRequestForm();
    }

    hideRequestForm() {
        this.view.hideRequestForm();
    }

    async handleCreateRequest(requestData) {
        try {
            this.view.showLoading(true);
            const pendingRequests = this.requests.filter(request => 
                request.user?.id === this.app.currentUser.id && 
                request.status === 'PENDING'
            );
            if (pendingRequests.length >= 2) {
                this.app.showNotification('Нельзя подавать более 2 заявок на рассмотрении одновременно. Дождитесь решения по текущим заявкам.', 'error');
                return;
            }
            const existingRequest = this.requests.find(request => 
                request.courseName.toLowerCase() === requestData.courseName.toLowerCase() &&
                request.user?.id === this.app.currentUser.id
            );
            if (existingRequest) {
                this.app.showNotification('Заявка с таким названием курса уже существует', 'error');
                return;
            }
            const requestPayload = {
                user: { id: this.app.currentUser.id },
                courseName: requestData.courseName
            };
            const request = new TrainingRequest(requestPayload);
            const validationErrors = request.validate();
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
            const response = await this.apiService.post('/training-requests', requestPayload);
            this.app.showNotification('Заявка на обучение успешно отправлена', 'success');
            this.hideRequestForm();
            await this.loadRequests();
        } catch (error) {
            this.app.showNotification('Ошибка создания заявки: ' + error.message, 'error');
        } finally {
            this.view.showLoading(false);
        }
    }

    async handleRequestAction(action, requestId) {
        switch (action) {
            case 'cancel': await this.cancelRequest(requestId); break;
            case 'view': await this.showRequestDetails(requestId); break;
            case 'approve': await this.updateRequestStatus(requestId, 'APPROVED'); break;
            case 'deny': await this.updateRequestStatus(requestId, 'DENIED'); break;
            case 'delete': await this.deleteRequest(requestId); break;
        }
    }

    async cancelRequest(requestId) {
        const request = this.requests.find(r => r.requestId === requestId);
        if (!request) return;

        if (request.user?.id !== this.app.currentUser.id) {
            this.app.showNotification('Вы можете отменять только свои заявки', 'error');
            return;
        }

        if (request.status !== 'PENDING') {
            this.app.showNotification('Можно отменять только заявки на рассмотрении', 'error');
            return;
        }

        if (!confirm('Вы уверены, что хотите отменить эту заявку?')) return;

        try {
            await this.apiService.delete(`/training-requests/${requestId}`);
            this.app.showNotification('Заявка успешно отменена', 'success');
            await this.loadRequests();
        } catch (error) {
            this.app.showNotification('Ошибка отмены заявки: ' + error.message, 'error');
        }
    }

    async deleteRequest(requestId) {
        if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;
    
        try {
            await this.apiService.delete(`/training-requests/${requestId}`);
            this.app.showNotification('Заявка успешно удалена', 'success');
            this.app.hideModal();
            await this.loadRequests();
        } catch (error) {
            this.app.showNotification('Ошибка удаления заявки: ' + error.message, 'error');
        }
    }

    async updateRequestStatus(requestId, status) {
        if (!this.app.isAdmin() && !this.app.isManager()) {
            this.app.showNotification('Недостаточно прав для изменения статуса заявки', 'error');
            return;
        }

        const request = this.requests.find(r => r.requestId === requestId);
        if (!request) {
            this.app.showNotification('Заявка не найдена', 'error');
            return;
        }

        if (request.status !== 'PENDING') {
            this.app.showNotification('Можно изменять статус только заявок на рассмотрении', 'error');
            return;
        }

        const statusText = { 'APPROVED': 'одобрена', 'DENIED': 'отклонена' }[status];
        if (!confirm(`Вы уверены, что хотите ${statusText} эту заявку?`)) return;

        try {
            const response = await this.apiService.put(`/training-requests/${requestId}/status`, { status });
            this.app.showNotification(`Заявка успешно ${statusText}`, 'success');
            await this.loadRequests();
        } catch (error) {
            this.app.showNotification('Ошибка обновления статуса: ' + error.message, 'error');
        }
    }

    async showRequestDetails(requestId) {
        try {
            const request = this.requests.find(r => r.requestId === requestId);
            if (!request) {
                this.app.showNotification('Заявка не найдена', 'error');
                return;
            }
    
            const detailsHtml = this.view.getRequestDetailsHtml(request, this.app);
            this.app.showModal(detailsHtml);
        } catch (error) {
            this.app.showNotification('Ошибка загрузки деталей заявки', 'error');
        }
    }
}