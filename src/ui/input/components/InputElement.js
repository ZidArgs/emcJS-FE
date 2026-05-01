import I18nMixin from "../../mixin/I18nMixin.js";

/**
 * usage:
 * ```html
 * <input is="emc-input" type="text" i18nValue="translation.placeholder.key">
 * ```
 * @deprecated
 */
export default class InputElement extends I18nMixin(HTMLInputElement) {

    set i18nValue(val) {
        if (val != null) {
            this.setAttribute("i18n-value", val);
        } else {
            this.removeAttribute("i18n-value");
        }
    }

    get i18nValue() {
        return this.getAttribute("i18n-value") || "";
    }

    static get i18nObservedAttributes() {
        return ["i18n-value"];
    }

    applyI18n(key, value) {
        switch (key) {
            case "i18n-value": {
                this.placeholder = value;
            } break;
        }
    }

}

customElements.define("emc-input", InputElement, {extends: "input"});
