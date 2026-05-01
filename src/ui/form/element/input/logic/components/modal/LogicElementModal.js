import LogicOperatorRegistry from "emcjs/data/registry/LogicOperatorRegistry.js";
import {debounce} from "emcjs/util/Debouncer.js";
import ModalDialog from "../../../../../../modal/ModalDialog.js";
import AbstractElement from "../../../../../../logic/abstract/AbstractElement.js";
import BusyIndicatorManager from "../../../../../../../util/busy/BusyIndicatorManager.js";
import {DEFAULT_LOGIC_OPERATORS} from "../../../../../../../loader/LogicElementsLoader.js";
import "../../../../../../FilteredList.js";
import "../../../../../../container/CollapsePanel.js";
import "../../../../../button/Button.js";
import TPL from "./LogicElementModal.js.html" assert {type: "html"};
import STYLE from "./LogicElementModal.js.css" assert {type: "css"};

// TODO rework this, it looks crap
export default class LogicElementModal extends ModalDialog {

    #contentEl;

    #containerEl;

    #operatorGroups = new Set();

    #selectedLogicEl;

    constructor(caption = "Choose Logic Element...", options = {}) {
        super(caption, {
            cancel: true,
            ...options
        });
        const els = TPL.generate();
        STYLE.apply(this.shadowRoot);
        /* --- */
        this.#contentEl = this.shadowRoot.getElementById("content");
        this.#contentEl.innerHTML = "";
        this.#containerEl = els.getElementById("elements");
        this.#contentEl.append(this.#containerEl);
        /* --- */
        this.#containerEl.addEventListener("click", (event) => {
            const targetEl = event.target;
            if (targetEl instanceof AbstractElement) {
                this.#selectedLogicEl = targetEl.getElement(true);
                this.submit();
                event.preventDefault();
                return false;
            }
        });
        /* --- */
        LogicOperatorRegistry.addEventListener("change", (event) => {
            const {group} = event;
            if (this.#operatorGroups.has(group)) {
                this.#refreshOperatorGroup(group);
            }
        });
        LogicOperatorRegistry.addEventListener("caption", (event) => {
            const {
                group, caption
            } = event;
            if (this.#operatorGroups.has(group)) {
                const groupEl = this.#containerEl.querySelector(`emc-collapsepanel[data-group="${group}"]`);
                if (groupEl != null) {
                    groupEl.caption = caption;
                }
            }
        });
        /* --- */
        this.#refreshOperators();
    }

    get logicElement() {
        return this.#selectedLogicEl;
    }

    async show() {
        this.#selectedLogicEl = null;
        return await super.show();
    }

    getSubmitValue() {
        return this.#selectedLogicEl;
    }

    addOperatorGroup(...groupList) {
        let changes = false;
        for (const group of groupList) {
            if (!(typeof group === "string") || group === "") {
                continue;
            }
            if (!this.#operatorGroups.has(group)) {
                this.#operatorGroups.add(group);
                changes = true;
            }
        }
        /* --- */
        if (changes) {
            this.#refreshOperators();
        }
    }

    removeOperatorGroup(...groupList) {
        let changes = false;
        for (const group of groupList) {
            if (!(typeof group === "string") || group === "") {
                continue;
            }
            if (this.#operatorGroups.has(group)) {
                this.#operatorGroups.delete(group);
                changes = true;
            }
        }
        /* --- */
        if (changes) {
            this.#refreshOperators();
        }
    }

    #refreshOperators = debounce(async () => {
        await BusyIndicatorManager.busy();
        this.#containerEl.innerHTML = "";
        // load default operators
        const operators = DEFAULT_LOGIC_OPERATORS.map((type) => {
            return {type};
        });
        this.#loadOperatorGroup("", "default", operators, true);
        // load custom operators
        for (const group of this.#operatorGroups) {
            const caption = LogicOperatorRegistry.getGroupCaption(group);
            const operators = LogicOperatorRegistry.getGroup(group);
            this.#loadOperatorGroup(group, caption, operators);
        }
        await BusyIndicatorManager.unbusy();
    });

    #loadOperatorGroup(group, caption = group, operators = [], compact = false) {
        const groupEl = document.createElement("emc-collapsepanel");
        groupEl.dataset.group = group;
        groupEl.caption = caption;
        groupEl.compact = !!compact;
        this.#loadOperators(operators, groupEl);
        this.#containerEl.append(groupEl);
    }

    #refreshOperatorGroup(group) {
        const groupEl = this.#containerEl.querySelector(`emc-collapsepanel[data-group="${group}"]`);
        if (groupEl != null) {
            groupEl.innerHTML = "";
            const operators = LogicOperatorRegistry.getGroup(group);
            this.#loadOperators(operators, groupEl);
        }
    }

    #loadOperators(config, containerEl) {
        if (config == null) {
            return;
        }
        if (Array.isArray(config)) {
            for (const item of config) {
                this.#loadOperators(item, containerEl);
            }
        } else if (config.type === "group") {
            const newConteinerEl = document.createElement("emc-collapsepanel");
            newConteinerEl.caption = config.caption;
            this.#loadOperators(config.children, newConteinerEl);
            containerEl.append(newConteinerEl);
        } else {
            const typeClass = AbstractElement.getReference(config.type);
            const logicEl = new typeClass();
            if (config.ref != null) {
                logicEl.ref = config.ref;
            }
            if (config.options != null && "setOptions" in logicEl) {
                logicEl.setOptions(config.options);
            }
            if (config.value != null) {
                logicEl.value = config.value;
            }
            logicEl.category = config.category;
            logicEl.template = "clicked";
            logicEl.dataset.filtervalue = config.ref ?? logicEl.getHeader() ?? config.type;
            containerEl.append(logicEl);
        }
    }

}

customElements.define("emc-edit-logic-modal-element", LogicElementModal);
