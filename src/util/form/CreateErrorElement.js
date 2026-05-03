
import {isStringNotEmpty} from "@emcjs/core/util/helper/CheckType.js";
import {safeSetAttribute} from "../node/NodeAttributes.js";

export function createErrorElement(ref, name, value) {
    const hiddenWrapperEl = document.createElement("div");
    hiddenWrapperEl.classList.add("unknown-form-element");
    hiddenWrapperEl.innerHTML = `⚠ unknown form element (${ref})`;
    hiddenWrapperEl.style.color = "#e5ad14";
    hiddenWrapperEl.style.background = "#fff5d5";
    hiddenWrapperEl.style.padding = "10px";
    hiddenWrapperEl.style.margin = "6px";

    if (isStringNotEmpty(name)) {
        const hiddenEl = document.createElement("input");
        hiddenEl.dataset.elementRef = ref;
        hiddenEl.setAttribute("type", "hidden");
        hiddenEl.setAttribute("name", name ?? "");
        safeSetAttribute(hiddenEl, "value", value);
        hiddenWrapperEl.append(hiddenEl);
    }

    return hiddenWrapperEl;
}
