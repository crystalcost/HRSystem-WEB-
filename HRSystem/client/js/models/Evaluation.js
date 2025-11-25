export class Evaluation {
    constructor(data = {}) {
        this.evaluationId = data.evaluationId || null;
        this.user = data.user || {};
        this.manager = data.manager || {};
        this.kpiCompletedTasks = data.kpiCompletedTasks || 0;
        this.kpiFixTime = data.kpiFixTime || 0;
        this.kpiTestCoverage = data.kpiTestCoverage || 0;
        this.kpiTimeliness = data.kpiTimeliness || 0;
        this.overallKpi = data.overallKpi || 0;
        this.comments = data.comments || '';
        this.evaluationDate = data.evaluationDate || new Date().toISOString();
        this.performanceLevel = data.performanceLevel || 'unknown';
        this.overallKpiFormatted = data.overallKpiFormatted || '';
        this.evaluationDateFormatted = data.evaluationDateFormatted || '';
    }

    validate() {
        const errors = [];
        
        if (!this.user || !this.user.id) {
            errors.push('Сотрудник обязателен для заполнения');
        }
        
        if (!this.manager || !this.manager.id) {
            errors.push('Менеджер обязателен для заполнения');
        }
        
        if (this.kpiCompletedTasks < 0 || this.kpiCompletedTasks > 100) {
            errors.push('KPI выполненных задач должен быть между 0 и 100');
        }
        
        if (this.kpiFixTime < 0 || this.kpiFixTime > 100) {
            errors.push('KPI времени исправлений должен быть между 0 и 100');
        }
        
        if (this.kpiTestCoverage < 0 || this.kpiTestCoverage > 100) {
            errors.push('KPI тестового покрытия должен быть между 0 и 100');
        }
        
        if (this.kpiTimeliness < 0 || this.kpiTimeliness > 100) {
            errors.push('KPI соблюдения сроков должен быть между 0 и 100');
        }
        
        return errors;
    }

    calculateOverallKpi() {
        const weights = {
            completedTasks: 0.4,
            fixTime: 0.2, 
            testCoverage: 0.2,
            timeliness: 0.2
        };

        this.overallKpi = 
            (this.kpiCompletedTasks || 0) * weights.completedTasks +
            (this.kpiFixTime || 0) * weights.fixTime +
            (this.kpiTestCoverage || 0) * weights.testCoverage +
            (this.kpiTimeliness || 0) * weights.timeliness;

        return parseFloat(this.overallKpi.toFixed(2));
    }

    getPerformanceLevel() {
        if (!this.overallKpi) return 'unknown';
        if (this.overallKpi >= 90) return 'excellent';
        if (this.overallKpi >= 75) return 'good';
        if (this.overallKpi >= 60) return 'satisfactory';
        if (this.overallKpi >= 40) return 'needs_improvement';
        return 'poor';
    }

    getPerformanceText() {
        const level = this.getPerformanceLevel();
        const texts = {
            'excellent': 'Отлично',
            'good': 'Хорошо',
            'satisfactory': 'Удовлетворительно',
            'needs_improvement': 'Требует улучшения',
            'poor': 'Неудовлетворительно',
            'unknown': 'Не оценено'
        };
        return texts[level] || level;
    }

    static fromApiData(apiData) {
        return new Evaluation({
            evaluationId: apiData.evaluationId,
            user: apiData.user,
            manager: apiData.manager,
            kpiCompletedTasks: apiData.kpiCompletedTasks,
            kpiFixTime: apiData.kpiFixTime,
            kpiTestCoverage: apiData.kpiTestCoverage,
            kpiTimeliness: apiData.kpiTimeliness,
            overallKpi: apiData.overallKpi,
            comments: apiData.comments,
            evaluationDate: apiData.evaluationDate,
            performanceLevel: apiData.performanceLevel,
            overallKpiFormatted: apiData.overallKpiFormatted,
            evaluationDateFormatted: apiData.evaluationDateFormatted
        });
    }
}