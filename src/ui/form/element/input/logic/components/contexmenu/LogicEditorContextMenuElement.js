import ContextMenu from "../../../../../../overlay/ctxmenu/ContextMenu.js";

export default class LogicEditorContextMenuElement extends ContextMenu {

    initItems() {
        super.setItems([
            // {menuAction: "copy", content: "Copy"},
            // {menuAction: "cut", content: "Cut"},
            // "splitter",
            // {menuAction: "negate", content: "Negate"},
            // "splitter",
            // {menuAction: "wrapand", content: "Wrap And"},
            // {menuAction: "wrapnand", content: "Wrap Nand"},
            // {menuAction: "wrapor", content: "Wrap Or"},
            // {menuAction: "wrapnor", content: "Wrap Nor"},
            // {menuAction: "wrapxor", content: "Wrap Xor"},
            // {menuAction: "wrapxnor", content: "Wrap Xnor"},
            // "splitter",
            {
                menuAction: "remove",
                content: "Remove"
            }
        ]);
    }

    setItems() {
        // nothing
    }

}

customElements.define("emc-ctxmenu-logiceditor-element", LogicEditorContextMenuElement);
