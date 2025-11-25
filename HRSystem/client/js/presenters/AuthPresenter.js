import { ApiService } from '../services/ApiService.js';
import { User } from '../models/User.js';
import { AuthView } from '../views/AuthView.js';

export class AuthPresenter {
    constructor(app) {
        this.app = app;
        this.apiService = new ApiService();
        this.view = new AuthView();
        this.init();
    }

    init() {
        this.view.bindLoginHandler((credentials) => this.handleLogin(credentials));
        this.view.bindRegisterHandler((userData) => this.handleRegister(userData));
    }

    async handleLogin(credentials) {
        try {
            this.view.setLoading(true);
            this.view.clearErrors();
            
            if (!credentials.username || !credentials.password) {
                this.view.showError('username', 'Логин и пароль обязательны');
                return;
            }
    
            const response = await this.apiService.post('/auth/login', credentials);
            
            if (response.status === 'SUCCESS') {
                const userData = {
                    id: response.userId,
                    username: response.username,
                    role: response.role
                };
                
                localStorage.setItem('authToken', response.token || response.clientToken);
                localStorage.setItem('userData', JSON.stringify(userData));
                
                this.app.setCurrentUser(userData);
                
                this.app.showNotification('Успешный вход в систему', 'success');
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.app.showNotification('Ошибка входа: ' + error.message, 'error');
            this.view.showError('username', 'Неверные учетные данные');
        } finally {
            this.view.setLoading(false);
        }
    }

    async handleRegister(userData) {
        try {
            this.view.setLoading(true);
            this.view.clearErrors();
            
            console.log('📝 Registration data:', userData);
            
            const user = new User(userData);
            const validationErrors = user.validate();
            
            if (validationErrors.length > 0) {
                this.app.showNotification(validationErrors[0], 'error');
                return;
            }
            const response = await this.apiService.post('/auth/register', user.toCreateDTO());
            if (response.status === 'SUCCESS') {
                this.app.showNotification('Регистрация прошла успешно! Теперь вы можете войти.', 'success');
                this.view.clearForms();
                this.view.switchTab('login');
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.app.showNotification('Ошибка регистрации: ' + error.message, 'error');
        } finally {
            this.view.setLoading(false);
        }
    }

    show() {
        this.view.show();
    }

    hide() {
        this.view.hide();
    }

    onShow() {
        this.view.clearForms();
        this.view.clearErrors();
    }
}