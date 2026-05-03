import {immute} from "@emcjs/core/data/Immutable.js";
import CustomElement from "../element/CustomElement.js";
import {safeSetAttribute} from "../../util/node/NodeAttributes.js";
import "../i18n/I18nLabel.js";
import "../i18n/I18nTextbox.js";
import TPL from "./FormFieldset.js.html" assert {type: "html"};
import STYLE from "./FormFieldset.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./FormFieldset.js.json" assert {type: "json"};

export default class FormFieldset extends CustomElement {

    static get formConfigurationFields() {
        return immute(CONFIG_FIELDS);
    }

    static get formConfigurationCanHaveChildren() {
        return true;
    }

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

    set label(value) {
        this.setAttribute("label", value);
    }

    get label() {
        return this.getAttribute("label");
    }

    set desc(value) {
        this.setAttribute("desc", value);
    }

    get desc() {
        return this.getAttribute("desc");
    }

    set tooltip(value) {
        this.setAttribute("tooltip", value);
    }

    get tooltip() {
        return this.getAttribute("tooltip");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "label",
            "desc",
            "tooltip",
            "disabled"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "label": {
                if (oldValue != newValue) {
                    this.shadowRoot.getElementById("text").i18nValue = newValue;
                }
            } break;
            case "desc": {
                if (oldValue != newValue) {
                    this.shadowRoot.getElementById("description").i18nContent = newValue;
                }
            } break;
            case "tooltip": {
                if (oldValue != newValue) {
                    this.shadowRoot.getElementById("tooltip").i18nTooltip = newValue;
                }
            } break;
            case "disabled": {
                if (oldValue != newValue) {
                    safeSetAttribute(this.shadowRoot.getElementById("fieldset"), "disabled", newValue);
                }
            } break;
        }
    }

}

customElements.define("emc-form-fieldset", FormFieldset);
