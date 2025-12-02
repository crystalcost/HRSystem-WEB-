import { BaseView } from './BaseView.js';

export class DashboardView extends BaseView {
    constructor() {
        super('dashboard-view');
    }

    renderDashboard(user, cards) {
        this.updateElement('#welcome-username', user.username);
        
        const grid = this.container?.querySelector('#dashboard-grid');
        if (!grid) return;

        grid.innerHTML = cards.map(card => `
            <div class="dashboard-card" data-view="${card.view}">
                <div class="icon">${card.icon}</div>
                <h3>${card.title}</h3>
                <p>${card.description}</p>
                <div class="card-arrow">→</div>
            </div>
        `).join('');
    }

    bindCardClickHandler(handler) {
        this.bindDelegate('.dashboard-card', 'click', (e, card) => {
            const viewName = card?.dataset.view;
            if (viewName) handler(viewName);
        });
    }

    showUserStats(stats) {
        const statsHtml = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalUsers || 0}</div>
                    <div class="stat-label">Пользователей</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.pendingEvaluations || 0}</div>
                    <div class="stat-label">Оценок ожидает</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.trainingRequests || 0}</div>
                    <div class="stat-label">Заявок на обучение</div>
                </div>
            </div>
        `;
        
        const existingStats = this.container?.querySelector('.stats-grid');
        if (existingStats) {
            existingStats.innerHTML = statsHtml;
        } else {
            const welcomeMessage = this.container?.querySelector('.welcome-message');
            if (welcomeMessage) welcomeMessage.insertAdjacentHTML('afterend', statsHtml);
        }
    }
}