import EventManager from "@emcjs/core/util/event/EventManager.js";
import ElementManager from "../../element/ElementManager.js";
import "../../../ui/form/element/components/valuepill/ValuePill.js";

export default class MultiValueSelectedPillManager extends ElementManager {

    #eventManager = new EventManager();

    composer(key, values) {
        const el = document.createElement("emc-value-pill");
        el.dataset.value = key;
        el.label = values.label ?? key;
        this.#eventManager.set(el, "remove", (event) => {
            values.toggleValue(event);
            event.stopPropagation();
        });
        return el;
    }

    mutator(el, key, values) {
        el.i18nValue = values.label ?? key;
    }

    cleanup(el) {
        this.#eventManager.clear(el);
    }

}
