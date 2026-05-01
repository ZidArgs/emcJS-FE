export default class ElementStyleVariables {

    #element;

    #variables = new Map();

    constructor(element) {
        if (!(element instanceof Element)) {
            throw new TypeError("element must be an Element");
        }
        this.#element = element;
    }

    set(name, value) {
        const current = this.#variables.get(name);
        if (current != value) {
            this.#variables.set(name, value);
            this.#element.style.setProperty(`--${name}`, value);
        }
    }

    setAll(values = {}) {
        for (const name in values) {
            const value = values[name];
            this.set(name, value);
        }
    }

    get(name) {
        return this.#variables.get(name);
    }

    getComputed(name) {
        const styleMap = this.#element.computedStyleMap();
        const value = styleMap.get(`--${name}`);
        return value.toString();
    }

    static getComputed(element, name) {
        if (!(element instanceof Element)) {
            throw new TypeError("element must be an Element");
        }
        const styleMap = element.computedStyleMap();
        const value = styleMap.get(`--${name}`);
        return value.toString();
    }

}
