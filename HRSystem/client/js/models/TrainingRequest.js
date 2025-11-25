export class TrainingRequest {
    constructor(data = {}) {
        this.requestId = data.requestId || null;
        this.user = data.user || {};
        this.courseName = data.courseName || '';
        this.status = data.status || 'PENDING';
        this.submittedAt = data.submittedAt || new Date().toISOString();
        this.submittedAtFormatted = data.submittedAtFormatted || '';
        this.statusText = data.statusText || '';
        this.duration = data.duration || null;
        this.priority = data.priority || 'normal';
    }

    validate() {
        const errors = [];
        
        if (!this.courseName || this.courseName.trim().length === 0) {
            errors.push('Название курса обязательно');
        }
        
        if (this.courseName.length > 50) {
            errors.push('Название курса не должно превышать 50 символов');
        }
        
        return errors;
    }

    static fromApiData(apiData) {
        return new TrainingRequest({
            requestId: apiData.requestId,
            user: apiData.user,
            courseName: apiData.courseName,
            status: apiData.status,
            submittedAt: apiData.submittedAt,
            submittedAtFormatted: apiData.submittedAtFormatted,
            statusText: apiData.statusText,
            duration: apiData.duration,
            priority: apiData.priority
        });
    }
}