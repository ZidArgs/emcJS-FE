import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import CustomElement from "../element/CustomElement.js";
import Modal from "../modal/Modal.js";
import {getFocusableElements} from "../../util/element/ElementFocusManager.js";
import "../form/button/Button.js";
import "../icon/FontIcon.js";
import TPL from "./OverlayPanel.js.html" assert {type: "html"};
import STYLE from "./OverlayPanel.js.css" assert {type: "css"};

let activeOverlay = null;

const focusEventManager = new EventTargetManager(window, false);
focusEventManager.set("focus", (event) => {
    if (activeOverlay && !Modal.isAnyModalActive()) {
        const target = event.target;
        if (target instanceof Node && !activeOverlay.contains(target)) {
            activeOverlay.initialFocus();
        }
    }
}, {capture: true});

export default class OverlayPanel extends CustomElement {

    #focusTopEl;

    #focusBottomEl;

    #panelEl;

    #titleTextEl;

    #closeEl;

    constructor(caption) {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#panelEl = this.shadowRoot.getElementById("panel");
        this.#titleTextEl = this.shadowRoot.getElementById("title-text");
        this.#closeEl = this.shadowRoot.getElementById("close");
        if (caption != null) {
            this.caption = caption;
        }
        /* --- */
        this.#panelEl.addEventListener("keydown", (event) => {
            if (event.key == "Escape") {
                this.hide();
                event.stopPropagation();
            }
        });
        this.#closeEl.addEventListener("click", () => {
            this.hide();
        });
        /* --- */
        this.#focusTopEl = this.shadowRoot.getElementById("focus_catcher_top");
        this.#focusTopEl.addEventListener("focus", () => {
            this.focusLast();
        });
        this.#focusBottomEl = this.shadowRoot.getElementById("focus_catcher_bottom");
        this.#focusBottomEl.addEventListener("focus", () => {
            this.focusFirst();
        });
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
        if (activeOverlay) {
            activeOverlay.hide();
        }
        activeOverlay = this;
        this.classList.add("active");
        focusEventManager.active = true;
        this.initialFocus();
    }

    hide() {
        activeOverlay = null;
        this.classList.remove("active");
        focusEventManager.active = false;
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
