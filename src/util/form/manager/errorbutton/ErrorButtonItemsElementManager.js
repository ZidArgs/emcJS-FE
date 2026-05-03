import EventManager from "@emcjs/core/util/event/EventManager.js";
import ElementManager from "../../../element/ElementManager.js";
import "../../../../ui/i18n/I18nTextbox.js";
import "../../../../ui/form/button/components/ErrorButtonItem.js";

export default class ErrorButtonItemsElementManager extends ElementManager {

    #index = new WeakMap();

    #eventManager = new EventManager();

    composer() {
        const el = document.createElement("emc-button-error-item");
        this.#eventManager.set(el, "click", () => {
            this.#index.get(el)?.focus();
        });
        return el;
    }

    mutator(el, key, values) {
        el.name = values.name;
        el.label = values.label;
        this.#index.set(el, values.element);

        el.innerHTML = "";
        for (const error of values.errors) {
            const liEl = document.createElement("li");
            const textboxEl = document.createElement("emc-i18n-textbox");
            textboxEl.i18nContent = error;
            liEl.append(textboxEl);
            el.append(liEl);
        }
    }

    cleanup(el) {
        this.#index.delete(el);
        this.#eventManager.clear(el);
    }

}
