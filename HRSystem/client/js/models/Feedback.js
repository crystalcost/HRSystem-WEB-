export class Feedback {
    constructor(data = {}) {
        this.feedbackId = data.feedbackId || null;
        this.evaluation = data.evaluation || {};
        this.feedbackText = data.feedbackText || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.createdAtFormatted = data.createdAtFormatted || '';
        this.preview = data.preview || '';
    }

    validate() {
        const errors = [];
        
        if (!this.evaluation || !this.evaluation.evaluationId) {
            errors.push('Оценка обязательна для заполнения');
        }
        
        if (!this.feedbackText || this.feedbackText.trim().length === 0) {
            errors.push('Текст отзыва не может быть пустым');
        }
        
        if (this.feedbackText.length > 1000) {
            errors.push('Текст отзыва не должен превышать 1000 символов');
        }
        
        return errors;
    }

    generatePreview(maxLength = 100) {
        if (!this.feedbackText) return '';
        if (this.feedbackText.length <= maxLength) return this.feedbackText;
        return this.feedbackText.substring(0, maxLength) + '...';
    }

    getWordCount() {
        if (!this.feedbackText) return 0;
        return this.feedbackText.trim().split(/\s+/).length;
    }

    static fromApiData(apiData) {
        return new Feedback({
            feedbackId: apiData.feedbackId,
            evaluation: apiData.evaluation,
            feedbackText: apiData.feedbackText,
            createdAt: apiData.createdAt,
            createdAtFormatted: apiData.createdAtFormatted,
            preview: apiData.preview
        });
    }
}