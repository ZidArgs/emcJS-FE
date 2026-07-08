import CustomElement from "../element/CustomElement.js";
import {getFocusableElements} from "../../util/element/ElementFocusManager.js";
import "../form/button/Button.js";
import "../icon/FontIcon.js";
import TPL from "./OverlayPanel.js.html" assert {type: "html"};
import STYLE from "./OverlayPanel.js.css" assert {type: "css"};

let activeOverlay = null;

export default class OverlayPanel extends CustomElement {

    #modalEl;

    #titleTextEl;

    #closeEl;

    constructor(caption) {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#modalEl = this.shadowRoot.getElementById("modal");
        this.#titleTextEl = this.shadowRoot.getElementById("title-text");
        this.#closeEl = this.shadowRoot.getElementById("close");
        if (caption != null) {
            this.caption = caption;
        }
        /* --- */
        this.#modalEl.addEventListener("keydown", (event) => {
            if (event.key == "Escape") {
                this.hide();
                event.stopPropagation();
            }
        });
        this.#closeEl.addEventListener("click", () => {
            this.hide();
        });
        /* --- */
        document.body.append(this);
    }

    set caption(value) {
        this.setStringAttribute("caption", value);
    }

    get caption() {
        return this.getStringAttribute("caption");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "caption"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "caption": {
                if (oldValue != newValue) {
                    this.#titleTextEl.i18nValue = newValue;
                }
            } break;
        }
    }

    show() {
        if (this.parentElement == null) {
            document.body.append(this);
        }
        this.#modalEl.showModal();
        if (activeOverlay) {
            activeOverlay.hide();
        }
        activeOverlay = this;
        this.classList.add("active");
        this.initialFocus();
    }

    hide() {
        this.#modalEl.close();
        activeOverlay = null;
        this.classList.remove("active");
    }

    initialFocus() {
        const contentEls = getFocusableElements(this);
        if (contentEls.length) {
            contentEls[0].focus();
        } else  {
            this.#closeEl.focus();
        }
    }

    focusFirst() {
        this.#closeEl.focus();
    }

    focusLast() {
        this.#closeEl.focus();
    }

}

customElements.define("emc-panel-overlay", OverlayPanel);
