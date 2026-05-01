import AbstractMessage from "./AbstractMessage.js";
import STYLE from "./Toast.js.css" assert {type: "css"};

// TODO needs popin/popout animation

const TIME = 5;

export default class Toast extends AbstractMessage {

    constructor(opts = {}) {
        const {
            text, time = TIME
        } = opts;
        super({text});
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.addEventListener("click", (event) => {
            event.stopPropagation();
            this.remove();
        });
        /* --- */
        const waitTime = parseInt(time) || TIME;
        if (time > 0) {
            setTimeout(() => {
                this.remove();
            }, waitTime * 1000);
        }
    }

}

customElements.define("emc-toast", Toast);
