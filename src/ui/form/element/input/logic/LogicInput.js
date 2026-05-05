import {immute} from "@emcjs/core/data/Immutable.js";
import {reduceLogic} from "@emcjs/core/util/logic/LogicReducer.js";
import {isEqual} from "@emcjs/core/util/helper/Comparator.js";
import {debounce} from "@emcjs/core/util/Debouncer.js";
import AbstractFormElement from "../../AbstractFormElement.js";
import FormElementRegistry from "../../../../../registry/form/FormElementRegistry.js";
import {registerFocusable} from "../../../../../util/element/ElementFocusManager.js";
import Direction from "../../../../../enum/Direction.js";
import DragDropMemory from "../../../../../data/DragDropMemory.js";
import ContextMenuManagerMixin from "../../../../mixin/ContextMenuManagerMixin.js";
import LogicEditorContextMenuElement from "./components/contexmenu/LogicEditorContextMenuElement.js";
import LogicElementModal from "./components/modal/LogicElementModal.js";
import LogicJSONModal from "./components/modal/LogicJSONModal.js";
import LogicAbstractElement from "../../../../logic/abstract/AbstractElement.js";
import "../../../FormRow.js";
import "../../../button/Button.js";
import "../../../../../loader/LogicElementsLoader.js";
import TPL from "./LogicInput.js.html" assert {type: "html"};
import STYLE from "./LogicInput.js.css" assert {type: "css"};
import CONFIG_FIELDS from "./LogicInput.js.json" assert {type: "json"};

// TODO add negate function to contextmenu (add optional negation readonly property to logic elements)

const MUTATION_CONFIG = {
    childList: true,
    subtree: true
};

const mutationObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type == "childList") {
            const target = mutation.target.closest("emc-input-logic");
            if (target != null) {
                target.applyMutationChange();
            }
        }
    }
});

export default class LogicInput extends ContextMenuManagerMixin(AbstractFormElement) {

    static get formConfigurationFields() {
        return immute([...super.formConfigurationFields, ...CONFIG_FIELDS]);
    }

    static get changeDebounceTime() {
        return 0;
    }

    static get AXES() {
        return Direction;
    }

    #logicContainerEl;

    #optimizeButtonEl;

    #jsonButtonEl;

    #placeholderEl;

    #logicElementModal = new LogicElementModal();

    #logicJSONModal = new LogicJSONModal();

