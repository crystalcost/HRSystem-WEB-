export class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        };
        const token = localStorage.getItem('authToken');
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        const method = options.method || 'GET';
        const requestBody = options.body ? JSON.parse(options.body) : null;
        console.log(`[API Запрос] ${method} ${endpoint}`, requestBody ? { body: requestBody } : '');
        try {
            const response = await fetch(url, config);
            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[API Ошибка] ${method} ${endpoint}`, { status: response.status, error: errorData });
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            console.log(`[API Ответ] ${method} ${endpoint}`, data);
            return data;
        } catch (error) {
            console.error(`[API Ошибка] ${method} ${endpoint}`, error.message);
            throw error;
        }
    }

    handleUnauthorized() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.dispatchEvent(new CustomEvent('auth-expired'));
    }

    async get(endpoint) { return this.request(endpoint); }
    async post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
    async put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
    async delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}