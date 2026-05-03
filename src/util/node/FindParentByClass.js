import {isClass} from "@emcjs/core/util/helper/Class.js";

export function findParentByClass(source, clazz) {
    if (!(source instanceof Node)) {
        throw new Error("can only traverse instances of Node");
    }
    if (isClass(clazz)) {
        throw new Error("clazz needs to be a Class");
    }
    // can not get parent of document body
    if (source === document.body) {
        return null;
    }
    // check parent element
    if (source.parentElement != null) {
        const potentialParent = source.parentElement;
        if (potentialParent instanceof clazz) {
            return potentialParent;
        }
        return findParentByClass(potentialParent, clazz);
    }
    // check assigned slot
    if (source.assignedSlot != null) {
        const potentialParent = source.assignedSlot;
        if (potentialParent instanceof clazz) {
            return potentialParent;
        }
        return findParentByClass(potentialParent, clazz);
    }
    // check rootnode host (shadow dom container)
    if (source.getRootNode()?.host != null) {
        const potentialParent = source.getRootNode().host;
        if (potentialParent instanceof clazz) {
            return potentialParent;
        }
        return findParentByClass(potentialParent, clazz);
    }
    // nothing found
    return null;
}

export function findAllParentsByClass(source, selectors) {
    const parent = findParentByClass(source, selectors);
    if (parent != null) {
        const parents = findAllParentsByClass(parent, selectors);
        parents.unshift(parent);
        return parents;
    }
    return [];
}
