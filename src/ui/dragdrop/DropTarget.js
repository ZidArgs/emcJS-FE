import DragDropMemory from "../../data/DragDropMemory.js";
import CustomElement from "../element/CustomElement.js";
import TPL from "./DropTarget.js.html" assert {type: "html"};
import STYLE from "./DropTarget.js.css" assert {type: "css"};

export default class DropTarget extends CustomElement {

    constructor() {
        super();
        this.shadowRoot.append(TPL.generate());
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.ondrop = (event) => {
            const els = DragDropMemory.get();
            if (els.length) {
                this.append(els);
            }
            DragDropMemory.clear();
            event.preventDefault();
            event.stopPropagation();
        };
        this.ondragover = (event) => {
            const els = DragDropMemory.get();
            if (!this.group) {
                event.preventDefault();
                event.stopPropagation();
            } else if (els.every((e) => e.group == this.group)) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
    }

    get group() {
        return this.getAttribute("group");
    }

    set group(val) {
        this.setAttribute("group", val);
    }

}

customElements.define("emc-droptarget", DropTarget);
