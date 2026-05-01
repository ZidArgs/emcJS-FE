import CustomElement from "../element/CustomElement.js";
import I18nMixin from "../mixin/I18nMixin.js";
import TPL from "./I18nTooltip.js.html" assert {type: "html"};
import STYLE from "./I18nTooltip.js.css" assert {type: "css"};

export default class I18nTooltip extends I18nMixin(CustomElement) {

    #targetEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#targetEl = this.shadowRoot.getElementById("target");
    }

    set i18nTooltip(value) {
        this.setStringAttribute("i18n-tooltip", value);
    }

    get i18nTooltip() {
        return this.getAttribute("i18n-tooltip") || "";
    }

    static get i18nObservedAttributes() {
        return ["i18n-tooltip"];
    }

    applyI18n(key, value) {
        switch (key) {
            case "i18n-tooltip": {
                this.#targetEl.title = value;
            } break;
        }
    }

}

customElements.define("emc-i18n-tooltip", I18nTooltip);
