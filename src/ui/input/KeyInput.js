import {toStartUppercaseEndLowercase} from "@emcjs/core/util/helper/string/ConvertCase.js";
import CustomElementDelegating from "../element/CustomElementDelegating.js";
import TPL from "./KeyInput.js.html" assert {type: "html"};
import STYLE from "./KeyInput.js.css" assert {type: "css"};

const BLACKLIST = [
    "Control",
    "Shift",
    "Alt",
    "Meta"
];
const VALUE_PARSE = /(ctrl\+)?(shift\+)?(alt\+)?(meta\+)?(.+)?/i;

/**
 * @deprecated
 */
export default class KeyInput extends CustomElementDelegating {

    #displayEl;

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#displayEl = this.shadowRoot.getElementById("display");
        this.addEventListener("keydown", (event) => {
            const {
                key, ctrlKey, shiftKey, altKey, metaKey
            } = event;
            if (key !== "Tab") {
                if (key === "Escape") {
                    this.value = "";
                    const ev = new Event("change");
                    ev.ctrlKey = false;
                    ev.shiftKey = false;
                    ev.altKey = false;
                    ev.metaKey = false;
                    ev.key = "";
                    this.dispatchEvent(ev);
                } else if (BLACKLIST.includes(key)) {
                    this.#display(KeyInput.stringifyKeys({
                        ctrlKey,
                        shiftKey,
                        altKey,
                        metaKey
                    }));
                } else {
                    this.value = KeyInput.stringifyKeys({
                        ctrlKey,
                        shiftKey,
                        altKey,
                        metaKey,
                        key
                    });
                    const ev = new Event("change");
                    ev.ctrlKey = ctrlKey;
                    ev.shiftKey = shiftKey;
                    ev.altKey = altKey;
                    ev.metaKey = metaKey;
                    ev.key = key;
                    this.dispatchEvent(ev);
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });
        this.addEventListener("keyup", (event) => {
            if (event.key !== "Tab") {
                const value = KeyInput.parseKeys(this.value);
                if (value.key == null) {
                    const {
                        ctrlKey, shiftKey, altKey, metaKey
                    } = event;
                    this.#display(KeyInput.stringifyKeys({
                        ctrlKey,
                        shiftKey,
                        altKey,
                        metaKey
                    }));
                }
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });
        this.addEventListener("blur", () => {
            this.#display(this.value);
        });
    }

    #display(value) {
        this.#displayEl.value = value.split("+").map((s) => toStartUppercaseEndLowercase(s)).join(" + ");
    }

    set value(val) {
        this.setAttribute("value", val);
    }

    get value() {
        return this.getAttribute("value");
    }

    static get observedAttributes() {
        return ["value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue != newValue) {
            switch (name) {
                case "value": {
                    this.#display(newValue);
                } break;
            }
        }
    }

    static parseKeys(string) {
        const res = VALUE_PARSE.exec(string);
        return {
            ctrlKey: res[1] != null,
            shiftKey: res[2] != null,
            altKey: res[3] != null,
            metaKey: res[4] != null,
            key: res[5] === "Space" ? " " : res[5]
        };
    }

    static stringifyKeys(opts = {}) {
        const {
            ctrlKey, shiftKey, altKey, metaKey, key
        } = opts;
        let res = "";
        if (ctrlKey) {
            res += "ctrl+";
        }
        if (shiftKey) {
            res += "shift+";
        }
        if (altKey) {
            res += "alt+";
        }
        if (metaKey) {
            res += "meta+";
        }
        if (key != null) {
            res += key === " " ? "Space" : key;
        }
        return res;
    }

}

customElements.define("emc-keyinput", KeyInput);
