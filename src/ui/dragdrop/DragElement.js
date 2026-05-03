import {appUID} from "@emcjs/core/util/helper/UniqueGenerator.js";
import DragDropMemory from "../../data/DragDropMemory.js";
import CustomElement from "../element/CustomElement.js";
import TPL from "./DragElement.js.html" assert {type: "html"};
import STYLE from "./DragElement.js.css" assert {type: "css"};

function dragElement(event) {
    DragDropMemory.clear();
    DragDropMemory.add(event.currentTarget);
    event.stopPropagation();
}

export default class DragElement extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.id = appUID("draggable");
        this.setAttribute("draggable", true);
        this.addEventListener("dragstart", dragElement);
    }

    get group() {
        return this.getAttribute("group");
    }

    set group(val) {
        this.setAttribute("group", val);
    }

}

customElements.define("emc-dragelement", DragElement);
