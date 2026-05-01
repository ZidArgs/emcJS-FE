import CustomFormElement from "../../../../element/CustomFormElement.js";
import "../checkbox/SelectCheckBox.js";
import "../../input/search/SearchInput.js";
import TPL from "./SearchHeader.js.html" assert {type: "html"};
import STYLE from "./SearchHeader.js.css" assert {type: "css"};

export default class SearchHeader extends CustomFormElement {

    static get changeDebounceTime() {
        return 0;
    }

    #searchEl;

    #selectEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#selectEl = this.shadowRoot.getElementById("select");
        this.#searchEl = this.shadowRoot.getElementById("search");
        this.#selectEl.addEventListener("change", (event) => {
            const ev = new Event("select", {
                bubbles: true,
                cancelable: true
            });
            ev.value = this.#selectEl.value;
            this.dispatchEvent(ev);
            event.stopPropagation();
        });
        this.#searchEl.addEventListener("change", (event) => {
            const ev = new Event("search", {
                bubbles: true,
                cancelable: true
            });
            ev.value = this.#searchEl.value;
            this.dispatchEvent(ev);
            event.stopPropagation();
        }, true);
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#searchEl.disabled = disabled;
        this.#selectEl.disabled = disabled;
    }

    focus(options) {
        this.#searchEl.focus(options);
    }

    set search(value) {
        this.#searchEl.value = value;
    }

    get search() {
        return this.#searchEl.value;
    }

    set selected(value) {
        this.#selectEl.value = value;
    }

    get selected() {
        return this.#selectEl.value;
    }

    set readOnly(value) {
        this.setBooleanAttribute("readonly", value);
    }

    get readOnly() {
        return this.getBooleanAttribute("readonly");
    }

    set selectable(value) {
        this.setBooleanAttribute("selectable", value);
    }

    get selectable() {
        return this.getBooleanAttribute("selectable");
    }

    set selectEnd(value) {
        this.setBooleanAttribute("selectend", value);
    }

    get selectEnd() {
        return this.getBooleanAttribute("selectend");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "readonly",
            "selectend"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "readonly": {
                if (oldValue != newValue) {
                    this.#selectEl.readOnly = this.readOnly;
                }
            } break;
        }
    }

}

customElements.define("emc-form-header-search", SearchHeader);
