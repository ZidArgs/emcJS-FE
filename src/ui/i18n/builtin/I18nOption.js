import I18nMixin from "../../mixin/I18nMixin.js";

export default class I18nOption extends I18nMixin(HTMLOptionElement) {

    static get overwrittenAttributes() {
        return ["label"];
    }

    set value(value) {
        if (value != null) {
            this.setAttribute("value", value);
        } else {
            this.removeAttribute("value");
        }
    }

    get value() {
        return this.getAttribute("value");
    }

    set selected(value) {
        if (value == null) {
            this.removeAttribute("selected");
        } else if (typeof value === "boolean") {
            if (value) {
                this.setAttribute("selected", "");
            } else {
                this.removeAttribute("selected");
            }
        } else {
            this.setAttribute("selected", value);
        }
    }

    get selected() {
        const value = this.getAttribute("selected");
        if (value == null || value === "false") {
            return false;
        }
        if (value === "" || value === "true") {
            return true;
        }
        return value;
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

    static get i18nObservedAttributes() {
        return ["i18n-value"];
    }

    applyI18n(key, value) {
        switch (key) {
            case "i18n-value": {
                this.label = value;
            } break;
        }
    }

    static create(value, label) {
        const el = document.createElement("option", {is: "emc-i18n-option"});
        el.value = value;
        el.i18nValue = label ?? value;
        return el;
    }

}

customElements.define("emc-i18n-option", I18nOption, {extends: "option"});
