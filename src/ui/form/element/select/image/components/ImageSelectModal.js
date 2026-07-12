import EventMultiTargetManager from "@emcjs/core/util/event/EventMultiTargetManager.js";
import CharacterSearch from "@emcjs/core/util/search/CharacterSearch.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import ModalDialog from "../../../../../modal/ModalDialog.js";
import ElementListCache from "../../../../../../util/element/ElementListCache.js";
import ImageBackgroundTypes from "../../../../../../enum/form/ImageBackgroundTypes.js";
import "../../../../button/Button.js";
import "../../../input/search/SearchInput.js";
import "./ImageSelectPreview.js";
import TPL from "./ImageSelectModal.js.html" assert {type: "html"};
import STYLE from "./ImageSelectModal.js.css" assert {type: "css"};

// TODO maybe add a new set of colors for the preview elements?
export default class ImageSelectModal extends ModalDialog {

    #value;

    #contentEl;

    #slotEl;

    #searchEl;

    #viewControlEl;

    #viewSizeSmallEl;

    #viewSizeNormalEl;

    #viewSizeBigEl;

    #viewSizeGiganticEl;

    #viewBackgroundLightEl;

    #viewBackgroundDarkEl;

    #viewBackgroundLightCheckeredEl;

    #viewBackgroundDarkCheckeredEl;

    #optionNodeList = new ElementListCache();

    #optionSelectEventManager = new EventMultiTargetManager();

    constructor(caption = "Select image...", options = {}) {
        super(caption, {
            submit: true,
            cancel: true,
            ...options
        });
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#contentEl = this.shadowRoot.getElementById("content");

        this.#searchEl = els.getElementById("search");
        this.#contentEl.before(this.#searchEl);
        this.#searchEl.addEventListener("change", () => {
            const all = this.children;
            if (this.#searchEl.value) {
                const regEx = new CharacterSearch(this.#searchEl.value);
                for (const el of all) {
                    const testText = el.comparatorText ?? el.innerText;
                    if (regEx.test(testText.trim())) {
                        el.style.display = "";
                    } else {
                        el.style.display = "none";
                    }
                }
            } else {
                for (const el of all) {
                    el.style.display = "";
                }
            }
        });

        this.#viewControlEl = els.getElementById("view-control");
        this.#contentEl.before(this.#viewControlEl);

        /* --- */
        this.#viewSizeSmallEl = this.shadowRoot.getElementById("view-size-small");
        this.#viewSizeNormalEl = this.shadowRoot.getElementById("view-size-normal");
        this.#viewSizeBigEl = this.shadowRoot.getElementById("view-size-big");
        this.#viewSizeGiganticEl = this.shadowRoot.getElementById("view-size-gigantic");

