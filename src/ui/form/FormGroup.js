import {immute} from "@emcjs/core/data/Immutable.js";
import CustomElement from "../element/CustomElement.js";
import {safeSetAttribute} from "../../util/node/NodeAttributes.js";
import TPL from "./FormGroup.js.html" assert {type: "html"};
import STYLE from "./FormGroup.js.css" assert {type: "css"};

export default class FormGroup extends CustomElement {

    static get formConfigurationFields() {
        return immute({});
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

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "disabled"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "disabled": {
                if (oldValue != newValue) {
                    safeSetAttribute(this.shadowRoot.getElementById("fieldset"), "disabled", newValue);
                }
            } break;
        }
    }

}

customElements.define("emc-form-group", FormGroup);
