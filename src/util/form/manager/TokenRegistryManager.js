import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import TokenRegistry from "../../../data/registry/form/TokenRegistry.js";
import AbstractFormElement from "../../../ui/form/element/AbstractFormElement.js";
import I18nOption from "../../../ui/i18n/builtin/I18nOption.js";

const MANAGERS = new WeakMap();

export default class TokenRegistryManager {

    #targetEl;

    #tokenRegistry = null;

    #tokenRegistryEventTargetManager = new EventTargetManager();

    constructor(targetEl) {
        if (!(targetEl instanceof AbstractFormElement)) {
            throw new TypeError("TokenRegistryManager can only work on AbstractFormElement");
        }
        if (MANAGERS.has(targetEl)) {
            return MANAGERS.get(targetEl);
        }
        MANAGERS.set(targetEl, this);
        this.#targetEl = targetEl;
        /* --- */
        this.#tokenRegistryEventTargetManager.set("change", () => {
            this.#loadTokenListFromRegistry();
        });
        /* --- */
        this.#targetEl.addEventListener("change", () => {
            if (this.#tokenRegistry != null && !this.#targetEl.chooseonly) {
                const value = this.#targetEl.value;
                for (const token of value) {
                    this.#tokenRegistry.add(token);
                }
            }
        });
    }

    set tokenGroup(value) {
        if (typeof value !== "string" || value === "") {
            value = null;
        }
        if (this.#tokenRegistry != value) {
            if (value == null) {
                this.#tokenRegistry = null;
            } else {
                this.#tokenRegistry = new TokenRegistry(value);
            }
            this.#tokenRegistryEventTargetManager.switchTarget(this.#tokenRegistry);
            this.#loadTokenListFromRegistry();
        }
    }

    get tokenGroup() {
        return this.#tokenRegistry;
    }

    #loadTokenListFromRegistry() {
        this.#targetEl.innerHTML = "";
        if (this.#tokenRegistry != null) {
            for (const value of this.#tokenRegistry) {
                const optionEl = I18nOption.create();
                optionEl.value = value;
                optionEl.i18nValue = value;
                this.#targetEl.append(optionEl);
            }
        }
    }

}
