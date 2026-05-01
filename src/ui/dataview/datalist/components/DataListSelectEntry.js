import DataListEntry from "./DataListEntry.js";
import SelectCheckBox from "../../../form/element/components/checkbox/SelectCheckBox.js";
import TPL from "./DataListSelectEntry.js.html" assert {type: "html"};
import STYLE from "./DataListSelectEntry.js.css" assert {type: "css"};

// TODO dont use CheckboxInput, simulate checkbox and seleccted state
export default class DataListSelectEntry extends DataListEntry {

    #containerEl;

    #contentEl;

    #selectable = false;

    #selectEnd = false;

    #selectCheckboxEl;

    constructor() {
        super();
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#containerEl.append(els);
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#containerEl.addEventListener("click", (event) => {
            if (event.target !== this.#selectCheckboxEl) {
                this.#selectCheckboxEl.click();
            }
            event.stopPropagation();
        }, {passive: true});
        /* --- */
        this.#selectCheckboxEl = new SelectCheckBox();
        this.#selectCheckboxEl.id = "checkbox";
        this.#selectCheckboxEl.name = "rowselect";
        this.#selectCheckboxEl.addEventListener("change", (event) => {
            event.stopPropagation();
            const ev = new Event("selection", {
                bubbles: true,
                cancelable: true
            });
            ev.data = {
                value: this.#selectCheckboxEl.value,
                key: this.key
            };
            this.dispatchEvent(ev);
        }, {passive: true});
    }

    setData(data) {
        this.#contentEl.innerHTML = "";
        this.#contentEl.innerText = `${this.key}\n${JSON.stringify(data, null, 4)}`;
    }

    set selected(value) {
        this.#selectCheckboxEl.value = !!value;
    }

    get selected() {
        return this.#selectCheckboxEl.value;
    }

    set selectable(value) {
        value = !!value;
        if (this.#selectable !== value) {
            this.#selectable = value;
            this.#renderCheckBox();
        }
    }

    get selectable() {
        return this.#selectable;
    }

    set selectEnd(value) {
        value = !!value;
        if (this.#selectEnd !== value) {
            this.#selectEnd = value;
            this.#renderCheckBox();
        }
    }

    get selectEnd() {
        return this.#selectEnd;
    }

    set disabled(val) {
        this.setBooleanAttribute("disabled", val);
    }

    get disabled() {
        return this.getBooleanAttribute("disabled");
    }

    set readOnly(val) {
        this.setBooleanAttribute("readonly", val);
    }

    get readOnly() {
        return this.getBooleanAttribute("readonly");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "disabled",
            "readonly"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        if (oldValue != newValue) {
            switch (name) {
                case "disabled": {
                    this.#selectCheckboxEl.disabled = this.disabled;
                } break;
                case "readonly": {
                    this.#selectCheckboxEl.readOnly = this.readOnly;
                } break;
            }
        }
    }

    #renderCheckBox() {
        if (this.#selectable) {
            if (this.#selectEnd) {
                this.#containerEl.append(this.#selectCheckboxEl);
            } else {
                this.#containerEl.prepend(this.#selectCheckboxEl);
            }
        } else {
            this.#selectCheckboxEl.remove();
        }
    }

}

customElements.define("emc-datalist-select-entry", DataListSelectEntry);
