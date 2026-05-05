import {instanceOfOne} from "@emcjs/core/util/helper/Class.js";
import {setAttributes} from "../../util/node/NodeAttributes.js";
import CustomFormElement from "../../ui/element/CustomFormElement.js";

const EXPECTED_CLASSES = [
    HTMLInputElement,
    HTMLButtonElement,
    CustomFormElement
];

class FormElementRegistry {

    #registry = new Map();

    create(ref, params, label) {
        const Clazz = this.getRegisteredClass(ref);
        if (Clazz != null) {
            if ("fromConfig" in Clazz) {
                return Clazz.fromConfig(params);
            }
            const el = new Clazz();
            setAttributes(el, params);
            return el;
        }
        /* --- */
        console.warn(`FormElementRegistry: no form element registered for type "${ref}"${label != null ? ` [${label}]` : ""}`);

        const hiddenWrapperEl = document.createElement("div");
        hiddenWrapperEl.classList.add("unknown-form-element");
        hiddenWrapperEl.innerHTML = `⚠ unknown form element (${ref})`;
        hiddenWrapperEl.style.color = "#e5ad14";
        hiddenWrapperEl.style.background = "#fff5d5";
        hiddenWrapperEl.style.padding = "10px";
        hiddenWrapperEl.style.margin = "6px";

        const hiddenEl = document.createElement("input");
        hiddenEl.dataset.elementRef = ref;
        hiddenEl.setAttribute("type", "hidden");
        hiddenEl.setAttribute("name", params.name ?? "");
        if (typeof value === "object") {
            hiddenEl.setAttribute("value", JSON.stringify(params.value ?? ""));
        } else {
            hiddenEl.setAttribute("value", params.value ?? "");
        }
        hiddenWrapperEl.append(hiddenEl);

        return hiddenWrapperEl;
    }

    getRegisteredClass(ref) {
        if (typeof ref === "string" && ref !== "") {
            return this.#registry.get(ref);
        }
    }

    register(ref, FormElementClass) {
        if (typeof ref !== "string" || ref === "") {
            throw new TypeError("ref must be a non empty string");
        }
        if (!instanceOfOne(FormElementClass.prototype, ...EXPECTED_CLASSES)) {
            throw new TypeError(`registered types must inherit from one of [${EXPECTED_CLASSES.map((c) => c.name).join(", ")}]`);
        }
        if (this.#registry.has(ref)) {
            throw new Error(`type "${ref}" already registered`);
        }
        this.#registry.set(ref, FormElementClass);
        return this;
    }

    getRegisteredRefs() {
        return Array.from(this.#registry.keys());
    }

}

export default new FormElementRegistry();
