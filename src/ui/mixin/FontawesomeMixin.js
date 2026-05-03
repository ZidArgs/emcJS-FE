import {createMixin} from "@emcjs/core/util/Mixin.js";
import STYLE from "./FontawesomeMixin.js.css" assert {type: "css"};

export default createMixin((superclass) => class FontawesomeMixin extends superclass {

    constructor(...args) {
        super(...args);
        /* --- */
        STYLE.apply(this.shadowRoot);
    }

});
