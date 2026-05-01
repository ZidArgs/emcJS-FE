import "../../polyfills/adoptedStyleSheet.polyfill.js";

const INDEX = new Map();

export default class CSSTemplate {

    #stylesheets;

    constructor(rules) {
        if (rules instanceof CSSStyleSheet) {
            this.#stylesheets = rules;
        } else if ("replaceSync" in CSSStyleSheet.prototype) {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replaceSync(rules);
            this.#stylesheets = styleSheet;
        } else {
            const element = document.createElement("style");
            element.innerHTML = rules;
            this.#stylesheets = element;
        }
    }

    apply(target) {
        if (target instanceof Document || target instanceof ShadowRoot) {
            target.adoptedStyleSheets = [...target.adoptedStyleSheets, this.#stylesheets];
        }
    }

    register(ref) {
        INDEX.set(ref, this);
    }

    static register(ref, style) {
        if (style instanceof CSSTemplate) {
            INDEX.set(ref, style);
        }
    }

    static getStyle(ref) {
        return INDEX.get(ref);
    }

}
