import { BaseView } from './BaseView.js';

export class ProgressMonitoringView extends BaseView {
    constructor() {
        super('progress-monitoring-view');
        this.onEmployeeSelect = null;
        this.onProgressChart = null;
    }

    renderProgressMonitoring(employees) {
        const container = this.container?.querySelector('#progress-monitoring-content');
        if (!container) return;

        container.innerHTML = `
            <div class="progress-monitoring-container">
                <div class="employee-selection-section">
                    <h3>Выбор сотрудника</h3>
                    <div class="form-group">
                        <label for="progress-employee-select">Сотрудник:</label>
                        <select id="progress-employee-select">
                            <option value="">Выберите сотрудника</option>
                            ${employees.map(employee => `
                                <option value="${employee.id}">
                                    ${employee.firstName} ${employee.lastName} - ${employee.email}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="kpi-section" id="kpi-section" style="display: none;">
                    <h3>История оценок KPI</h3>
                    <div id="kpi-history" class="kpi-history-container"></div>
                    
                    <div class="progress-actions" id="progress-actions" style="display: none;">
                        <button id="show-progress-chart-btn" class="btn btn-primary">
                            Показать график прогресса
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showKPIHistory(evaluations) {
        const section = this.container?.querySelector('#kpi-section');
        const container = this.container?.querySelector('#kpi-history');
        const actions = this.container?.querySelector('#progress-actions');
        
        if (!section || !container || !actions) return;

        if (evaluations.length === 0) {
            container.innerHTML = '<p class="no-data">Нет данных об оценках</p>';
            actions.style.display = 'none';
        } else {
            const sortedEvaluations = [...evaluations].sort((a, b) => new Date(b.evaluationDate) - new Date(a.evaluationDate));

            container.innerHTML = `
                <table class="kpi-history-table">
                    <thead>
                        <tr>
                            <th>Дата оценки</th>
                            <th>Общий KPI</th>
                            <th>Уровень</th>
                            <th>Задачи</th>
                            <th>Исправления</th>
                            <th>Тесты</th>
                            <th>Сроки</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedEvaluations.map(evaluation => `
                            <tr>
                                <td>${new Date(evaluation.evaluationDate).toLocaleDateString('ru-RU')}</td>
                                <td class="kpi-value">${evaluation.overallKpi?.toFixed(2)}%</td>
                                <td>
                                    <span class="performance-${evaluation.getPerformanceLevel()}">
                                        ${evaluation.getPerformanceText()}
                                    </span>
                                </td>
                                <td>${evaluation.kpiCompletedTasks}%</td>
                                <td>${evaluation.kpiFixTime}%</td>
                                <td>${evaluation.kpiTestCoverage}%</td>
                                <td>${evaluation.kpiTimeliness}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            actions.style.display = 'block';
        }

        section.style.display = 'block';
    }

    showProgressChart(evaluations) {
        const chartHtml = `
            <h2>График прогресса сотрудника</h2>
            <div class="progress-chart-modal">
                <div class="chart-scroll-container">
                    <div class="chart-container">
                        <canvas id="progressChartCanvas"></canvas>
                    </div>
                </div>
                <div class="chart-legend">
                    <h4>Показатели KPI за период</h4>
                    <div class="legend-items">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #007bff;"></span>
                            <span>Общий KPI</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #28a745;"></span>
                            <span>Выполненные задачи</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #ffc107;"></span>
                            <span>Время исправлений</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #dc3545;"></span>
                            <span>Тестовое покрытие</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #6f42c1;"></span>
                            <span>Соблюдение сроков</span>
                        </div>
                    </div>
                </div>
                <div class="form-actions" style="margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="app.hideModal()">Закрыть</button>
                </div>
            </div>
        `;
        window.app.showModal(chartHtml);
        setTimeout(() => this.renderChart(evaluations), 100);
    }

    renderChart(evaluations) {
        const canvas = document.getElementById('progressChartCanvas');
        if (!canvas) return;
        const baseWidth = 500;
        const baseHeight = 350;
        const dataPoints = evaluations.length;
        const canvasWidth = Math.max(baseWidth, dataPoints * 70);
        const canvasHeight = baseHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const sortedEvaluations = [...evaluations].sort((a, b) => new Date(a.evaluationDate) - new Date(b.evaluationDate));
        if (sortedEvaluations.length === 0) return;
        const dates = sortedEvaluations.map(evaluation => 
            new Date(evaluation.evaluationDate).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit'
            })
        );
        const overallKpi = sortedEvaluations.map(evaluation => evaluation.overallKpi);
        const completedTasks = sortedEvaluations.map(evaluation => evaluation.kpiCompletedTasks);
        const fixTime = sortedEvaluations.map(evaluation => evaluation.kpiFixTime);
        const testCoverage = sortedEvaluations.map(evaluation => evaluation.kpiTestCoverage);
        const timeliness = sortedEvaluations.map(evaluation => evaluation.kpiTimeliness);
        const paddingTop = 30;
        const paddingBottom = 35;
        const paddingLeft = 60;
        const paddingRight = 20;
        const chartWidth = canvas.width - paddingLeft - paddingRight;
        const chartHeight = canvas.height - paddingTop - paddingBottom;
        const maxValue = 100;
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        const xStep = chartWidth / Math.max(1, (dates.length - 1));
        for (let i = 0; i < dates.length; i++) {
            const x = paddingLeft + i * xStep;
            ctx.beginPath();
            ctx.moveTo(x, paddingTop);
            ctx.lineTo(x, paddingTop + chartHeight);
            ctx.stroke();
        }
        for (let i = 0; i <= 5; i++) {
            const y = paddingTop + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(paddingLeft + chartWidth, y);
            ctx.stroke();
        }
        const getY = (value) => paddingTop + chartHeight - (value / maxValue) * chartHeight;
        const getX = (index) => paddingLeft + index * xStep;
        const drawLine = (data, color) => {
            if (data.length < 2) return;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            data.forEach((value, index) => {
                const x = getX(index);
                const y = getY(value);
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        };
        drawLine(overallKpi, '#007bff');
        drawLine(completedTasks, '#28a745');
        drawLine(fixTime, '#ffc107');
        drawLine(testCoverage, '#dc3545');
        drawLine(timeliness, '#6f42c1');
        const drawPoints = (data, color) => {
            ctx.fillStyle = color;
            data.forEach((value, index) => {
                const x = getX(index);
                const y = getY(value);
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        };
        drawPoints(overallKpi, '#007bff');
        drawPoints(completedTasks, '#28a745');
        drawPoints(fixTime, '#ffc107');
        drawPoints(testCoverage, '#dc3545');
        drawPoints(timeliness, '#6f42c1');
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        dates.forEach((date, index) => {
            const x = getX(index);
            ctx.fillText(date, x, paddingTop + chartHeight + 15);
        });
        ctx.fillText('Дата оценки', paddingLeft + chartWidth / 2, paddingTop + chartHeight + 30);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 100; i += 20) {
            const y = getY(i);
            ctx.fillText(i + '%', paddingLeft - 10, y);
        }
        ctx.save();
        ctx.translate(paddingLeft - 50, paddingTop + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('KPI (%)', 0, 0);
        ctx.restore();
    }

    bindEmployeeSelectHandler(handler) {
        this.onEmployeeSelect = handler;
        const select = this.container?.querySelector('#progress-employee-select');
        if (select && handler) {
            select.replaceWith(select.cloneNode(true));
            const newSelect = this.container?.querySelector('#progress-employee-select');
            newSelect.addEventListener('change', (e) => handler(e.target.value));
        }
    }

    bindProgressChartHandler(handler) {
        this.onProgressChart = handler;
        const button = this.container?.querySelector('#show-progress-chart-btn');
        if (button && handler) {
            button.replaceWith(button.cloneNode(true));
            const newButton = this.container?.querySelector('#show-progress-chart-btn');
            newButton.addEventListener('click', () => handler());
        }
    }

    hideKpiSection() {
        const section = this.container?.querySelector('#kpi-section');
        if (section) section.style.display = 'none';
    }

    showLoading(loading) {
        const container = this.container?.querySelector('#progress-monitoring-content');
        if (container) loading ? container.classList.add('loading') : container.classList.remove('loading');
    }
}