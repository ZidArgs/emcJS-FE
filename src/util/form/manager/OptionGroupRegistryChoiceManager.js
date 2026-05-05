import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import OptionGroupRegistry from "../../../registry/form/OptionGroupRegistry.js";
import AbstractFormElement from "../../../ui/form/element/AbstractFormElement.js";
import I18nOption from "../../../ui/i18n/builtin/I18nOption.js";

const MANAGERS = new WeakMap();

export default class OptionGroupRegistryChoiceManager {

    #targetEl;

    #optionGroupRegistry = null;

    #optionGroupRegistryEventTargetManager = new EventTargetManager();

    constructor(targetEl) {
        if (!(targetEl instanceof AbstractFormElement)) {
            throw new TypeError("OptionGroupRegistryChoiceManager can only work on AbstractFormElement");
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
            for (const [key, value] of this.#optionGroupRegistry) {
                const optionEl = I18nOption.create();
                optionEl.value = key;
                optionEl.i18nValue = value;
                this.#targetEl.append(optionEl);
            }
        }
    }

}
