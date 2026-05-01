import Message from "./Message.js";
import STYLE from "./ActionMessage.js.css" assert {type: "css"};

export default class ActionMessage extends Message {

    constructor(opts = {}) {
        super(opts);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.addEventListener("click", (event) => {
            event.stopPropagation();
            this.remove();
            this.dispatchEvent(new Event("action"));
        });
    }

}

customElements.define("emc-message-action", ActionMessage);
