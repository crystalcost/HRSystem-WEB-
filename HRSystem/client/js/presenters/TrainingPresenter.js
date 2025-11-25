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

    hide() {
        this.view.hide();
    }

    onViewShow() {
        this.loadRequests();
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
            
            this.requests = requests.map(requestData => {
                const request = TrainingRequest.fromApiData(requestData);
                request.getDurationDescription = () => this.calculateDurationDescription(request.submittedAt);
                request.isActionable = request.status === 'PENDING' || request.status === 'APPROVED';
                request.canBeModified = request.status === 'PENDING' && request.user?.id === this.app.currentUser.id;
                request.canBeManaged = (this.app.isAdmin() || this.app.isManager()) && request.status === 'PENDING';
                request.canViewDetails = (this.app.isAdmin() || this.app.isManager()) || 
                    request.user?.id === this.app.currentUser.id;
                request.canDelete = (request.status === 'APPROVED' || request.status === 'DENIED' || request.status === 'COMPLETED') && 
                    (this.app.isAdmin() || this.app.isManager());
                request.statusText = this.getStatusText(request.status);
                return request;
            });
            
            this.view.renderRequests(this.requests, this.app.isManager() || this.app.isAdmin());
    
        } catch (error) {
            console.error('Failed to load training requests:', error);
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

            console.log('Creating training request with data:', requestData);

            const requestPayload = {
                user: { 
                    id: this.app.currentUser.id 
                },
                courseName: requestData.courseName
            };

            console.log('Sending payload to server:', requestPayload);

            const response = await this.apiService.post('/training-requests', requestPayload);
            
            console.log('Server response:', response);
            
            if (response.status === 'SUCCESS') {
                this.app.showNotification('Заявка на обучение успешно отправлена', 'success');
                this.hideRequestForm();
                await this.loadRequests();
            } else {
                throw new Error(response.message || 'Неизвестная ошибка сервера');
            }
            
        } catch (error) {
            console.error('Failed to create training request:', error);
            
            let errorMessage = 'Ошибка создания заявки';
            if (error.message.includes('500')) {
                errorMessage += ': Ошибка сервера. Проверьте логи сервера.';
            } else if (error.message.includes('уже существует')) {
                errorMessage += ': Заявка на этот курс уже существует';
            } else if (error.message.includes('Максимум')) {
                errorMessage += ': Превышен лимит заявок';
            } else {
                errorMessage += ': ' + error.message;
            }
            
            this.app.showNotification(errorMessage, 'error');
        } finally {
            this.view.showLoading(false);
        }
    }

    async handleRequestAction(action, requestId) {
        switch (action) {
            case 'cancel':
                await this.cancelRequest(requestId);
                break;
            case 'view':
                await this.showRequestDetails(requestId);
                break;
            case 'approve':
                await this.updateRequestStatus(requestId, 'APPROVED');
                break;
            case 'deny':
                await this.updateRequestStatus(requestId, 'DENIED');
                break;
            case 'delete':
                await this.deleteRequest(requestId);
                break;
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

        if (!confirm('Вы уверены, что хотите отменить эту заявку?')) {
            return;
        }

        try {
            await this.apiService.delete(`/training-requests/${requestId}`);
            
            this.app.showNotification('Заявка успешно отменена', 'success');
            await this.loadRequests();
            
        } catch (error) {
            console.error('Failed to cancel request:', error);
            this.app.showNotification('Ошибка отмены заявки: ' + error.message, 'error');
        }
    }

    async deleteRequest(requestId) {
        if (!confirm('Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.')) {
            return;
        }
    
        try {
            await this.apiService.delete(`/training-requests/${requestId}`);
            
            this.app.showNotification('Заявка успешно удалена', 'success');
            this.app.hideModal();
            await this.loadRequests();
            
        } catch (error) {
            console.error('Failed to delete request:', error);
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

        const statusText = {
            'APPROVED': 'одобрена',
            'DENIED': 'отклонена'
        }[status];

        if (!confirm(`Вы уверены, что хотите ${statusText} эту заявку?`)) {
            return;
        }

        try {
            const response = await this.apiService.put(`/training-requests/${requestId}/status`, { status });
            
            if (response.status === 'SUCCESS') {
                this.app.showNotification(`Заявка успешно ${statusText}`, 'success');
                await this.loadRequests();
            } else {
                throw new Error(response.message || 'Неизвестная ошибка');
            }
            
        } catch (error) {
            console.error('Failed to update request status:', error);
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
    
            const canManage = (this.app.isAdmin() || this.app.isManager()) && request.status === 'PENDING';
            const canCancel = request.user?.id === this.app.currentUser.id && request.status === 'PENDING';
            const canDelete = (request.status === 'APPROVED' || request.status === 'DENIED' || request.status === 'COMPLETED') && 
                (this.app.isAdmin() || this.app.isManager());
    
            const statusActions = canManage ? `
                <div class="action-buttons" style="margin: 15px 0; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-success btn-sm" onclick="app.presenters.training.updateRequestStatus(${request.requestId}, 'APPROVED')">
                        ✅ Одобрить
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="app.presenters.training.updateRequestStatus(${request.requestId}, 'DENIED')">
                        ❌ Отклонить
                    </button>
                </div>
            ` : '';
    
            const userActions = (canCancel || canDelete) ? `
                <div class="action-buttons" style="margin: 10px 0; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${canCancel ? `
                        <button class="btn btn-danger btn-sm" onclick="app.presenters.training.cancelRequest(${request.requestId})">
                            ❌ Отменить заявку
                        </button>
                    ` : ''}
                    ${canDelete ? `
                        <button class="btn btn-danger btn-sm" onclick="app.presenters.training.deleteRequest(${request.requestId})">
                            🗑️ Удалить заявку
                        </button>
                    ` : ''}
                </div>
            ` : '';
    
            const pendingWarning = request.status === 'PENDING' && this.calculateDaysSince(request.submittedAt) > 7 ? `
                <div class="detail-section warning">
                    <h3>⚠️ Внимание</h3>
                    <p>Эта заявка находится на рассмотрении более 7 дней. Рекомендуется ускорить обработку.</p>
                </div>
            ` : '';
    
            const detailsHtml = `
                <h2>Детали заявки на обучение #${request.requestId}</h2>
                <div class="request-details">
                    <div class="detail-section">
                        <h3>Информация о заявке</h3>
                        <p><strong>Курс:</strong> ${request.courseName}</p>
                        <p><strong>Статус:</strong> 
                            <span class="status-badge status-${request.status?.toLowerCase()}">
                                ${request.statusText || request.status}
                            </span>
                        </p>
                        <p><strong>Приоритет:</strong> 
                            <span class="priority-${request.priority}">
                                ${this.getPriorityText(request.priority)}
                            </span>
                        </p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Информация о сотруднике</h3>
                        <p><strong>Сотрудник:</strong> ${request.user?.firstName || 'Не указан'} ${request.user?.lastName || ''}</p>
                        <p><strong>Email:</strong> ${request.user?.email || 'Не указан'}</p>
                        <p><strong>Роль:</strong> ${request.user?.role?.name || 'Не указана'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Временные метки</h3>
                        <p><strong>Дата подачи:</strong> ${request.submittedAtFormatted || new Date(request.submittedAt).toLocaleDateString('ru-RU')}</p>
                        <p><strong>Длительность рассмотрения:</strong> ${request.getDurationDescription ? request.getDurationDescription() : 'Н/Д'}</p>
                    </div>
                    
                    ${pendingWarning}
                    
                    ${statusActions}
                    ${userActions}
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Закрыть</button>
                </div>
            `;
    
            this.app.showModal(detailsHtml);
            
        } catch (error) {
            console.error('Failed to show request details:', error);
            this.app.showNotification('Ошибка загрузки деталей заявки', 'error');
        }
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

    getPriorityText(priority) {
        const texts = {
            'high': 'Высокий',
            'medium': 'Средний', 
            'low': 'Низкий',
            'normal': 'Обычный'
        };
        return texts[priority] || priority;
    }

    calculateDurationDescription(submittedAt) {
        if (!submittedAt) return 'Н/Д';
        
        try {
            const submittedDate = new Date(submittedAt);
            const now = new Date();
            const diffTime = Math.abs(now - submittedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return '1 дн.';
            if (diffDays < 7) return `${diffDays} дн.`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед.`;
            return `${Math.floor(diffDays / 30)} мес.`;
        } catch (error) {
            return 'Н/Д';
        }
    }

    calculateDaysSince(submittedAt) {
        if (!submittedAt) return 0;
        
        try {
            const submittedDate = new Date(submittedAt);
            const now = new Date();
            const diffTime = Math.abs(now - submittedDate);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            return 0;
        }
    }
}