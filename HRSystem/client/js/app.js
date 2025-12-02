import { ApiService } from './services/ApiService.js';

class App {
    constructor() {
        this.currentUser = null;
        this.currentPresenter = null;
        this.apiService = new ApiService();
        this.presenters = {};
        this.views = {};
        this.modalCallbacks = new Map();
    }

    async init() {
        await this.initPresenters();
        this.initViews();
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.showDashboard();
            } catch (error) {
                this.logout();
            }
        } else {
            this.showAuth();
        }
    }

    async initPresenters() {
        try {
            const { AuthPresenter } = await import('./presenters/AuthPresenter.js');
            const { UserPresenter } = await import('./presenters/UserPresenter.js');
            const { ProfilePresenter } = await import('./presenters/ProfilePresenter.js');
            const { EvaluationPresenter } = await import('./presenters/EvaluationPresenter.js');
            const { FeedbackPresenter } = await import('./presenters/FeedbackPresenter.js');
            const { SelfAssessmentPresenter } = await import('./presenters/SelfAssessmentPresenter.js');
            const { TrainingPresenter } = await import('./presenters/TrainingPresenter.js');
            const { IDPManagerPresenter } = await import('./presenters/IDPManagerPresenter.js');
            const { ProgressMonitoringPresenter } = await import('./presenters/ProgressMonitoringPresenter.js');
            this.presenters = {
                'auth': new AuthPresenter(this),
                'users': new UserPresenter(this),
                'profile': new ProfilePresenter(this),
                'evaluations': new EvaluationPresenter(this), 
                'feedback': new FeedbackPresenter(this),
                'self-assessment': new SelfAssessmentPresenter(this), 
                'training': new TrainingPresenter(this),
                'idp-manager': new IDPManagerPresenter(this),
                'progress-monitoring': new ProgressMonitoringPresenter(this)
            };
        } catch (error) {
            this.createFallbackPresenters();
        }
    }

    createFallbackPresenters() {
        class FallbackPresenter {
            constructor(viewId) { this.viewId = viewId; }
            show() {
                const view = document.getElementById(this.viewId);
                if (view) view.classList.add('active');
            }
            hide() {
                const view = document.getElementById(this.viewId);
                if (view) view.classList.remove('active');
            }
            onViewShow() {}
        }
        this.presenters = {
            'auth': new FallbackPresenter('auth-view'),
            'users': new FallbackPresenter('users-view'),
            'profile': new FallbackPresenter('profile-view'),
            'evaluations': new FallbackPresenter('evaluations-view'), 
            'feedback': new FallbackPresenter('feedback-view'),
            'self-assessment': new FallbackPresenter('self-assessment-view'), 
            'training': new FallbackPresenter('training-view'),
            'idp-manager': new FallbackPresenter('idp-manager-view'),
            'progress-monitoring': new FallbackPresenter('progress-monitoring-view')
        };
    }

    initViews() {
        if (typeof DashboardView !== 'undefined') {
            this.views.dashboard = new DashboardView();
            this.views.dashboard.bindCardClickHandler((viewName) => this.showView(viewName));
        }
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
        const closeBtn = document.querySelector('.close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hideModal());
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal')) this.hideModal();
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchAuthTab(tab);
            });
        });
        window.addEventListener('auth-expired', () => {
            this.showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
            this.logout();
        });
        this.setupProfilePasswordToggles();
    }

    setupProfilePasswordToggles() {
        this.addPasswordToggleToField('user-password');
        this.addPasswordToggleToField('user-confirm-password');
    }

    addPasswordToggleToField(fieldId) {
        const passwordInput = document.getElementById(fieldId);
        if (!passwordInput) return;
        const container = document.createElement('div');
        container.className = 'password-input-container';
        const existingClasses = passwordInput.className;
        const existingStyle = passwordInput.style.cssText;
        passwordInput.parentNode.insertBefore(container, passwordInput);
        container.appendChild(passwordInput);
        passwordInput.className = existingClasses;
        passwordInput.style.cssText = existingStyle;
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '◎';
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            toggleBtn.innerHTML = type === 'password' ? '◎' : '◉';
        });
        container.appendChild(toggleBtn);
    }

    updateFooter() {
        const footer = document.getElementById('main-footer');
        const employeeLinksSection = document.getElementById('employee-footer-links');
        if (!footer || !employeeLinksSection) return;
        footer.style.display = 'block';
        employeeLinksSection.innerHTML = '';
        if (this.currentUser && this.isEmployee()) {
            const policyLink = document.createElement('a');
            policyLink.className = 'policy-link';
            policyLink.innerHTML = `
                <img src="resources/images/policy.png" alt="Документ" 
                     onerror="this.style.display='none'; this.parentNode.innerHTML='📄 Политика компании'"
                     style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;">
                Политика компании
            `;
            policyLink.onclick = () => this.showCompanyPolicy();
            employeeLinksSection.appendChild(policyLink);
        }
    }
    
    showCompanyPolicy() {
        const policyContent = `
            <h2>Политика компании</h2>
            <div class="policy-content" style="max-height: 400px; overflow-y: auto; padding: 1rem; border: 1px solid #dee2e6; border-radius: 4px; background: #f8f9fa;">
                <h3>1. Общие положения</h3>
                <p>1.1. Настоящая Политика определяет основные принципы, правила и процедуры, регулирующие работу в нашей компании.</p>
                <p>1.2. Все сотрудники обязаны соблюдать положения настоящей Политики.</p>
                <p>1.3. Компания обеспечивает равные возможности для всех сотрудников и соблюдение трудовых прав.</p>
                <h3>2. Рабочее время и график</h3>
                <p>2.1. Стандартный рабочий день с 9:00 до 18:00 с перерывом на обед с 12:00 до 13:00.</p>
                <p>2.2. Гибкий график работы должен быть согласован с непосредственным руководителем.</p>
                <p>2.3. Сверхурочная работа оплачивается в двойном размере и требует предварительного согласования.</p>
                <h3>3. Отпуска и время отдыха</h3>
                <p>3.1. Ежегодный оплачиваемый отпуск составляет 28 календарных дней.</p>
                <p>3.2. Заявка на отпуск подается не менее чем за 2 недели до начала.</p>
                <p>3.3. Больничные листы оплачиваются в соответствии с законодательством РФ.</p>
                <h3>4. Дресс-код и внешний вид</h3>
                <p>4.1. В компании действует деловой стиль одежды.</p>
                <p>4.2. При встречах с клиентами обязателен строгий деловой костюм.</p>
                <h3>5. Использование ресурсов компании</h3>
                <p>5.1. Корпоративная техника и оборудование предназначены для рабочих задач.</p>
                <p>5.2. Запрещена установка нелицензионного программного обеспечения.</p>
                <p>5.3. Персональное использование интернета допускается в обеденное время.</p>
                <h3>6. Профессиональное развитие</h3>
                <p>6.1. Компания финансирует обучение и повышение квалификации сотрудников.</p>
                <p>6.2. Заявки на обучение согласовываются с непосредственным руководителем.</p>
                <p>6.3. После обучения сотрудник обязан отработать в компании не менее 1 года.</p>
                <h3>7. Оценка эффективности</h3>
                <p>7.1. KPI оцениваются ежеквартально по установленным метрикам.</p>
                <p>7.2. Результаты оценки влияют на премирование и карьерный рост.</p>
                <p>7.3. Обратная связь предоставляется в течение 5 рабочих дней после оценки.</p>
                <h3>8. Вознаграждение и льготы</h3>
                <p>8.1. Заработная плата состоит из оклада и переменной премиальной части.</p>
                <p>8.2. Выплата заработной платы производится 2 раза в месяц.</p>
                <h3>9. Дисциплинарная ответственность</h3>
                <p>9.1. Нарушения трудовой дисциплины влекут дисциплинарные взыскания.</p>
                <p>9.2. Грубые нарушения могут привести к увольнению.</p>   
                <h3>10. Заключительные положения</h3>
                <p>10.1. Политика может быть изменена с уведомлением сотрудников за 2 недели.</p>
                <p>10.2. Все спорные вопросы решаются в соответствии с трудовым законодательством.</p>
                <p>10.3. Сотрудники могут вносить предложения по улучшению политики через HR-отдел.</p>
                <p style="margin-top: 2rem; font-style: italic; text-align: center;">
                    Дата вступления в силу: 1 сентября 2025 года<br>
                    Последнее обновление: 1 ноября 2025 года<br>
                    Ответственный за исполнение: Отдел по работе с персоналом
                </p>
            </div>
            <div class="form-actions" style="margin-top: 1rem;">
                <button type="button" class="btn btn-primary" onclick="app.hideModal()">Закрыть</button>
            </div>
        `;
        this.showModal(policyContent);
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });
    }

    showAuth() {
        this.hideAllViews();
        if (this.presenters['auth'] && typeof this.presenters['auth'].show === 'function') {
            this.presenters['auth'].show();
            this.currentPresenter = this.presenters['auth'];
        } else {
            const authView = document.getElementById('auth-view');
            if (authView) authView.classList.add('active');
            this.currentPresenter = null;
        }
        this.hideNavigation();
        setTimeout(() => this.updateFooter(), 100);
    }

    async showDashboard() {
        this.hideAllViews();
        await this.loadUserProfile();
        if (this.views.dashboard && typeof this.views.dashboard.show === 'function') {
            this.views.dashboard.show();
        } else {
            const dashboardView = document.getElementById('dashboard-view');
            if (dashboardView) dashboardView.classList.add('active');
        }
        this.updateNavigation();
        this.showNavigation();
        this.updateDashboard();
        this.currentPresenter = null;
        setTimeout(() => this.updateFooter(), 100);
    }

    async showView(viewName) {
        this.hideAllViews();
        const presenter = this.presenters[viewName];
        if (presenter && typeof presenter.show === 'function') {
            presenter.show();
            this.currentPresenter = presenter;
            if (typeof presenter.onViewShow === 'function') presenter.onViewShow();
        } else {
            const view = document.getElementById(`${viewName}-view`);
            if (view) view.classList.add('active');
        }
    }

    hideAllViews() {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        Object.values(this.presenters).forEach(presenter => {
            if (presenter && typeof presenter.hide === 'function') presenter.hide();
        });
        if (this.views.dashboard && typeof this.views.dashboard.hide === 'function') {
            this.views.dashboard.hide();
        }
    }

    hideNavigation() {
        const mainNav = document.getElementById('main-nav');
        const userInfo = document.getElementById('user-info');
        if (mainNav) mainNav.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }

    showNavigation() {
        const mainNav = document.getElementById('main-nav');
        const userInfo = document.getElementById('user-info');
        if (mainNav) mainNav.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'flex';
    }

    updateNavigation() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;
        
        nav.innerHTML = '';
        
        const commonLinks = [{ name: 'Главная', view: 'dashboard' }];
        
        const roleLinks = {
            'ADMIN': [{ name: 'Пользователи', view: 'users' }],
            'MANAGER': [
                { name: 'Оценки', view: 'evaluations' },
                { name: 'Заявки на обучение', view: 'training' },
                { name: 'IDP', view: 'idp-manager' },
                { name: 'Мониторинг прогресса', view: 'progress-monitoring' }
            ],
            'EMPLOYEE': [
                { name: 'Самооценка', view: 'self-assessment' },
                { name: 'Отзывы', view: 'feedback' },
                { name: 'Заявки на обучение', view: 'training' }
            ]
        };
        
        const links = [...commonLinks, ...(roleLinks[this.currentUser.role] || [])];
        
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = link.name;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView(link.view);
            });
            nav.appendChild(a);
        });
    }

    updateUserDisplay() {
        const usernameDisplay = document.getElementById('username-display');
        const welcomeUsername = document.getElementById('welcome-username');
        
        if (usernameDisplay) usernameDisplay.textContent = this.currentUser.username;
        
        if (welcomeUsername) {
            const displayName = this.getUserDisplayName();
            welcomeUsername.textContent = displayName;
        }
    }

    getUserDisplayName() {
        if (!this.currentUser) return 'Пользователь';
        const firstName = this.currentUser.firstName || '';
        const lastName = this.currentUser.lastName || '';
        if (firstName && lastName) return `${firstName} ${lastName}`;
        else if (firstName) return firstName;
        else if (lastName) return lastName;
        else return this.currentUser.username || 'Пользователь';
    }

    updateDashboard() {
        this.updateUserDisplay();
        this.updateNavigation();
        this.updateDashboardCards();
    }

    updateDashboardCards() {
        const grid = document.getElementById('dashboard-grid');
        if (!grid) return;
        
        const cards = [
            { 
                title: 'Личный кабинет', 
                view: 'profile', 
                description: 'Управление вашим профилем и настройками',
                icon: '👤',
                image: 'resources/images/cabinet.png',
                roles: ['ADMIN', 'MANAGER', 'EMPLOYEE']
            },
            { 
                title: 'Пользователи', 
                view: 'users', 
                description: 'Управление пользователями системы',
                icon: '👥',
                image: 'resources/images/users.png',
                roles: ['ADMIN']
            },
            { 
                title: 'Оценки', 
                view: 'evaluations', 
                description: 'Просмотр и управление оценками сотрудников',
                icon: '📊',
                image: 'resources/images/eval.png',
                roles: ['MANAGER']
            },
            { 
                title: 'Самооценка', 
                view: 'self-assessment', 
                description: 'Оцените свои навыки и компетенции',
                icon: '⭐',
                image: 'resources/images/self.png',
                roles: ['EMPLOYEE']
            },
            { 
                title: 'Отзывы', 
                view: 'feedback', 
                description: 'Просмотр и оставление отзывов',
                icon: '💬',
                image: 'resources/images/feedback.png',
                roles: ['MANAGER', 'EMPLOYEE']
            },
            { 
                title: 'Заявки на обучение', 
                view: 'training', 
                description: 'Подача и отслеживание заявок на обучение',
                icon: '🎓',
                image: 'resources/images/training.png',
                roles: ['MANAGER', 'EMPLOYEE']
            },
            { 
                title: 'IDP', 
                view: 'idp-manager', 
                description: 'Управление обучением сотрудников на основе KPI',
                icon: '📈',
                image: 'resources/images/idp.png',
                roles: ['MANAGER']
            },
            { 
                title: 'Мониторинг прогресса', 
                view: 'progress-monitoring', 
                description: 'Отслеживание прогресса сотрудников',
                icon: '📊',
                image: 'resources/images/progress.png',
                roles: ['MANAGER']
            }
        ];
        grid.innerHTML = '';
        cards.forEach(card => {
            if (card.roles.includes(this.currentUser.role)) {
                const cardElement = document.createElement('div');
                cardElement.className = 'dashboard-card';
                cardElement.innerHTML = `
                    <div class="icon">
                        <img src="${card.image}" alt="${card.title}" 
                             onerror="this.style.display='none'; this.parentNode.innerHTML='${card.icon}'"
                             style="width: 40px; height: 40px; object-fit: contain;">
                    </div>
                    <h3>${card.title}</h3>
                    <p>${card.description}</p>
                    <div class="card-arrow">→</div>
                `;
                cardElement.addEventListener('click', () => this.showView(card.view));
                grid.appendChild(cardElement);
            }
        });
    }

    async loadUserProfile() {
        try {
            if (!this.currentUser || !this.currentUser.id) {
                return;
            }
            const userDetails = await this.apiService.get(`/users/${this.currentUser.id}`);
            this.currentUser = {
                ...this.currentUser,
                firstName: userDetails.firstName || '',
                lastName: userDetails.lastName || '',
                email: userDetails.email || ''
            };
            localStorage.setItem('userData', JSON.stringify(this.currentUser));
            this.updateUserDisplay();
        } catch (error) {
            this.showNotification('Не удалось загрузить данные профиля: ' + error.message, 'error');
        }
    }

    showModal(content, onSubmit = null) {
        const modalBody = document.getElementById('modal-body');
        const modal = document.getElementById('modal');
        
        if (!modalBody || !modal) return;
        
        modalBody.innerHTML = content;
        modal.style.display = 'block';
        
        if (onSubmit) {
            const form = modalBody.querySelector('form');
            if (form) {
                const existingListener = this.modalCallbacks.get('submit');
                if (existingListener) form.removeEventListener('submit', existingListener);
                
                const newListener = (e) => {
                    e.preventDefault();
                    onSubmit(form);
                };
                
                form.addEventListener('submit', newListener);
                this.modalCallbacks.set('submit', newListener);
            }
        }
    }

    hideModal() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        if (modal) modal.style.display = 'none';
        if (modalBody) modalBody.innerHTML = '';
        
        this.modalCallbacks.clear();
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');
        if (!notification || !messageEl) {
            return;
        }
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => notification.classList.add('hidden'), 6500);
    }

    showLoading(show) {
        const appElement = document.getElementById('app');
        if (appElement) show ? appElement.classList.add('loading') : appElement.classList.remove('loading');
    }

    setCurrentUser(userData) {
        this.currentUser = userData;
        localStorage.setItem('userData', JSON.stringify(userData));
        this.showDashboard();
        setTimeout(() => this.updateFooter(), 100);
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        this.currentUser = null;
        this.currentPresenter = null;
        setTimeout(() => {
            this.updateFooter();
            this.showAuth();
        }, 100);
    }

    getAuthToken() {
        return localStorage.getItem('authToken');
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    isAdmin() { return this.hasRole('ADMIN'); }
    isManager() { return this.hasRole('MANAGER'); }
    isEmployee() { return this.hasRole('EMPLOYEE'); }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.app = new App();
        await window.app.init();
        console.log('HR System успешно запущен');
    } catch (error) {
        console.error('Ошибка запуска HR System:', error);
    }
});

window.HRSystem = { App };