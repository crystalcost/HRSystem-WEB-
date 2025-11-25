export class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.username = data.username || '';
        this.email = data.email || '';
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.role = data.role || {};
        this.password = data.password || '';
        this.fullName = data.fullName || '';
        this.roleName = data.roleName || '';
    }

    get displayName() {
        if (this.fullName) return this.fullName;
        return `${this.firstName} ${this.lastName}`.trim() || this.username;
    }

    validate() {
        const errors = [];
        
        if (!this.username || this.username.length < 3) {
            errors.push('Логин должен содержать минимум 3 символа');
        }
        
        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('Некорректный email адрес');
        }
        
        if (!this.firstName || this.firstName.trim().length === 0) {
            errors.push('Имя обязательно для заполнения');
        }
        
        if (!this.lastName || this.lastName.trim().length === 0) {
            errors.push('Фамилия обязательна для заполнения');
        }
        
        if (this.password && this.password.length < 6) {
            errors.push('Пароль должен содержать минимум 6 символов');
        }
        
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    toCreateDTO() {
        const roleId = typeof this.role === 'number' ? this.role : (this.role?.id || 3);
        return {
            username: this.username,
            password: this.password,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            roleId: roleId
        };
    }

    toUpdateDTO() {
        return {
            username: this.username,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            roleId: this.role.id || this.role,
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
            fullName: apiData.fullName,
            roleName: apiData.roleName
        });
    }
}