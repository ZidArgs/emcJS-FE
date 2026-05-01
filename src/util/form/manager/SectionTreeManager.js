import {deepClone} from "emcjs/util/helper/DeepClone.js";
import EventTargetManager from "emcjs/util/event/EventTargetManager.js";
import {debounce} from "emcjs/util/Debouncer.js";
import FormContainer from "../../../ui/form/FormContainer.js";
import Tree from "../../../ui/tree/Tree.js";
import {nodeOccurenceComparator} from "../../node/NodeListSort.js";

function deepCloneTreeConfig(value) {
    const result = {};
    for (const key in value) {
        const entry = value[key];
        const {
            connectedNode, children, ...rest
        } = entry;
        result[key] = {
            connectedNode,
            ...deepClone(rest)
        };
        if (children) {
            result[key].children = deepCloneTreeConfig(children);
        }
    }
    return result;
}

function escapeSectionId(label) {
    return label.toLowerCase().replace(/\s/g, "_");
}

export default class SectionTreeManager {

    #managedSectionEls = new Map();

    #formSectionNavigationEl;

    #formContainerEl;

    #treeConfig = {};

    #formContainerEventObserver = new EventTargetManager();

    constructor() {
        this.#formContainerEventObserver.set("section_change", (event) => {
            const {section} = event;
            this.#markSectionInTree(section);
        });
        this.#formContainerEventObserver.set("sectionlist_change", (event) => {
            const {sectionList = []} = event;
            this.#managedSectionEls.clear();
            this.#treeConfig = {};
            for (const section of sectionList) {
                this.#addSection(section);
            }
            this.#updateSectionTree();
        });
    }

    observe(formContainer) {
        if (!(formContainer instanceof FormContainer)) {
            throw new TypeError("formContainer must be a FormContainer");
        }
        if (this.#formContainerEl != formContainer) {
            this.#formContainerEl = formContainer;
            this.#formContainerEventObserver.switchTarget(formContainer);
            this.#managedSectionEls.clear();
            this.#treeConfig = {};
            for (const section of formContainer.sectionNodeList) {
                this.#addSection(section);
            }
            this.#updateSectionTree();
        }
    }

    unobserve() {
        this.#formContainerEventObserver.switchTarget();
        this.#managedSectionEls.clear();
        this.#treeConfig = {};
        this.#updateSectionTree();
    }

    #addSection(section) {
        const id = escapeSectionId(section.label);
        const config = {
            label: section.label,
            sorted: false,
            selectOnClick: false,
            sortFunction: SectionTreeManager.#sortByOccurence,
            startCollapsed: true,
            connectedNode: section,
            onClick: SectionTreeManager.#onTreeNodeClick
        };
        this.#managedSectionEls.set(section, config);
        const parents = section.parentSectionElementList;
        if (parents.length > 0) {
            if (!this.#managedSectionEls.has(parents[0])) {
                this.#addSection(parents[0]);
            }
            const parentConfig = this.#managedSectionEls.get(parents[0]);
            parentConfig.children = parentConfig.children ?? {};
            config.path = [...parentConfig.path, id];
            parentConfig.children[id] = config;
        } else {
            this.#treeConfig[id] = config;
            config.path = [id];
        }
    }

    get treeConfig() {
        return deepCloneTreeConfig(this.#treeConfig);
    }

    getPath(section) {
        if (this.#managedSectionEls.has(section)) {
            const config = this.#managedSectionEls.get(section);
            return [...config.path];
        }
    }

    static #sortByOccurence(entry0, entry1) {
        const {connectedNode: el0} = entry0;
        const {connectedNode: el1} = entry1;

        if (el0.parentElement !== el1.parentElement) {
            return nodeOccurenceComparator(el0, el1);
        }
    }

    static #onTreeNodeClick(event) {
        const targetNode = event.target;
        const connectedNode = targetNode.connectedNode;
        connectedNode.scrollIntoView();
        if (!targetNode.collapsed) {
            event.preventDefault();
        }
    }

    setFormSectionNavigationElement(treeNavigation) {
        if (treeNavigation != null && !(treeNavigation instanceof Tree)) {
            throw new Error("form section navigation element must be an instance of Tree or null");
        }
        if (this.#formSectionNavigationEl != treeNavigation) {
            this.#formSectionNavigationEl = treeNavigation;
            this.#updateSectionTree();
        }
    }

    #updateSectionTree = debounce(() => {
        if (this.#formSectionNavigationEl != null) {
            this.#formSectionNavigationEl.loadConfig(this.treeConfig);
            if (this.#formContainerEl != null) {
                this.refreshActiveSection();
            }
        }
    });

    refreshActiveSection = debounce(() => {
        this.#markSectionInTree(this.#formContainerEl.activeSection);
    });

    #markSectionInTree(sectionEl) {
        if (this.#formSectionNavigationEl != null) {
            if (sectionEl != null) {
                const sectionPath = this.getPath(sectionEl);
                this.#formSectionNavigationEl.selectItemByRefPath(sectionPath, true);
            } else {
                this.#formSectionNavigationEl.selectItemByPath(0, true);
            }
        }
    }

}
