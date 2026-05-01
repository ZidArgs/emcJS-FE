import DataListSelectEntry from "../../../../../dataview/datalist/components/DataListSelectEntry.js";
import TPL from "./ListSelectEntry.js.html" assert {type: "html"};
import STYLE from "./ListSelectEntry.js.css" assert {type: "css"};

export default class ListSelectEntry extends DataListSelectEntry {

    #contentEl;

    #textEl;

    constructor() {
        super();
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#contentEl.append(els);
        this.#textEl = this.shadowRoot.getElementById("text");
    }

    setData(data) {
        if (data.name) {
            this.#textEl.i18nValue = data.name;
        } else {
            this.#textEl.i18nValue = "";
            this.#textEl.innerText = this.key;
        }
    }

}

customElements.define("emc-select-list-entry", ListSelectEntry);
