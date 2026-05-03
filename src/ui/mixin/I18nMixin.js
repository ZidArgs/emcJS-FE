import {createMixin} from "@emcjs/core/util/Mixin.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import i18n from "@emcjs/core/util/I18n.js";

/* TODO use templating
example
    key: needs {{1}} keypresses to use {{2}}
    tans_en: to use {{2}} you need to enter at least {{1}} keypresses
*/
export default createMixin((superclass) => class I18nMixin extends superclass {

    #i18nEventManager = new EventTargetManager(i18n);

    constructor(...args) {
        super(...args);
        /* --- */
        this.#i18nEventManager.set("language", () => {
            for (const attr of this.constructor.i18nObservedAttributes) {
                const key = this.getAttribute(attr);
                if (key) {
                    this.applyI18n(attr, i18n.get(key));
                }
            }
        });
        this.#i18nEventManager.set("translation", (event) => {
            for (const attr of this.constructor.i18nObservedAttributes) {
                const key = this.getAttribute(attr);
                if (key && event.changes[key] != null) {
                    this.applyI18n(attr, event.changes[key]);
                }
            }
        });
    }

    applyI18n(/* key, value */) {
        // empty
    }

    connectedCallback() {
        if (super.connectedCallback) {
            super.connectedCallback?.();
        }
        /* --- */
        this.#i18nEventManager.active = true;
        /* --- */
        for (const attr of this.constructor.i18nObservedAttributes) {
            const key = this.getAttribute(attr);
            if (key) {
                this.applyI18n(attr, i18n.get(key));
            }
        }
    }

    disconnectedCallback() {
        if (super.disconnectedCallback) {
            super.disconnectedCallback?.();
        }
        /* --- */
        this.#i18nEventManager.active = false;
    }

    static get i18nObservedAttributes() {
        return [];
    }

    static get i18nMultilineAttributes() {
        return [];
    }

    static get observedAttributes() {
        if (super.observedAttributes) {
            const superObserved = super.observedAttributes ?? [];
            return [...superObserved, ...this.i18nObservedAttributes];
        }
        return this.i18nObservedAttributes;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (super.attributeChangedCallback) {
            super.attributeChangedCallback?.(name, oldValue, newValue);
        }
        if (oldValue != newValue && this.constructor.i18nObservedAttributes.includes(name)) {
            if (newValue) {
                if (this.constructor.i18nMultilineAttributes.includes(name)) {
                    const values = newValue.split("\n");
                    const translation = values.map((value) => i18n.get(value));
                    this.applyI18n(name, translation.join("\n"));
                } else {
                    this.applyI18n(name, i18n.get(newValue));
                }
            } else {
                this.applyI18n(name, "");
            }
        }
    }

});