        this.#viewSizeSmallEl.addEventListener("click", () => {
            this.#contentEl.style.setProperty("--image-preview-size", "50px");
            this.#viewSizeSmallEl.active = true;
            this.#viewSizeNormalEl.active = false;
            this.#viewSizeBigEl.active = false;
            this.#viewSizeGiganticEl.active = false;
        });
        this.#viewSizeNormalEl.addEventListener("click", () => {
            this.#contentEl.style.setProperty("--image-preview-size", "100px");
            this.#viewSizeSmallEl.active = false;
            this.#viewSizeNormalEl.active = true;
            this.#viewSizeBigEl.active = false;
            this.#viewSizeGiganticEl.active = false;
        });
        this.#viewSizeBigEl.addEventListener("click", () => {
            this.#contentEl.style.setProperty("--image-preview-size", "200px");
            this.#viewSizeSmallEl.active = false;
            this.#viewSizeNormalEl.active = false;
            this.#viewSizeBigEl.active = true;
            this.#viewSizeGiganticEl.active = false;
        });
        this.#viewSizeGiganticEl.addEventListener("click", () => {
            this.#contentEl.style.setProperty("--image-preview-size", "400px");
            this.#viewSizeSmallEl.active = false;
            this.#viewSizeNormalEl.active = false;
            this.#viewSizeBigEl.active = false;
            this.#viewSizeGiganticEl.active = true;
        });
        /* --- */
        this.#viewBackgroundLightEl = this.shadowRoot.getElementById("view-background-light");
        this.#viewBackgroundDarkEl = this.shadowRoot.getElementById("view-background-dark");
        this.#viewBackgroundLightCheckeredEl = this.shadowRoot.getElementById("view-background-light-checkered");
        this.#viewBackgroundDarkCheckeredEl = this.shadowRoot.getElementById("view-background-dark-checkered");

        this.#viewBackgroundLightEl.addEventListener("click", () => {
            this.#applyBackgroundType(ImageBackgroundTypes.LIGHT);
            this.#viewBackgroundLightEl.active = true;
            this.#viewBackgroundDarkEl.active = false;
            this.#viewBackgroundLightCheckeredEl.active = false;
            this.#viewBackgroundDarkCheckeredEl.active = false;
        });
        this.#viewBackgroundDarkEl.addEventListener("click", () => {
            this.#applyBackgroundType(ImageBackgroundTypes.DARK);
            this.#viewBackgroundLightEl.active = false;
            this.#viewBackgroundDarkEl.active = true;
            this.#viewBackgroundLightCheckeredEl.active = false;
            this.#viewBackgroundDarkCheckeredEl.active = false;
        });
        this.#viewBackgroundLightCheckeredEl.addEventListener("click", () => {
            this.#applyBackgroundType(ImageBackgroundTypes.LIGHT_CHECKERED);
            this.#viewBackgroundLightEl.active = false;
            this.#viewBackgroundDarkEl.active = false;
            this.#viewBackgroundLightCheckeredEl.active = true;
            this.#viewBackgroundDarkCheckeredEl.active = false;
        });
        this.#viewBackgroundDarkCheckeredEl.addEventListener("click", () => {
            this.#applyBackgroundType(ImageBackgroundTypes.DARK_CHECKERED);
            this.#viewBackgroundLightEl.active = false;
            this.#viewBackgroundDarkEl.active = false;
            this.#viewBackgroundLightCheckeredEl.active = false;
            this.#viewBackgroundDarkCheckeredEl.active = true;
        });
        /* --- */
        this.#optionSelectEventManager.set("click", (event) => {
            this.#value = event.currentTarget.getAttribute("value");
            this.#applyValue();
            event.preventDefault();
            event.stopPropagation();
        });
        /* --- */
        this.#slotEl = this.shadowRoot.getElementById("slot");
        this.#slotEl.addEventListener("slotchange", () => {
            this.#onSlotChange();
        });
    }

    async show(value) {
        this.#value = value;
        this.#applyValue();
        const result = await super.show();
        return result && this.#value;
    }

    get value() {
        return this.#value;
    }

    #applyValue() {
        const oldSelectedEl = this.querySelector(`.selected`);
        if (oldSelectedEl != null) {
            oldSelectedEl.classList.remove("selected");
        }
        const newSelectedEl = this.querySelector(`[value="${this.#value}"]`);
        if (newSelectedEl != null) {
            newSelectedEl.classList.add("selected");
        }
    }

    #applyBackgroundType(value) {
        for (const el of this.#optionNodeList) {
            el.background = value;
        }
    }

    #onSlotChange = debounce(() => {
        this.#resolveSlottedElements();
    });

    #resolveSlottedElements() {
        const optionNodeList = this.#slotEl.assignedElements({flatten: true}).filter((el) => el.matches("[value]"));
        this.#optionNodeList.setNodeList(optionNodeList);
        /* --- */
        this.#optionSelectEventManager.clearTargets();
        for (const el of optionNodeList) {
            this.#optionSelectEventManager.addTarget(el);
        }
        /* --- */
        this.#applyValue();
    }

}

customElements.define("emc-select-image-modal", ImageSelectModal);
