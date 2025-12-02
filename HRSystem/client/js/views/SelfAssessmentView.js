import { BaseView } from './BaseView.js';

export class SelfAssessmentView extends BaseView {
    constructor() {
        super('self-assessment-view');
    }

    renderAssessments(assessments) {
        const tbody = this.container?.querySelector('#assessments-tbody');
        if (!tbody) return;

        if (assessments.length === 0) {
            tbody.innerHTML = this.getEmptyStateTemplate('⭐', 'Самооценки не найдены');
            return;
        }

        tbody.innerHTML = assessments.map(assessment => `
            <tr>
                <td>
                    <div class="skill-info">
                        <div class="skill-name">${assessment.skillName}</div>
                        ${assessment.skillCategory ? `<div class="skill-category">${this.getCategoryName(assessment.skillCategory)}</div>` : ''}
                    </div>
                </td>
                <td>
                    <div class="skill-level">
                        <span class="level-number">${assessment.skillLevel}/10</span>
                        <div class="level-bar">
                            <div class="level-fill" style="width: ${(assessment.skillLevel * 10)}%"></div>
                        </div>
                    </div>
                </td>
                <td>${assessment.submittedAtFormatted || new Date(assessment.submittedAt).toLocaleDateString('ru-RU')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-danger btn-sm" data-action="delete" data-assessment-id="${assessment.assessmentId}">
                            Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getCategoryName(category) {
        const categories = {
            'technical': '(Hard skills)',
            'soft': '(Soft skills)',
            'business': '(Business skills)',
            'other': '(Другие)'
        };
        return categories[category] || category;
    }

    bindSubmitHandler(handler) {
        this.bindEvent('#submit-assessment', 'click', () => {
            const skillSelect = this.container?.querySelector('#assessment-skill');
            const levelInput = this.container?.querySelector('#assessment-level');

            if (!skillSelect || !levelInput) return;

            const assessmentData = {
                skillName: skillSelect.value,
                skillLevel: parseInt(levelInput.value)
            };
            handler(assessmentData);
        });
    }

    bindAssessmentActionsHandler(handler) {
        this.bindDelegate('[data-action]', 'click', (e, button) => {
            const action = button.dataset.action;
            const assessmentId = parseInt(button.dataset.assessmentId);
            if (action && assessmentId) handler(action, assessmentId);
        });
    }

    getEmptyStateTemplate(icon, message) {
        return `
            <tr>
                <td colspan="4" class="empty-state">
                    <div class="icon">
                        <img src="resources/images/self.png" alt="Самооценки" class="empty-icon"
                             onerror="this.style.display='none'; this.parentNode.innerHTML='${icon}'">
                    </div>
                    <h3>${message}</h3>
                    <p>Начните с подачи первой самооценки</p>
                </td>
            </tr>
        `;
    }

    showLoading(loading) {
        const button = this.container?.querySelector('#submit-assessment');
        if (button) {
            button.disabled = loading;
            button.textContent = loading ? 'Отправка...' : 'Отправить самооценку';
        }
    }

    resetForm() {
        const skillSelect = this.container?.querySelector('#assessment-skill');
        const levelInput = this.container?.querySelector('#assessment-level');
        if (skillSelect) skillSelect.value = 'Коммуникация';
        if (levelInput) levelInput.value = '5';
    }
}