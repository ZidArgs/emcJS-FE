import CustomElement from "../element/CustomElement.js";
import I18nMixin from "../mixin/I18nMixin.js";
import TPL from "./I18nTextbox.js.html" assert {type: "html"};
import STYLE from "./I18nTextbox.js.css" assert {type: "css"};

export default class I18nTextbox extends I18nMixin(CustomElement) {

    #targetEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#targetEl = this.shadowRoot.getElementById("target");
    }

    set i18nContent(value) {
        this.setStringAttribute("i18n-content", value);
    }

    get i18nContent() {
        return this.getAttribute("i18n-content") || "";
    }

    set i18nTooltip(value) {
        this.setStringAttribute("i18n-tooltip", value);
    }

    get i18nTooltip() {
        return this.getAttribute("i18n-tooltip") || "";
    }

    static get i18nObservedAttributes() {
        return ["i18n-content", "i18n-tooltip"];
    }

    static get i18nMultilineAttributes() {
        return ["i18n-content"];
    }

    applyI18n(key, value) {
        switch (key) {
            case "i18n-content": {
                this.innerText = value;
            } break;
            case "i18n-tooltip": {
                this.#targetEl.title = value;
            } break;
        }
    }

    get comparatorText() {
        return this.innerText;
    }

}

customElements.define("emc-i18n-textbox", I18nTextbox);
