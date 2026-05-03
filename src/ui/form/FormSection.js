import {immute} from "@emcjs/core/data/Immutable.js";
import {delimitInteger} from "@emcjs/core/util/helper/number/Integer.js";
import CustomElement from "../element/CustomElement.js";
import {findAllParentsBySelector} from "../../util/node/FindParentBySelector.js";
import {
    scrollIntoView, scrollIntoViewIfNeeded
} from "../../util/node/Scroll.js";
import {getBoundingContentRect} from "../../util/element/ElementSizeRetriever.js";
import "../i18n/I18nLabel.js";
import TPL from "./FormSection.js.html" assert {type: "html"};
import STYLE from "./FormSection.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./FormSection.js.json" assert {type: "json"};

export default class FormSection extends CustomElement {

    static get formConfigurationFields() {
        return immute(CONFIG_FIELDS);
    }

    static get formConfigurationCanHaveChildren() {
        return true;
    }

    #scrollToEl;

    #headerEl;

    #bodyEl;

    #labelEl = document.createElement("emc-i18n-label");

    #parentSectionEls = [];

    #bodyVisibleHeight = 0;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#scrollToEl = this.shadowRoot.getElementById("scroll-to");
        this.#headerEl = this.shadowRoot.getElementById("header");
        this.#bodyEl = this.shadowRoot.getElementById("body");
    }

    connectedCallback() {
        this.#parentSectionEls = findAllParentsBySelector(this, "emc-form-section");
        const level = delimitInteger(this.#parentSectionEls.length + 1, 1, 6);

        const sectionHeadingEl = document.createElement(`h${level}`);
        sectionHeadingEl.appendChild(this.#labelEl);
        this.#headerEl.appendChild(sectionHeadingEl);
        this.#headerEl.className = `level-${level}`;
        this.#scrollToEl.className = `level-${level}`;
    }

    disconnectedCallback() {
        this.#headerEl.innerHTML = "";
    }

    get parentSectionElementList() {
        return [...this.#parentSectionEls];
    }

    get bodyVisibleHeight() {
        return this.#bodyVisibleHeight;
    }

    set label(value) {
        this.setStringAttribute("label", value);
    }

    get label() {
        return this.getStringAttribute("label");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [...superObserved, "label"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        if (oldValue != newValue) {
            switch (name) {
                case "label": {
                    this.#labelEl.i18nValue = newValue;
                } break;
            }
        }
    }

    scrollIntoViewIfNeeded(options) {
        scrollIntoViewIfNeeded(this.#scrollToEl, options);
    }

    scrollIntoView(options) {
        scrollIntoView(this.#scrollToEl, options);
    }

    isBodySquishedAway() {
        const headerRect = getBoundingContentRect(this.#headerEl);
        const childSectionEl = this.querySelector("emc-form-section");

        if (childSectionEl != null) {
            const childSectionElRect = getBoundingContentRect(childSectionEl);
            return childSectionElRect.top - 20 < headerRect.bottom;
        }
        const bodyRect = getBoundingContentRect(this.#bodyEl);
        return bodyRect.bottom - 20 < headerRect.bottom;
    }

    refreshState() {
        const headerRect = getBoundingContentRect(this.#headerEl);
        const bodyRect = getBoundingContentRect(this.#bodyEl);
        const childSectionEl = this.querySelector("emc-form-section");

        if (childSectionEl != null) {
            const childSectionElRect = getBoundingContentRect(childSectionEl);
            this.#bodyVisibleHeight = childSectionElRect.top - headerRect.bottom;
            const isHeaderStuck = bodyRect.top < headerRect.bottom;
            this.#headerEl.classList.toggle("stuck", this.#bodyVisibleHeight > 0 && isHeaderStuck);
        } else {
            this.#bodyVisibleHeight = bodyRect.bottom - headerRect.bottom;
            const isHeaderStuck = bodyRect.top < headerRect.bottom;
            this.#headerEl.classList.toggle("stuck", this.#bodyVisibleHeight > 0 && isHeaderStuck);
        }
    }

}

customElements.define("emc-form-section", FormSection);
