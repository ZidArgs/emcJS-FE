
import CustomActionRegistry from "emcjs/data/registry/CustomActionRegistry.js";
import {deepClone} from "emcjs/util/helper/DeepClone.js";
import {registerFocusable} from "../../../util/element/ElementFocusHelper.js";
import Button from "./Button.js";
import CONFIG_FIELDS from "./ActionButton.js.json" assert {type: "json"};

export default class ActionButton extends Button {

    static get formConfigurationFields() {
        return [...super.formConfigurationFields, ...deepClone(CONFIG_FIELDS)];
    }

    clickHandler(event) {
        if (super.clickHandler(event)) {
            const customAction = CustomActionRegistry.current.get(this.action);
            if (customAction != null) {
                customAction(this);
            }
            return true;
        }
        return false;
    }

    set action(value) {
        this.setAttribute("action", value);
    }

    get action() {
        return this.getAttribute("action");
    }

}

customElements.define("emc-button-action", ActionButton);
registerFocusable("emc-button-action");
