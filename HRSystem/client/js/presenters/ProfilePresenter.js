import { ApiService } from '../services/ApiService.js';
import { ProfileView } from '../views/ProfileView.js';

export class ProfilePresenter {
    constructor(app) {
        this.app = app;
        this.apiService = new ApiService();
        this.view = new ProfileView();
        this.init();
    }

    init() {
        this.view.bindProfileUpdateHandler((formData) => this.handleProfileUpdate(formData));
        this.view.bindPasswordChangeHandler((passwords) => this.handlePasswordChange(passwords));
        this.view.bindCancelEditHandler(() => this.cancelProfileEdit());
        this.view.bindProfileFormChangeHandler(() => this.handleProfileFormChange());
    }

    async show() {
        this.view.show();
        await this.loadUserProfile();
        this.view.initialize();
    }

    async loadUserProfile() {
        try {
            if (!this.app.currentUser || !this.app.currentUser.id) {
                return;
            }
            const userDetails = await this.apiService.get(`/users/${this.app.currentUser.id}`);
            const userRole = userDetails.role?.name || userDetails.role || this.app.currentUser.role || 'User';
            this.app.currentUser = {
                ...this.app.currentUser,
                firstName: userDetails.firstName || '',
                lastName: userDetails.lastName || '',
                email: userDetails.email || '',
                role: userRole,
                roleId: userDetails.role?.id || userDetails.roleId || this.app.currentUser.roleId
            };
            localStorage.setItem('userData', JSON.stringify(this.app.currentUser));
            this.app.updateUserDisplay();
            this.view.updateProfileInfo(this.app.currentUser);
        } catch (error) {
            this.app.showNotification('Не удалось загрузить данные профиля: ' + error.message, 'error');
        }
    }

    handleProfileFormChange() {
        this.view.showProfileUpdateButton();
    }

    async handleProfileUpdate(formData) {
        try {
            this.app.showLoading(true);
            const profileData = {
                username: formData.get('username'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                roleId: this.app.currentUser.roleId || 3
            };

            if (!profileData.firstName || !profileData.lastName || !profileData.email) {
                throw new Error('Все поля обязательны для заполнения');
            }

            if (!this.isValidEmail(profileData.email)) {
                throw new Error('Некорректный email адрес');
            }

            const userId = this.app.currentUser.id;
            const response = await this.apiService.put(`/users/${userId}`, profileData);
            
            if (response.status === 'SUCCESS' || response.id) {
                this.app.showNotification('Данные профиля успешно обновлены', 'success');
                this.view.hideProfileUpdateButton();
                this.app.currentUser.firstName = profileData.firstName;
                this.app.currentUser.lastName = profileData.lastName;
                this.app.currentUser.email = profileData.email;
                localStorage.setItem('userData', JSON.stringify(this.app.currentUser));
                this.app.updateUserDisplay();
                this.view.updateProfileInfo(this.app.currentUser);
            } else throw new Error(response.message || 'Ошибка обновления профиля');
        } catch (error) {
            this.app.showNotification('Ошибка обновления профиля: ' + error.message, 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    async handlePasswordChange(passwords) {
        try {
            this.app.showLoading(true);
            const userId = this.app.currentUser.id;
            const response = await this.apiService.post(`/users/${userId}/password`, passwords);
            
            if (response.status === 'SUCCESS') {
                this.app.showNotification('Пароль успешно изменен', 'success');
                this.view.clearPasswordFields();
            } else throw new Error(response.message || 'Неизвестная ошибка при смене пароля');
            
        } catch (error) {
            let errorMessage = 'Ошибка смены пароля';
            if (error.message.includes('401') || error.message.includes('Unauthorized')) errorMessage = 'Неверный текущий пароль';
            else if (error.message.includes('Старый и новый пароль обязательны')) errorMessage = 'Заполните все поля паролей';
            else if (error.message.includes('Старый пароль неверен')) errorMessage = 'Неверный текущий пароль';
            else errorMessage += ': ' + error.message;
            this.app.showNotification(errorMessage, 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    cancelProfileEdit() {
        this.view.updateProfileInfo(this.app.currentUser);
        this.view.hideProfileUpdateButton();
        this.view.clearAllErrors();
    }

    isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}