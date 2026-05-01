import AbstractMessage from "./AbstractMessage.js";
import "../../icon/FontIcon.js";
import TPL from "./Message.js.html" assert {type: "html"};
import STYLE from "./Message.js.css" assert {type: "css"};

// TODO needs popin/popout animation

const TIME = 0;

export default class Message extends AbstractMessage {

    #closeEl;

    #autocloseEl;

    constructor(opts = {}) {
        const {
            text, time = TIME
        } = opts;
        super({text});
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#closeEl = this.shadowRoot.getElementById("close");
        this.#closeEl.addEventListener("click", (event) => {
            event.stopPropagation();
            this.remove();
        });
        /* --- */
        const waitTime = parseInt(time) || TIME;
        if (time > 0) {
            this.#autocloseEl = this.shadowRoot.getElementById("autoclose");
            this.#autocloseEl.style.animation = `autoclose ${waitTime}s linear 1`;
            this.#autocloseEl.addEventListener("animationend", (event) => {
                event.stopPropagation();
                this.remove();
            });
        }
    }

    static get defaultSlot() {
        return "top-right";
    }

}

customElements.define("emc-message", Message);
