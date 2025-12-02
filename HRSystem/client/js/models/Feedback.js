export class Feedback {
    constructor(data = {}) {
        this.feedbackId = data.feedbackId || null;
        this.evaluation = data.evaluation || {};
        this.feedbackText = data.feedbackText || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    validate() {
        const errors = [];
        if (!this.evaluation || !this.evaluation.evaluationId) errors.push('Оценка обязательна для заполнения');
        if (!this.feedbackText || this.feedbackText.trim().length === 0) errors.push('Текст отзыва не может быть пустым');
        if (this.feedbackText.length > 1000) errors.push('Текст отзыва не должен превышать 1000 символов');
        return errors;
    }

    generatePreview(maxLength = 100) {
        if (!this.feedbackText) return '';
        return this.feedbackText.length <= maxLength ? this.feedbackText : this.feedbackText.substring(0, maxLength) + '...';
    }

    static fromApiData(apiData) {
        return new Feedback(apiData);
    }
}