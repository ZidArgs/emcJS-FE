import CustomElement from "../element/CustomElement.js";
import STYLE from "./Panel.js.css" assert {type: "css"};

const REG = new Map();

export default class Panel extends CustomElement {

    constructor() {
        super();
        STYLE.apply(this.shadowRoot);
        /* --- */
        if (new.target === Panel) {
            throw new Error("can not construct abstract class");
        }
    }

    static registerReference(ref, clazz) {
        if (!(clazz.prototype instanceof Panel)) {
            throw new Error("registered class must extend the Panel class");
        }
        REG.set(ref, clazz);
    }

    static getReference(ref) {
        if (REG.has(ref)) {
            return REG.get(ref);
        }
    }

}