    constructor() {
        super();
        TPL.apply(this.shadowRoot);
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#logicElementModal.streched = LogicElementModal.AXES.BOTH;
        this.#logicElementModal.resize = LogicElementModal.AXES.BOTH;
        this.#logicJSONModal.streched = LogicJSONModal.AXES.BOTH;
        this.#logicJSONModal.resize = LogicJSONModal.AXES.BOTH;
        /* --- */
        this.setContextMenu("element", LogicEditorContextMenuElement);
        this.addContextMenuHandler("element", "remove", (event) => {
            const {id} = event.props[0];
            this.#removeElement(id);
        });
        this.addEventListener("menu", (event) => {
            const {id} = event;
            this.showContextMenu("element", event, {id});
            event.stopPropagation();
        });
        /* --- */
        mutationObserver.observe(this, MUTATION_CONFIG);
        this.#logicContainerEl = this.shadowRoot.getElementById("logic-container");
        this.#optimizeButtonEl = this.shadowRoot.getElementById("optimize");
        this.#jsonButtonEl = this.shadowRoot.getElementById("json");
        this.#placeholderEl = this.shadowRoot.getElementById("droptarget");
        this.#placeholderEl.ondragover = (event) => {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };
        this.#placeholderEl.ondrop = (event) => {
            const els = DragDropMemory.get();
            if (els.length) {
                const el = els[0];
                if (el) {
                    const ne = event.target.getRootNode().host.append(el.getElement(event.ctrlKey));
                    if (ne) {
                        ne.removeAttribute("slot");
                    }
                }
            }
            event.preventDefault();
            event.stopPropagation();
            return false;
        };
        this.#placeholderEl.addEventListener("click", (event) => {
            const e = new Event("placeholderclicked");
            this.dispatchEvent(e);
            event.stopPropagation();
        });
        this.#optimizeButtonEl.addEventListener("click", (event) => {
            this.value = reduceLogic(this.value);
            event.stopPropagation();
        });
        this.#jsonButtonEl.addEventListener("click", async (event) => {
            event.stopPropagation();
            const result = await this.#logicJSONModal.show(this.value);
            if (result) {
                this.value =  result;
            }
        });
        this.addEventListener("click", (event) => {
            event.stopImmediatePropagation();
            event.preventDefault();
            const targetEl = event.target;
            setTimeout(() => {
                if (targetEl instanceof LogicAbstractElement) {
                    targetEl.focus();
                } else {
                    const firstEl = this.#getChild() ?? this.#placeholderEl;
                    firstEl.focus();
                }
            }, 0);
        });
        /* --- */
        this.addEventListener("placeholderclicked", async (event) => {
            if (this.#logicElementModal != null) {
                const targetEl = event.target;
                const slotName = event.name;
                if (targetEl) {
                    const resultEl = await this.#logicElementModal.show();
                    if (resultEl) {
                        if (slotName) {
                            resultEl.setAttribute("slot", slotName);
                        }
                        targetEl.append(resultEl);
                        resultEl.focus();
                    }
                }
            }
        });
        this.addEventListener("valuechange", (event) => {
            event.stopPropagation();
            const el = this.#getChild();
            if (el) {
                this.value = el.toJSON();
            } else {
                this.value = null;
            }
            this.dispatchEvent(new Event("input", {
                bubbles: true,
                cancelable: true
            }));
        });
    }

    formDisabledCallback(disabled) {
        super.formDisabledCallback(disabled);
        this.#optimizeButtonEl.disabled = disabled;
        this.#jsonButtonEl.disabled = disabled;
        this.#placeholderEl.disabled = disabled;
        const el = this.#getChild();
        if (el) {
            return el.disabled = disabled;
        }
    }

    focus(options) {
        super.focus(options);
        const el = this.#getChild();
        if (el) {
            el.focus(options);
        } else {
            this.#placeholderEl.focus(options);
        }
    }

    addOperatorGroup(...groupList) {
        this.#logicElementModal?.addOperatorGroup(...groupList);
    }

    removeOperatorGroup(...groupList) {
        this.#logicElementModal?.removeOperatorGroup(...groupList);
    }

    set defaultValue(value) {
        this.setJSONAttribute("value", value);
    }

    get defaultValue() {
        return this.getJSONAttribute("value");
    }

    set value(value) {
        if (value == null || typeof value === "object" && !Array.isArray(value)) {
            super.value = value;
        }
    }

    get value() {
        return super.value;
    }

    set resize(value) {
        this.setEnumAttribute("resize", value, Direction);
    }

    get resize() {
        return this.getEnumAttribute("resize");
    }

    static get observedAttributes() {
        const superObserved = super.observedAttributes ?? [];
        return [
            ...superObserved,
            "name",
            "readonly"
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);
        switch (name) {
            case "name": {
                if (oldValue != newValue) {
                    this.#logicElementModal = LogicElementModal.getModalByName(newValue);
                    this.#logicElementModal.streched = LogicElementModal.AXES.BOTH;
                    this.#logicElementModal.resize = LogicElementModal.AXES.BOTH;
                }
            } break;
            case "readonly": {
                if (oldValue != newValue) {
                    const readonly = this.readOnly;
                    this.#logicJSONModal.readOnly = readonly;
                    const el = this.#getChild();
                    if (el != null) {
                        el.readOnly = readonly;
                    }
                }
            } break;
        }
    }

    append(el) {
        const isActive = (!this.readOnly || this.readOnly === "false") && (!this.disabled || this.disabled === "false");
        if (el instanceof LogicAbstractElement && isActive) {
            return super.append(el);
        }
    }

    checkValid() {
        const el = this.#getChild();
        if (el != null && !el.checkValidity()) {
            return "Not a valid logic";
        }
        return super.checkValid();
    }

    renderValue(value) {
        if (value == null) {
            this.innerHTML = "";
        } else {
            this.#buildLogic(value);
        }
    }

    #getChild() {
        const slottedFormEls = this.#logicContainerEl.assignedElements({flatten: true}).filter((el) => el instanceof LogicAbstractElement);
        return slottedFormEls[0];
    }

    #removeElement(id) {
        const el = this.querySelector(`#${id}`);
        if (el != null && (typeof el.template != "string" || el.template == "false")) {
            const parentEl = el.parentElement;
            parentEl.removeChild(el);
            parentEl.focus();
        }
    }

    #buildLogic(data) {
        const el = this.children[0];
        if (el == null || !isEqual(data, el.toJSON())) {
            this.innerHTML = "";
            if ("type" in data) {
                const logicEl = LogicAbstractElement.buildLogic(data);
                logicEl.readOnly = this.readOnly;
                super.append(logicEl);
            }
        }
    }

    applyMutationChange = debounce(() => {
        const el = this.children[0];
        if (el) {
            this.value = el.toJSON();
        } else {
            this.value = null;
        }
        this.dispatchEvent(new Event("input", {
            bubbles: true,
            cancelable: true
        }));
    });

}

FormElementRegistry.register("LogicInput", LogicInput);
customElements.define("emc-input-logic", LogicInput);
registerFocusable("emc-input-logic");
