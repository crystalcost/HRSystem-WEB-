export class BaseView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isInitialized = false;
        this.eventListeners = [];
    }

    show() {
        if (this.container) this.container.classList.add('active');
        if (!this.isInitialized) {
            this.initialize();
            this.isInitialized = true;
        }
        this.onShow();
    }

    hide() {
        if (this.container) this.container.classList.remove('active');
        this.onHide();
    }

    initialize() {}
    onShow() {}
    onHide() {}

    render(template) {
        if (this.container) this.container.innerHTML = template;
    }

    bindEvent(selector, event, handler) {
        const element = this.container?.querySelector(selector);
        if (element) {
            element.addEventListener(event, handler);
            this.eventListeners.push({ element, event, handler });
        }
    }

    bindDelegate(selector, event, handler) {
        if (this.container) {
            const delegateHandler = (e) => {
                const target = e.target.closest(selector);
                if (target && this.container.contains(target)) handler(e, target);
            };
            this.container.addEventListener(event, delegateHandler);
            this.eventListeners.push({ element: this.container, event, handler: delegateHandler });
        }
    }

    updateElement(selector, content) {
        const element = this.container?.querySelector(selector);
        if (element) element.innerHTML = content;
    }

    setElementValue(selector, value) {
        const element = this.container?.querySelector(selector);
        if (element) element.value = value;
    }

    getElementValue(selector) {
        const element = this.container?.querySelector(selector);
        return element?.value || '';
    }

    showElement(selector) {
        const element = this.container?.querySelector(selector);
        if (element) element.style.display = '';
    }

    hideElement(selector) {
        const element = this.container?.querySelector(selector);
        if (element) element.style.display = 'none';
    }

    addClass(selector, className) {
        const element = this.container?.querySelector(selector);
        if (element) element.classList.add(className);
    }

    removeClass(selector, className) {
        const element = this.container?.querySelector(selector);
        if (element) element.classList.remove(className);
    }

    destroy() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }
}