import ElementManager from "../../../../../../util/element/ElementManager.js";
import {safeSetAttribute} from "../../../../../../util/node/NodeAttributes.js";

export default class SwitchButtonManager extends ElementManager {

    composer(key, values, optionSelectEventManager) {
        const el = document.createElement("button");
        el.value = key;
        el.disabled = this.disabled;
        safeSetAttribute(el, "readonly", values.readOnly);
        const labelEl = document.createElement("emc-i18n-label");
        labelEl.i18nValue = values.label ?? key;
        el.append(labelEl);
        optionSelectEventManager.addTarget(el);
        return el;
    }

    mutator(el, key, values) {
        safeSetAttribute(el, "readonly", values.readOnly);
        const labelEl = el.querySelector("emc-i18n-label");
        if (labelEl != null) {
            labelEl.i18nValue = values.label ?? key;
        }
    }

    cleanup(el, key, optionSelectEventManager) {
        optionSelectEventManager.removeTarget(el);
    }

}
