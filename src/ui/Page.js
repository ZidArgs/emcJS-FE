import CustomElement from "./element/CustomElement.js";
import "./overlay/message/MessageLayer.js";
import "./overlay/ctxmenu/ContextMenuLayer.js";
import TPL from "./Page.js.html" assert {type: "html"};
import STYLE from "./Page.js.css" assert {type: "css"};

export default class Page extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
    }

}

customElements.define("emc-page", Page);
