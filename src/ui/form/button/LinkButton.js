import {deepClone} from "emcjs/util/helper/DeepClone.js";
import {registerFocusable} from "../../../util/element/ElementFocusManager.js";
import Button from "./Button.js";
import "../../i18n/I18nTooltip.js";
import "../../i18n/I18nLabel.js";
import "../../icon/FontIcon.js";
import TPL from "./LinkButton.js.html" assert {type: "html"};
import STYLE from "./LinkButton.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./LinkButton.js.json" assert {type: "json"};

export default class LinkButton extends Button {

    static get formConfigurationFields() {
        return [...super.formConfigurationFields, ...deepClone(CONFIG_FIELDS)];
    }

    #buttonEl;

    constructor() {
        super();
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#buttonEl = this.shadowRoot.getElementById("button");
        this.#buttonEl.append(els);
    }

    clickHandler(event) {
        const resume = super.clickHandler(event);
        if (resume) {
            window.open(this.href, this.target, {
                popup: this.popup,
                noopener: this.noopener,
                noreferrer: this.noreferrer
            });
        }
    }

    set href(value) {
        this.setStringAttribute("href", value);
    }

    get href() {
        return this.getStringAttribute("href");
    }

    set target(value) {
        this.setStringAttribute("target", value);
    }

    get target() {
        return this.getStringAttribute("target");
    }

    set popup(value) {
        this.setBooleanAttribute("popup", value);
    }

    get popup() {
        return this.getBooleanAttribute("popup");
    }

    set noopener(value) {
        this.setBooleanAttribute("noopener", value);
    }

    get noopener() {
        return this.getBooleanAttribute("noopener");
    }

    set noreferrer(value) {
        this.setBooleanAttribute("noreferrer", value);
    }

    get noreferrer() {
        return this.getBooleanAttribute("noreferrer");
    }

}

customElements.define("emc-button-link", LinkButton);
registerFocusable("emc-button-link");
