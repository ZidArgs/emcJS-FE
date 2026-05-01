import {getInnerText} from "../../util/node/ExtractText.js";
import {
    scrollIntoView, scrollIntoViewIfNeeded
} from "../../util/node/Scroll.js";
import {
    getBooleanAttribute,
    getEnumAttribute,
    getIntAttribute,
    getJSONAttribute,
    getListAttribute,
    getNumberAttribute,
    getStringAttribute,
    setBooleanAttribute,
    setEnumAttribute,
    setIntAttribute,
    setJSONAttribute,
    setListAttribute,
    setNumberAttribute,
    setStringAttribute
} from "../../util/node/NodeAttributes.js";
import STYLE from "./CustomElement.js.css" assert {type: "css"};
import SCROLLBAR_STYLE from "../../_style/scrollbar.css" assert {type: "css"};

export default class CustomElement extends HTMLElement {

    static get delegatesFocus() {
        return false;
    }

    static get formAssociated() {
        return false;
    }

    constructor() {
        if (new.target === CustomElement) {
            throw new Error("can not construct abstract class");
        }
        super();
        /* --- */
        this.attachShadow({
            mode: "open",
            delegatesFocus: this.constructor.delegatesFocus
        });
        STYLE.apply(this.shadowRoot);
        SCROLLBAR_STYLE.apply(this.shadowRoot);
    }

    getText(excludedNodeClasses = []) {
        return getInnerText(this, excludedNodeClasses);
    }

    set disabled(value) {
        this.setBooleanAttribute("disabled", value);
    }

    get disabled() {
        return this.getBooleanAttribute("disabled");
    }

    set hidden(value) {
        this.setBooleanAttribute("hidden", value);
    }

    get hidden() {
        return this.getBooleanAttribute("hidden");
    }

    setBooleanAttribute(name, value) {
        setBooleanAttribute(this, name, value);
    }

    getBooleanAttribute(name) {
        return getBooleanAttribute(this, name);
    }

    setStringAttribute(name, value) {
        setStringAttribute(this, name, value);
    }

    getStringAttribute(name) {
        return getStringAttribute(this, name);
    }

    setNumberAttribute(name, value, min, max) {
        setNumberAttribute(this, name, value, min, max);
    }

    getNumberAttribute(name) {
        return getNumberAttribute(this, name);
    }

    setIntAttribute(name, value, min, max) {
        setIntAttribute(this, name, value, min, max);
    }

    getIntAttribute(name) {
        return getIntAttribute(this, name);
    }

    setJSONAttribute(name, value) {
        setJSONAttribute(this, name, value);
    }

    getJSONAttribute(name) {
        return getJSONAttribute(this, name);
    }

    setEnumAttribute(name, value, allowedValues) {
        setEnumAttribute(this, name, value, allowedValues);
    }

    getEnumAttribute(name) {
        return getEnumAttribute(this, name);
    }

    setListAttribute(name, value, allowedValues) {
        setListAttribute(this, name, value, allowedValues);
    }

    getListAttribute(name) {
        return getListAttribute(this, name);
    }

    scrollIntoViewIfNeeded(options) {
        scrollIntoViewIfNeeded(this, options);
    }

    scrollIntoView(options) {
        scrollIntoView(this, options);
    }

}
