import ElementManager from "../../element/ElementManager.js";
import I18nOption from "../../../ui/i18n/builtin/I18nOption.js";

export default class I18nOptionManager extends ElementManager {

    composer(key, values) {
        const el = I18nOption.create(key, values.label ?? key);
        return el;
    }

    mutator(el, key, values) {
        el.label = values.label ?? key;
    }

}
