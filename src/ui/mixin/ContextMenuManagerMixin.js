import {createMixin} from "@emcjs/core/mixin/Mixin.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import ActiveCounter from "@emcjs/core/util/counter/ActiveCounter.js";
import ContextMenuLayer from "../overlay/ctxmenu/ContextMenuLayer.js";

const DEFAULT_MENU_ID = "main";

export default createMixin((superclass) => class ContextMenuManagerMixin extends superclass {

    #counter = new ActiveCounter();

    #internalEventManagers = new Map();

    #eventManagers = new Map();

    #menuClasses = new Map();

    #menus = new Map();

    #additionalItems = new Map();

    #inactiveGroups = new Map();

    #showCtxMenu() {
        if (this.#counter.add()) {
            this.classList.add("ctx-marked");
        }
    }

    #closeCtxMenu() {
        if (this.#counter.remove()) {
            this.classList.remove("ctx-marked");
            this.dispatchEvent(new Event("contextmenusclosed", {
                bubbles: true,
                cancelable: true
            }));
        }
    }

    #createInternalEventManager(name) {
        const manager = new EventTargetManager();
        manager.set("show", () => {
            this.#showCtxMenu();
        });
        manager.set("close", () => {
            this.#closeCtxMenu();
        });
        this.#internalEventManagers.set(name, manager);
        return manager;
    }

    #getInternalEventManager(name) {
        return this.#internalEventManagers.get(name) ?? this.#createInternalEventManager(name);
    }

    #createEventManager(name) {
        const manager = new EventTargetManager();
        this.#eventManagers.set(name, manager);
        return manager;
    }

    #getEventManager(name) {
        return this.#eventManagers.get(name) ?? this.#createEventManager(name);
    }

    #createMenu(name) {
        const MenuClass = this.#menuClasses.get(name);
        if (MenuClass == null) {
            return;
        }
        const ctxMnu = new MenuClass();
        this.#menus.set(name, ctxMnu);
        /* --- */
        const addedItems = this.#additionalItems.get(name);
        ctxMnu.setAddedItems(addedItems);
        /* --- */
        if (this.#inactiveGroups.has(name)) {
            const inactiveGroups = this.#inactiveGroups.get(name);
            for (const group of inactiveGroups) {
                ctxMnu.toggleGroupActive(group, false);
            }
        }
        /* --- */
        const internalManager = this.#getInternalEventManager(name);
        const manager = this.#getEventManager(name);
        internalManager.switchTarget(ctxMnu);
        manager.switchTarget(ctxMnu);
        /* --- */
        if (this.isConnected) {
            const catcherEl = ContextMenuLayer.findNextLayer(this);
            catcherEl.append(ctxMnu);
        }
        /* --- */
        return ctxMnu;
    }

    get defaultContextMenuId() {
        return DEFAULT_MENU_ID;
    }

    setDefaultContextMenu(MenuClass) {
        this.setContextMenu(DEFAULT_MENU_ID, MenuClass);
    }

    getDefaultContextMenu() {
        return this.getContextMenu(DEFAULT_MENU_ID);
    }

    showDefaultContextMenu(event, ...props) {
        this.showContextMenu(DEFAULT_MENU_ID, event, ...props);
    }

    addDefaultContextMenuHandler(event, handler) {
        this.addContextMenuHandler(DEFAULT_MENU_ID, event, handler);
    }

    setAddedDefaultContextMenuItems(items) {
        this.setAddedContextMenuItems(DEFAULT_MENU_ID, items);
    }

    toggleDefaultContextMenuGroupActive(group, value) {
        this.toggleContextMenuGroupActive(DEFAULT_MENU_ID, group, value);
    }

    setContextMenu(name, MenuClass) {
        this.#menuClasses.set(name, MenuClass);
        const oldMenu = this.#menus.get(name);
        if (oldMenu != null && !(oldMenu instanceof MenuClass)) {
            const internalManager = this.#getInternalEventManager(name);
            const manager = this.#getEventManager(name);
            internalManager.disconnect();
            manager.disconnect();
            this.#menus.delete(name);
            oldMenu.remove();
        }
    }

    getContextMenu(name) {
        return this.#menus.get(name) ?? this.#createMenu(name);
    }

    showContextMenu(name, event, ...props) {
        const mnu_ctx = this.getContextMenu(name);
        if (mnu_ctx != null) {
            if (event instanceof MouseEvent) {
                mnu_ctx.show(event.clientX, event.clientY, ...props);
            } else {
                mnu_ctx.show(event?.left ?? event?.data?.left ?? 0, event?.top ?? event?.data?.top ?? 0, ...props);
            }
        }
    }

    addContextMenuHandler(name, event, handler) {
        const manager = this.#getEventManager(name);
        manager.set(event, handler);
    }

    setAddedContextMenuItems(name, items) {
        this.#additionalItems.set(name, items);
        const ctxMnu = this.#menus.get(name);
        if (ctxMnu != null) {
            ctxMnu.setAddedItems(items);
        }
    }

    toggleContextMenuGroupActive(name, group, value) {
        if (this.#inactiveGroups.has(name)) {
            const inactiveGroups = this.#inactiveGroups.get(name);
            if (value) {
                inactiveGroups.delete(group);
                if (!inactiveGroups.size) {
                    this.#inactiveGroups.delete(name);
                }
            } else {
                inactiveGroups.add(group);
            }
        } else if (!value) {
            const inactiveGroups = new Set();
            inactiveGroups.add(group);
            this.#inactiveGroups.set(name, inactiveGroups);
        }
        const ctxMnu = this.#menus.get(name);
        if (ctxMnu != null) {
            ctxMnu.toggleGroupActive(group, value);
        }
    }

    connectedCallback() {
        if (super.connectedCallback) {
            super.connectedCallback?.();
        }
        const catcherEl = ContextMenuLayer.findNextLayer(this);
        for (const [, menu] of this.#menus) {
            catcherEl.append(menu);
        }
    }

    disconnectedCallback() {
        if (super.disconnectedCallback) {
            super.disconnectedCallback?.();
        }
        for (const [, menu] of this.#menus) {
            menu.remove();
        }
        this.#menus.clear();
    }

});
