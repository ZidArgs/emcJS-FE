import ElementManager from "../../element/ElementManager.js";
import SelectEntry from "../../../ui/form/element/components/SelectEntry.js";

export default class SelectEntryManager extends ElementManager {

    composer(key, values, selectEventManager) {
        const el = SelectEntry.create(key, values.label ?? key);
        selectEventManager.addTarget(el);
        return el;
    }

    mutator(el, key, values) {
        el.label = values.label ?? key;
    }

    cleanup(el, key, selectEventManager) {
        selectEventManager.removeTarget(el);
    }

}
