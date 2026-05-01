import {debounce} from "emcjs/util/Debouncer.js";
import "../../polyfills/adoptedStyleSheet.polyfill.js";

export default class StyleVariables {

    #stylesheet = new CSSStyleSheet();

    #variables = new Map();

    constructor(target) {
        if (!(target instanceof Document || target instanceof ShadowRoot)) {
            throw new TypeError("target must be a Document or ShadowRoot");
        }
        this.#stylesheet.replaceSync(":root {}");
        target.adoptedStyleSheets = [...target.adoptedStyleSheets, this.#stylesheet];
    }

    set(name, value) {
        const current = this.get(name);
        if (current != value) {
            this.#variables.set(name, value);
            this.#update();
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

    reset() {
        this.#variables.clear();
        this.#update();
    }

    #update = debounce(() => {
        const vars = [];
        for (const [key, value] of this.#variables) {
            if (value != null) {
                vars.push(`--${key}: ${value}`);
            }
        }
        const rule = `:root{${vars.join(";")}}`;
        this.#stylesheet.replace(rule);
    });

}
