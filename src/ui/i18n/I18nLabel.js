import CustomElement from "../element/CustomElement.js";
import I18nMixin from "../mixin/I18nMixin.js";
import TPL from "./I18nLabel.js.html" assert {type: "html"};
import STYLE from "./I18nLabel.js.css" assert {type: "css"};

export default class I18nLabel extends I18nMixin(CustomElement) {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
    }

    set i18nValue(value) {
        this.setStringAttribute("i18n-value", value);
    }

    get i18nValue() {
        return this.getStringAttribute("i18n-value") || "";
    }

    static get i18nObservedAttributes() {
        return ["i18n-value"];
    }

    applyI18n(key, value) {
        switch (key) {
            case "i18n-value": {
                this.innerText = value;
            } break;
        }
    }

    static getLabel(label) {
        if (label instanceof I18nLabel) {
            return label;
        } else if (label instanceof HTMLElement) {
            const el = document.createElement("emc-i18n-label");
            el.i18nValue = label.innerText;
            return el;
        } else if (typeof label === "function") {
            return I18nLabel.getLabel(label());
        } else if (typeof label !== "object") {
            const el = document.createElement("emc-i18n-label");
            el.i18nValue = label;
            return el;
        }
        return document.createElement("emc-i18n-label");
    }

    get comparatorText() {
        return this.innerText;
    }

}

customElements.define("emc-i18n-label", I18nLabel);
