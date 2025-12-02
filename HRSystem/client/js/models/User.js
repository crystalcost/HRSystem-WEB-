export class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.username = data.username || '';
        this.email = data.email || '';
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.role = data.role || {};
        this.password = data.password || '';
    }

    validate() {
        const errors = [];
        if (!this.username || this.username.length < 3) errors.push('Логин должен содержать минимум 3 символа');
        if (!this.email || !this.isValidEmail(this.email)) errors.push('Некорректный email адрес');
        if (!this.firstName || this.firstName.trim().length === 0) errors.push('Имя обязательно для заполнения');
        if (!this.lastName || this.lastName.trim().length === 0) errors.push('Фамилия обязательна для заполнения');
        if (this.password && this.password.length < 6) errors.push('Пароль должен содержать минимум 6 символов');
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    toCreateDTO() {
        return {
            username: this.username,
            password: this.password,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            roleId: this.roleId || 3
        };
    }

    toUpdateDTO() {
        return {
            username: this.username,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            roleId: parseInt(this.roleId) || 3,
            password: this.password || undefined
        };
    }

    static fromApiData(apiData) {
        return new User({
            id: apiData.id,
            username: apiData.username,
            email: apiData.email,
            firstName: apiData.firstName,
            lastName: apiData.lastName,
            role: apiData.role,
            roleId: apiData.role?.id || apiData.roleId,
            fullName: apiData.fullName,
            roleName: apiData.roleName
        });
    }
}