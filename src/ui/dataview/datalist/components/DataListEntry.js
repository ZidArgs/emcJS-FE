import CustomElement from "../../../element/CustomElement.js";
import TPL from "./DataListEntry.js.html" assert {type: "html"};
import STYLE from "./DataListEntry.js.css" assert {type: "css"};

export default class DataListEntry extends CustomElement {

    #containerEl;

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#containerEl = this.shadowRoot.getElementById("container");
        /* --- */
        this.addEventListener("contextmenu", (event) => {
            event.stopPropagation();
            event.preventDefault();
            const menuEvent = new Event("menu", {
                bubbles: true,
                cancelable: true
            });
            menuEvent.data = {key: this.key};
            this.dispatchEvent(menuEvent);
        });
    }

    setData(data) {
        this.#containerEl.innerText = `${this.key}\n${JSON.stringify(data, null, 4)}`;
    }

    set key(value) {
        this.setAttribute("key", value);
    }

    get key() {
        return this.getAttribute("key");
    }

}

customElements.define("emc-datalist-entry", DataListEntry);
