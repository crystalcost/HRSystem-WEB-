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
                console.error('Error parsing user data:', error);
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
            const { EvaluationPresenter } = await import('./presenters/EvaluationPresenter.js');
            const { FeedbackPresenter } = await import('./presenters/FeedbackPresenter.js');
            const { SelfAssessmentPresenter } = await import('./presenters/SelfAssessmentPresenter.js');
            const { TrainingPresenter } = await import('./presenters/TrainingPresenter.js');
            const { IDPManagerPresenter } = await import('./presenters/IDPManagerPresenter.js');
            const { ProgressMonitoringPresenter } = await import('./presenters/ProgressMonitoringPresenter.js');

            this.presenters = {
                'auth': new AuthPresenter(this),
                'user': new UserPresenter(this),
                'evaluations': new EvaluationPresenter(this), 
                'feedback': new FeedbackPresenter(this),
                'self-assessment': new SelfAssessmentPresenter(this), 
                'training': new TrainingPresenter(this),
                'idp-manager': new IDPManagerPresenter(this),
                'progress-monitoring': new ProgressMonitoringPresenter(this)
            };
            console.log('✅ All presenters initialized:', Object.keys(this.presenters));
        } catch (error) {
            console.error('❌ Error loading presenters:', error);
            
            this.createFallbackPresenters();
        }
    }

    createFallbackPresenters() {
        
        class FallbackPresenter {
            constructor(viewId) {
                this.viewId = viewId;
            }
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
            'user': new FallbackPresenter('users-view'),
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
        } else {
            console.warn('DashboardView not found, using fallback');
        }
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal')) {
                this.hideModal();
            }
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchAuthTab(tab);
            });
        });

        const changePasswordBtn = document.getElementById('change-password');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.handlePasswordChange();
            });
        }

        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('input', () => this.handleProfileFormChange());
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        const cancelEditBtn = document.getElementById('cancel-profile-edit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.cancelProfileEdit());
        }

        window.addEventListener('auth-expired', () => {
            this.showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
            this.logout();
        });

        window.addEventListener('online', () => {
            this.showNotification('Подключение восстановлено', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Отсутствует подключение к интернету', 'error');
        });
    }

    updateFooter() {
        const footer = document.getElementById('main-footer');
        const employeeLinksSection = document.getElementById('employee-footer-links');
        
        if (!footer || !employeeLinksSection) {
            console.log('Footer elements not found in DOM yet');
            return;
        }
        footer.style.display = 'block';
        employeeLinksSection.innerHTML = '';
        if (this.currentUser && this.isEmployee()) {
            const policyLink = document.createElement('a');
            policyLink.className = 'policy-link';
            policyLink.textContent = '📄 Политика компании';
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
                
                <h3>2. Рабочее время и график</h3>
                <p>2.1. Стандартный рабочий день с 9:00 до 18:00 с перерывом на обед с 12:00 до 13:00.</p>
                <p>2.2. Гибкий график работы должен быть согласован с непосредственным руководителем.</p>
                
                <h3>3. Дресс-код</h3>
                <p>3.1. В компании принят деловой стиль одежды.</p>
                
                <h3>4. Конфиденциальность</h3>
                <p>4.1. Сотрудники обязаны сохранять конфиденциальность коммерческой информации.</p>
                <p>4.2. Запрещается разглашение персональных данных коллег и клиентов.</p>
                
                <h3>5. Использование ресурсов компании</h3>
                <p>5.1. Корпоративная техника и программное обеспечение должны использоваться в рабочих целях.</p>
                <p>5.2. Запрещается установка нелицензионного программного обеспечения.</p>
                
                <h3>6. Отпуска и больничные</h3>
                <p>6.1. О планируемом отпуске необходимо уведомлять за 2 недели.</p>
                <p>6.2. В случае болезни необходимо уведомить руководителя в первый день отсутствия.</p>
                
                <h3>7. Оценка эффективности</h3>
                <p>7.1. Регулярная оценка KPI проводится ежеквартально.</p>
                <p>7.2. Сотрудник имеет право на обратную связь по результатам оценки.</p>
                
                <h3>8. Профессиональное развитие</h3>
                <p>8.1. Компания поддерживает стремление сотрудников к профессиональному росту.</p>
                <p>8.2. Запросы на обучение рассматриваются в индивидуальном порядке.</p>
                
                <h3>9. Дисциплинарные взыскания</h3>
                <p>9.1. За нарушение правил компании могут применяться дисциплинарные взыскания.</p>
                <p>9.2. Систематические нарушения могут привести к увольнению.</p>
                
                <h3>10. Заключительные положения</h3>
                <p>10.1. Политика может быть изменена с уведомлением сотрудников за 2 недели.</p>
                <p>10.2. Все спорные вопросы решаются в соответствии с трудовым законодательством.</p>
                
                <p style="margin-top: 2rem; font-style: italic; text-align: center;">
                    Дата вступления в силу: 1 сентября 2025 года<br>
                    Последнее обновление: 1 ноября 2025 года
                </p>
            </div>
            <div class="form-actions" style="margin-top: 1rem;">
                <button type="button" class="btn btn-primary" onclick="app.hideModal()">Закрыть</button>
            </div>
        `;
        
        this.showModal(policyContent);
    }

    handleProfileFormChange() {
        if (!this.profileFormChanged) {
            this.showProfileUpdateButton();
        }
        this.profileFormChanged = true;
    }

    showProfileUpdateButton() {
        const updateActions = document.getElementById('profile-update-actions');
        if (updateActions) {
            updateActions.style.display = 'flex';
        }
    }

    hideProfileUpdateButton() {
        const updateActions = document.getElementById('profile-update-actions');
        if (updateActions) {
            updateActions.style.display = 'none';
        }
        this.profileFormChanged = false;
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        try {
            this.showLoading(true);
            
            const formData = new FormData(e.target);
            const profileData = {
                username: formData.get('username'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                roleId: this.currentUser.roleId || 3
            };

            if (!profileData.firstName || !profileData.lastName || !profileData.email) {
                throw new Error('Все поля обязательны для заполнения');
            }

            if (!this.isValidEmail(profileData.email)) {
                throw new Error('Некорректный email адрес');
            }

            const userId = this.currentUser.id;
            console.log('🔄 Отправка данных обновления профиля:', profileData);
            
            const response = await this.apiService.put(`/users/${userId}`, profileData);
            
            console.log('✅ Ответ от сервера:', response);
            
            if (response.status === 'SUCCESS' || response.id) {
                this.showNotification('Данные профиля успешно обновлены', 'success');
                this.hideProfileUpdateButton();
                this.currentUser.firstName = profileData.firstName;
                this.currentUser.lastName = profileData.lastName;
                this.currentUser.email = profileData.email;
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
                this.updateUserDisplay();
            } else {
                throw new Error(response.message || 'Ошибка обновления профиля');
            }
            
        } catch (error) {
            console.error('❌ Ошибка обновления профиля:', error);
            this.showNotification('Ошибка обновления профиля: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    cancelProfileEdit() {
        this.updateProfileInfo();
        this.hideProfileUpdateButton();
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
        this.updateNavigation()
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
            
            
            if (viewName === 'profile') {
                await this.loadUserProfile();
                this.hideProfileUpdateButton();
            }
            
            
            if (typeof presenter.onViewShow === 'function') {
                presenter.onViewShow();
            }
        } else {
            console.warn(`Presenter not found for view: ${viewName}`);
            const view = document.getElementById(`${viewName}-view`);
            if (view) view.classList.add('active');
            
            
            if (viewName === 'profile') {
                await this.loadUserProfile();
            }
        }
    }

    hideAllViews() {
        
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        
        Object.values(this.presenters).forEach(presenter => {
            if (presenter && typeof presenter.hide === 'function') {
                presenter.hide();
            }
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
        
        const commonLinks = [
            { name: 'Главная', view: 'dashboard' }
        ];
        
        const roleLinks = {
            'ADMIN': [
                { name: 'Пользователи', view: 'users' },
                { name: 'Оценки', view: 'evaluations' },
                { name: 'Отзывы', view: 'feedback' }
            ],
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

    getUserDisplayName() 
    {
        if (!this.currentUser) return 'Пользователь';
        
        const firstName = this.currentUser.firstName || '';
        const lastName = this.currentUser.lastName || '';
        
        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        } else if (firstName) {
            return firstName;
        } else if (lastName) {
            return lastName;
        } else {
            return this.currentUser.username || 'Пользователь';
        }
    }

    updateDashboard() {
        
        this.updateUserDisplay();
        
        
        this.updateNavigation();
        
        
        this.updateDashboardCards();
        
        
        this.updateProfileInfo();
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
                roles: ['ADMIN', 'MANAGER', 'EMPLOYEE']
            },
            { 
                title: 'Пользователи', 
                view: 'users', 
                description: 'Управление пользователями системы',
                icon: '👥',
                roles: ['ADMIN']
            },
            { 
                title: 'Оценки', 
                view: 'evaluations', 
                description: 'Просмотр и управление оценками сотрудников',
                icon: '📊',
                roles: ['ADMIN', 'MANAGER']
            },
            { 
                title: 'Самооценка', 
                view: 'self-assessment', 
                description: 'Оцените свои навыки и компетенции',
                icon: '⭐',
                roles: ['EMPLOYEE']
            },
            { 
                title: 'Отзывы', 
                view: 'feedback', 
                description: 'Просмотр и оставление отзывов',
                icon: '💬',
                roles: ['MANAGER', 'EMPLOYEE']
            },
            { 
                title: 'Заявки на обучение', 
                view: 'training', 
                description: 'Подача и отслеживание заявок на обучение',
                icon: '🎓',
                roles: ['MANAGER', 'EMPLOYEE']
            },
            { 
                title: 'IDP', 
                view: 'idp-manager', 
                description: 'Управление обучением сотрудников на основе KPI',
                icon: '📈',
                roles: ['MANAGER']
            },
            { 
                title: 'Мониторинг прогресса', 
                view: 'progress-monitoring', 
                description: 'Отслеживание прогресса сотрудников',
                icon: '📊',
                roles: ['MANAGER']
            }
        ];
        
        grid.innerHTML = '';
        
        cards.forEach(card => {
            if (card.roles.includes(this.currentUser.role)) {
                const cardElement = document.createElement('div');
                cardElement.className = 'dashboard-card';
                cardElement.innerHTML = `
                    <div class="icon">${card.icon}</div>
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
                console.error('No user ID available');
                return;
            }
    
            console.log('🔄 Loading profile for user ID:', this.currentUser.id);
            console.log('📞 Making API call to:', `/users/${this.currentUser.id}`);
            
            const userDetails = await this.apiService.get(`/users/${this.currentUser.id}`);
            console.log('✅ User details received:', userDetails);
            
            
            this.currentUser = {
                ...this.currentUser,
                firstName: userDetails.firstName || '',
                lastName: userDetails.lastName || '',
                email: userDetails.email || ''
            };
            
            console.log('📝 Updated user data:', this.currentUser);
            
            
            localStorage.setItem('userData', JSON.stringify(this.currentUser));

            this.updateUserDisplay();
            
            
            this.updateProfileInfo();
            
        } catch (error) {
            console.error('❌ Failed to load user profile:', error);
            
            
            console.error('Error details:', {
                userId: this.currentUser?.id,
                errorMessage: error.message,
                errorStack: error.stack
            });
            
            this.showNotification('Не удалось загрузить данные профиля: ' + error.message, 'error');
        }
    }

    updateProfileInfo() {
        const profileUsername = document.getElementById('profile-username');
        const profileFirstname = document.getElementById('profile-firstname');
        const profileLastname = document.getElementById('profile-lastname');
        const profileEmail = document.getElementById('profile-email');
        const profileRole = document.getElementById('profile-role');
        
        if (profileUsername) profileUsername.value = this.currentUser.username || '';
        if (profileFirstname) profileFirstname.value = this.currentUser.firstName || '';
        if (profileLastname) profileLastname.value = this.currentUser.lastName || '';
        if (profileEmail) profileEmail.value = this.currentUser.email || '';
        if (profileRole) profileRole.value = this.currentUser.role || '';
        this.originalProfileData = {
            firstName: this.currentUser.firstName,
            lastName: this.currentUser.lastName,
            email: this.currentUser.email
        };
        
        console.log('Profile updated with data:', {
            username: this.currentUser.username,
            firstName: this.currentUser.firstName,
            lastName: this.currentUser.lastName,
            email: this.currentUser.email,
            role: this.currentUser.role
        });
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
                if (existingListener) {
                    form.removeEventListener('submit', existingListener);
                }
                
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
            
            console.log(`${type}: ${message}`);
            return;
        }
        
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 6500);
    }

    showLoading(show) {
        const appElement = document.getElementById('app');
        if (appElement) {
            if (show) {
                appElement.classList.add('loading');
            } else {
                appElement.classList.remove('loading');
            }
        }
    }

    setCurrentUser(userData) {
        this.currentUser = userData;
        localStorage.setItem('userData', JSON.stringify(userData));
        this.showDashboard();
        setTimeout(() => this.updateFooter(), 100);
    }

    async handlePasswordChange() {
        const currentPassword = document.getElementById('current-password');
        const newPassword = document.getElementById('new-password');
        const confirmPassword = document.getElementById('confirm-password');
    
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }
    
        if (!currentPassword.value) {
            this.showNotification('Введите текущий пароль', 'error');
            return;
        }
    
        if (!newPassword.value) {
            this.showNotification('Введите новый пароль', 'error');
            return;
        }
    
        if (newPassword.value !== confirmPassword.value) {
            this.showNotification('Новый пароль и подтверждение не совпадают', 'error');
            return;
        }
    
        if (newPassword.value.length < 6) {
            this.showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }
    
        if (currentPassword.value === newPassword.value) {
            this.showNotification('Новый пароль должен отличаться от текущего', 'error');
            return;
        }
    
        try {
            this.showLoading(true);
            
            const userId = this.currentUser.id;
            const passwords = {
                oldPassword: currentPassword.value,
                newPassword: newPassword.value
            };
    
            console.log('🔄 Отправка запроса на смену пароля для пользователя:', userId);
            
            const response = await this.apiService.post(`/users/${userId}/password`, passwords);
            
            console.log('✅ Ответ от сервера:', response);
            
            if (response.status === 'SUCCESS') {
                this.showNotification('Пароль успешно изменен', 'success');
                
                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
            } else {
                throw new Error(response.message || 'Неизвестная ошибка при смене пароля');
            }
            
        } catch (error) {
            console.error('❌ Ошибка смены пароля:', error);
            
            let errorMessage = 'Ошибка смены пароля';
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                errorMessage = 'Неверный текущий пароль';
            } else if (error.message.includes('Старый и новый пароль обязательны')) {
                errorMessage = 'Заполните все поля паролей';
            } else if (error.message.includes('Старый пароль неверен')) {
                errorMessage = 'Неверный текущий пароль';
            } else {
                errorMessage += ': ' + error.message;
            }
            
            this.showNotification(errorMessage, 'error');
        } finally {
            this.showLoading(false);
        }
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

    isAdmin() {
        return this.hasRole('ADMIN');
    }

    isManager() {
        return this.hasRole('MANAGER');
    }

    isEmployee() {
        return this.hasRole('EMPLOYEE');
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.app = new App();
        await window.app.init();
        console.log('🚀 HR System started successfully');
    } catch (error) {
        console.error('❌ Failed to start HR System:', error);
    }
});


window.HRSystem = { App };