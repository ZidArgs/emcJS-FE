import {debounce} from "emcjs/util/Debouncer.js";
import "../../polyfills/adoptedStyleSheet.polyfill.js";

class GlobalStyleVariables {

    #stylesheet = new CSSStyleSheet();

    #defaultVariables = new Map();

    #variables = new Map();

    constructor() {
        for (const sheet of Array.from(document.styleSheets)) {
            this.#extractAllRules(sheet);
        }
        this.#stylesheet.replaceSync(":root {}");
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.#stylesheet];
    }

    #extractAllRules(sheet) {
        if (sheet.href === null || sheet.href.startsWith(window.location.origin)) {
            try {
                const rules = sheet.cssRules;
                for (const rule of Array.from(rules)) {
                    if (rule instanceof CSSImportRule) {
                        this.#extractAllRules(rule.styleSheet);
                    } else if (rule instanceof CSSStyleRule) {
                        if (rule.selectorText === ":root") {
                            const style = rule.style;
                            for (const name of Array.from(style)) {
                                if (name.startsWith("--")) {
                                    this.#defaultVariables.set(name.slice(2), style.getPropertyValue(name).trim());
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn(`extracting global variables failed for style "${sheet.href}" - ${err}`);
            }
        }
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
        return this.#variables.get(name) ?? this.getDefault(name);
    }

    getDefault(name) {
        return this.#defaultVariables.get(name);
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

export default new GlobalStyleVariables();
