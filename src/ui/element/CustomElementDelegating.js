import CustomElement from "./CustomElement.js";

// TODO is this really needed just to add a single abstract parameter
export default class CustomElementDelegating extends CustomElement {

    constructor() {
        if (new.target === CustomElementDelegating) {
            throw new Error("can not construct abstract class");
        }
        super();
    }

    static get delegatesFocus() {
        return true;
    }

    static get formAssociated() {
        return false;
    }

}
