export class SelfAssessment {
    constructor(data = {}) {
        this.assessmentId = data.assessmentId || null;
        this.user = data.user || {};
        this.skillName = data.skillName || '';
        this.skillLevel = data.skillLevel || 1;
        this.submittedAt = data.submittedAt || new Date().toISOString();
    }

    validate() {
        const errors = [];
        if (!this.skillName || this.skillName.trim().length === 0) errors.push('Название навыка обязательно');
        if (this.skillName.length > 100) errors.push('Название навыка не должно превышать 100 символов');
        if (!this.skillLevel || typeof this.skillLevel !== 'number') errors.push('Уровень навыка обязателен и должен быть числом');
        if (this.skillLevel < 1 || this.skillLevel > 10) errors.push('Уровень навыка должен быть от 1 до 10');
        return errors;
    }

    static fromApiData(apiData) {
        return new SelfAssessment(apiData);
    }
}