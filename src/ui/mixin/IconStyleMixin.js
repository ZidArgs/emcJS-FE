import {createMixin} from "@emcjs/core/mixin/Mixin.js";
import STYLE from "../../_style/emcjs-icons-codes.css" assert {type: "css"};

export default createMixin((superclass) => class IconStyleMixin extends superclass {

    constructor(...args) {
        super(...args);
        /* --- */
        STYLE.apply(this.shadowRoot);
    }

});
