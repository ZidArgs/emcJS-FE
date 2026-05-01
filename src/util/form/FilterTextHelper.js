import SelectEntry from "../../ui/form/element/components/SelectEntry.js";
import {getInnerText} from "../node/ExtractText.js";

export function getFilterText(el) {
    if (el.dataset.filtervalue) {
        return el.dataset.filtervalue;
    }
    if (el.formField) {
        return getInnerText(el.formField, [SelectEntry]);
    }
    return getInnerText(el, [SelectEntry]);
}
