import {createMixin} from "@emcjs/core/mixin/Mixin.js";
import FONT_STYLE from "../../_style/icons/emcjs-icons-font.css" assert {type: "css"};
import CODE_STYLE from "../../_style/icons/emcjs-icons-codes.css" assert {type: "css"};

export default createMixin((superclass) => class IconStyleMixin extends superclass {

    constructor(...args) {
        super(...args);
        /* --- */
        FONT_STYLE.apply(this.shadowRoot);
        CODE_STYLE.apply(this.shadowRoot);
    }

});
