import CharacterSearch from "@emcjs/core/util/search/CharacterSearch.js";
import CustomElement from "./element/CustomElement.js";
import {getInnerText} from "../util/node/ExtractText.js";
import "./header/SearchHeader.js";
import TPL from "./FilteredList.js.html" assert {type: "html"};
import STYLE from "./FilteredList.js.css" assert {type: "css"};

export default class FilteredList extends CustomElement {

    #headerEl;

    #containerEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#headerEl = this.shadowRoot.getElementById("header");
        this.#containerEl = this.shadowRoot.getElementById("container");
        this.#containerEl.addEventListener("slotchange", () => {
            // TODO only check new elements
            // TODO reset removed elements
            // header.search
        });
        /* header */
        this.#headerEl.addEventListener("search", (event) => {
            const all = this.querySelectorAll(":scope > :not(emc-collapsepanel), emc-collapsepanel > :not(emc-collapsepanel)");
            const panels = this.querySelectorAll("emc-collapsepanel");
            if (event.value) {
                const regEx = new CharacterSearch(event.value);
                for (const el of all) {
                    const value = el.dataset.filtervalue ?? getInnerText(el);
                    if (regEx.test(value)) {
                        el.style.display = "";
                    } else {
                        el.style.display = "none";
                    }
                }
                for (const el of panels) {
                    const children = el.querySelectorAll(":scope :not(emc-collapsepanel)");
                    if (Array.from(children).some((ch) => ch.style.display == "")) {
                        el.style.display = "";
                        continue;
                    }
                    el.style.display = "none";
                }
            } else {
                for (const el of all) {
                    el.style.display = "";
                }
                for (const el of panels) {
                    el.style.display = "";
                }
            }
        });
    }

}

customElements.define("emc-filteredlist", FilteredList);
