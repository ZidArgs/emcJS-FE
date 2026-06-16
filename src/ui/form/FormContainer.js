import {debounce} from "@emcjs/core/util/Debouncer.js";
import {throttle} from "@emcjs/core/util/Throttle.js";
import CustomElement from "../element/CustomElement.js";
import MutationObserverManager from "../../util/observer/manager/MutationObserverManager.js";
import {nodeOccurenceComparator} from "../../util/node/NodeListSort.js";
import {getFocusableElements} from "../../util/element/ElementFocusManager.js";
import FormSection from "./FormSection.js";
import TPL from "./FormContainer.js.html" assert {type: "html"};
import STYLE from "./FormContainer.js.css" assert {type: "css"};

const MUTATION_CONFIG = {
    childList: true,
    subtree: true
};

export default class FormContainer extends CustomElement {

    #headerEl;

    #footerEl;

    #contentEl;

    #sectionNodeSet = new Set();

    #sectionNodeList = [];

    #activeSectionEl;

    #mutationObserver = new MutationObserverManager(MUTATION_CONFIG, (mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
                for (const node of mutation.addedNodes) {
                    if (node instanceof FormSection) {
                        this.#addSectionRecursive(node);
                    }
                }
                for (const node of mutation.removedNodes) {
                    if (node instanceof FormSection) {
                        this.#removeSectionRecursive(node);
                    }
                }
            }
        }
    });

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#headerEl = this.shadowRoot.getElementById("header");
        this.#footerEl = this.shadowRoot.getElementById("footer");
        this.#contentEl = this.shadowRoot.getElementById("content");
        /* --- */
        this.#headerEl.addEventListener("slotchange", () => {
            this.#onHeaderSlotChange();
        });
        this.#onHeaderSlotChange();
        /* --- */
        this.#footerEl.addEventListener("slotchange", () => {
            this.#onFooterSlotChange();
        });
        this.#onFooterSlotChange();
        /* --- */
        this.#contentEl.addEventListener("scroll", () => {
            this.#refreshSectionState();
        });
        /* --- */
        this.#mutationObserver.observe(this);
    }

    resetScroll() {
        this.#contentEl.scrollTo(0, 0);
    }

    getFocusableElements() {
        return getFocusableElements(this.shadowRoot);
    }

    get sectionNodeList() {
        return [...this.#sectionNodeList];
    }

    get activeSection() {
        return this.#activeSectionEl;
    }

    set noScroll(value) {
        this.setBooleanAttribute("noscroll", value);
    }

    get noScroll() {
        return this.getBooleanAttribute("noscroll");
    }

    set noBorder(value) {
        this.setBooleanAttribute("noborder", value);
    }

    get noBorder() {
        return this.getBooleanAttribute("noborder");
    }

    #addSection(sectionEl) {
        this.#sectionNodeSet.add(sectionEl);
        this.#onSectionListChanged();
    }

    #addSectionRecursive(sectionEl) {
        const sectionEls = sectionEl.querySelectorAll("emc-form-section");
        this.#addSection(sectionEl);
        for (const node of sectionEls) {
            this.#addSection(node);
        }
    }

    #removeSection(sectionEl) {
        this.#sectionNodeSet.delete(sectionEl);
        this.#onSectionListChanged();
    }

    #removeSectionRecursive(sectionEl) {
        const sectionEls = sectionEl.querySelectorAll("emc-form-section");
        for (const node of sectionEls) {
            this.#removeSection(node);
        }
        this.#removeSection(sectionEl);
    }

    #onSectionListChanged = debounce(() => {
        this.#sectionNodeList = [...this.#sectionNodeSet].sort(nodeOccurenceComparator);
        const event = new Event("sectionlist_change");
        event.sectionList = [...this.#sectionNodeList];
        this.dispatchEvent(event);
        this.#refreshSectionState();
    });

    #refreshSectionState = throttle(() => {
        const sectionEls = [...this.#sectionNodeList];
        for (const sectionEl of sectionEls) {
            sectionEl.refreshState();
        }
        let activeSection = sectionEls.shift();
        while (sectionEls.length && activeSection.bodyVisibleHeight < 20) {
            activeSection = sectionEls.shift();
        }
        if (this.#activeSectionEl != activeSection) {
            if (this.#activeSectionEl != null) {
                this.#activeSectionEl.classList.remove("active");
            }
            if (activeSection != null) {
                activeSection.classList.add("active");
            }
            this.#activeSectionEl = activeSection;
            const event = new Event("section_change");
            event.section = activeSection;
            this.dispatchEvent(event);
        }
    }, 100);

    #onHeaderSlotChange = debounce(() => {
        const elementList = this.#headerEl.assignedElements({flatten: true}).filter((el) => el instanceof HTMLFormElement);
        this.#headerEl.classList.toggle("has-slotted", elementList.length > 0);
    });

    #onFooterSlotChange = debounce(() => {
        const elementList = this.#footerEl.assignedElements({flatten: true}).filter((el) => el instanceof HTMLFormElement);
        this.#footerEl.classList.toggle("has-slotted", elementList.length > 0);
    });

}

customElements.define("emc-form-container", FormContainer);
