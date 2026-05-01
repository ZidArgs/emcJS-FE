import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import OptionGroupRegistry from "../../../data/registry/form/OptionGroupRegistry.js";
import AbstractFormElement from "../../../ui/form/element/AbstractFormElement.js";

const MANAGERS = new WeakMap();

export default class OptionGroupRegistryValuesManager {

    #targetEl;

    #optionGroupRegistry = null;

    #optionGroupRegistryEventTargetManager = new EventTargetManager();

    constructor(targetEl) {
        if (!(targetEl instanceof AbstractFormElement)) {
            throw new TypeError("OptionGroupRegistryValuesManager can only work on AbstractFormElement");
        }
        if (MANAGERS.has(targetEl)) {
            return MANAGERS.get(targetEl);
        }
        MANAGERS.set(targetEl, this);
        this.#targetEl = targetEl;
        /* --- */
        this.#optionGroupRegistryEventTargetManager.set("change", () => {
            this.#loadOptionsFromRegistry();
        });
        /* --- */
        this.#targetEl.addEventListener("change", () => {
            const value = this.#targetEl.value;
            for (const token of value) {
                this.#optionGroupRegistry.setAll(token);
            }
        });
    }

    set optionGroup(value) {
        if (typeof value !== "string" || value === "") {
            value = null;
        }
        if (this.#optionGroupRegistry != value) {
            if (value == null) {
                this.#optionGroupRegistry = null;
            } else {
                this.#optionGroupRegistry = new OptionGroupRegistry(value);
            }
            this.#optionGroupRegistryEventTargetManager.switchTarget(this.#optionGroupRegistry);
            this.#loadOptionsFromRegistry();
        }
    }

    get optionGroup() {
        return this.#optionGroupRegistry;
    }

    #loadOptionsFromRegistry() {
        this.#targetEl.innerHTML = "";
        if (this.#optionGroupRegistry != null) {
            const registryValue = this.#optionGroupRegistry.getAll();
            if (registryValue != null) {
                this.#targetEl.value = registryValue;
            } else {
                const inputValue = this.#targetEl.value;
                if (inputValue != null) {
                    this.#optionGroupRegistry.setAll(inputValue);
                }
            }
        }
    }

}
