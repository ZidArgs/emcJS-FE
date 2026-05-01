import I18nMixin from "../../mixin/I18nMixin.js";

export default class I18nInput extends I18nMixin(HTMLInputElement) {

    static get overwrittenAttributes() {
        return ["value", "placeholder"];
    }

    set i18nValue(value) {
        if (value == null) {
            this.removeAttribute("i18n-value");
        } else {
            this.setAttribute("i18n-value", value.toString());
        }
    }

    get i18nValue() {
        return this.getAttribute("i18n-value") || "";
    }

    set i18nPlaceholder(value) {
        if (value == null) {
            this.removeAttribute("i18n-placeholder");
        } else {
            this.setAttribute("i18n-placeholder", value.toString());
        }
    }

    get i18nPlaceholder() {
        return this.getAttribute("i18n-placeholder") || "";
    }

    static get i18nObservedAttributes() {
        return ["i18n-value", "i18n-placeholder"];
    }

    applyI18n(key, value) {
        switch (key) {
            case "i18n-value": {
                this.setAttribute("value", value);
            } break;
            case "i18n-placeholder": {
                this.setAttribute("placeholder", value);
            } break;
        }
    }

    static create() {
        return document.createElement("input", {is: "emc-i18n-input"});
    }

}

customElements.define("emc-i18n-input", I18nInput, {extends: "input"});
