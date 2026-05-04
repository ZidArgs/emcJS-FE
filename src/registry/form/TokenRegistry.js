const REGISTRY_STORAGE = new Map();

export default class TokenRegistry extends EventTarget {

    #token = new Set();

    constructor(name) {
        super();
        if (name != null && typeof name !== "string" || name === "") {
            throw new TypeError("non empty string or null expected");
        }
        name = name ?? "";
        if (REGISTRY_STORAGE.has(name)) {
            return REGISTRY_STORAGE.get(name);
        }
        REGISTRY_STORAGE.set(name, this);
    }

    add(token) {
        if (!this.#token.has(token)) {
            this.#token.add(token);
            const event = new Event("change");
            this.dispatchEvent(event);
        }
    }

    has(ref) {
        return this.#token.has(ref);
    }

    delete(token) {
        if (this.#token.has(token)) {
            this.#token.delete(token);
            const event = new Event("change");
            this.dispatchEvent(event);
        }
    }

    clear() {
        if (this.#token.size > 0) {
            this.#token.clear();
            const event = new Event("change");
            this.dispatchEvent(event);
        }
    }

    setAll(options) {
        for (const value of options) {
            this.#token.add(value);
        }
        const event = new Event("change");
        this.dispatchEvent(event);
    }

    getAll() {
        const res = [];
        for (const ref of this.#token) {
            res.push(ref);
        }
        return res;
    }

    [Symbol.iterator]() {
        return this.#token[Symbol.iterator]();
    }

    static load(config) {
        for (const name in config) {
            const options = config[name];
            const registry = new TokenRegistry(name);
            registry.setAll(options);
        }
    }

    static reset() {
        for (const [, storage] in REGISTRY_STORAGE) {
            storage.clear();
        }
    }

}
