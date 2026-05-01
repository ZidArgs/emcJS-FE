import I18nMixin from "../../mixin/I18nMixin.js";

export default class I18nTextarea extends I18nMixin(HTMLTextAreaElement) {

    static get overwrittenAttributes() {
        return ["placeholder"];
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
        return ["i18n-placeholder"];
    }

    applyI18n(key, value) {
        switch (key) {
            case "i18n-placeholder": {
                this.setAttribute("placeholder", value);
            } break;
        }
    }

    static create() {
        return document.createElement("textarea", {is: "emc-i18n-textarea"});
    }

}

customElements.define("emc-i18n-textarea", I18nTextarea, {extends: "textarea"});
