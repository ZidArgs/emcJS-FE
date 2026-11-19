import {createMixin} from "@emcjs/core/mixin/Mixin.js";
import STYLE from "@emcjs/icons/dist/emcjs-icons-codes.css" assert {type: "css"};

export default createMixin((superclass) => class IconStyleMixin extends superclass {

    constructor(...args) {
        super(...args);
        /* --- */
        STYLE.apply(this.shadowRoot);
    }

});
