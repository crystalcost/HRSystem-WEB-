export class TrainingRequest {
    constructor(data = {}) {
        this.requestId = data.requestId || null;
        this.user = data.user || {};
        this.courseName = data.courseName || '';
        this.status = data.status || 'PENDING';
        this.submittedAt = data.submittedAt || new Date().toISOString();
    }

    validate() {
        const errors = [];
        if (!this.courseName || this.courseName.trim().length === 0) errors.push('Название курса обязательно');
        if (this.courseName.length > 50) errors.push('Название курса не должно превышать 50 символов');
        return errors;
    }

    static fromApiData(apiData) {
        return new TrainingRequest(apiData);
    }
}