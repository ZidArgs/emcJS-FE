import CustomElement from "../element/CustomElement.js";
import "./Option.js";
import TPL from "./SwitchButton.js.html" assert {type: "html"};
import STYLE from "./SwitchButton.js.css" assert {type: "css"};

function getNextElement(all, current) {
    if (!current.nextElementSibling) {
        return all[all.length - 1];
    } else {
        return current.nextElementSibling;
    }
}

function getPrevElement(all, current) {
    if (!current.previousElementSibling) {
        return all[all.length - 1];
    } else {
        return current.previousElementSibling;
    }
}

/**
 * @deprecated
 */
export default class SwitchButton extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.addEventListener("click", this.next);
        this.addEventListener("contextmenu", this.prev);
    }

    connectedCallback() {
        if (!this.value) {
            const all = this.querySelectorAll("[value]");
            if (all.length) {
                this.value = all[0].value;
            }
        }
    }

    get value() {
        return this.getAttribute("value");
    }

    set value(val) {
        this.setAttribute("value", val);
    }

    get readOnly() {
        const val = this.getAttribute("readonly");
        return !!val && val != "false";
    }

    set readOnly(val) {
        this.setAttribute("readonly", val);
    }

    static get observedAttributes() {
        return ["value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "value":
                if (oldValue != newValue) {
                    const oe = this.querySelector(`.active`);
                    if (oe) {
                        oe.classList.remove("active");
                    }
                    const ne = this.querySelector(`[value="${newValue}"]`);
                    if (ne) {
                        ne.classList.add("active");
                    }
                    const event = new Event("change");
                    event.oldValue = oldValue;
                    event.newValue = newValue;
                    event.value = newValue;
                    this.dispatchEvent(event);
                }
                break;
        }
    }

    next(ev) {
        if (!this.readOnly) {
            const all = this.querySelectorAll("[value]");
            if (all.length) {
                const opt = this.querySelector(`[value="${this.value ?? ""}"]`);
                if (opt) {
                    let next = getNextElement(all, opt);
                    let da = next.getAttribute("disabled");
                    while (!da || da == "false" || next == opt) {
                        next = getNextElement(all, opt);
                        da = next.getAttribute("disabled");
                    }
                    this.value = next.getAttribute("value");
                }
            }
        }
        ev.preventDefault();
        return false;
    }

    prev(ev) {
        if (!this.readOnly) {
            const all = this.querySelectorAll("[value]");
            if (all.length) {
                const opt = this.querySelector(`[value="${this.value ?? ""}"]`);
                if (opt) {
                    let next = getPrevElement(all, opt);
                    let da = next.getAttribute("disabled");
                    while (!da || da == "false" || next == opt) {
                        next = getPrevElement(all, opt);
                        da = next.getAttribute("disabled");
                    }
                    this.value = next.getAttribute("value");
                }
            }
        }
        ev.preventDefault();
        return false;
    }

}

customElements.define("emc-switchbutton", SwitchButton);
