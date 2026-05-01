import {isStringNotEmpty} from "emcjs/util/helper/CheckType.js";

export function findParentBySelector(source, selectors) {
    if (!(source instanceof Node)) {
        throw new Error("can only traverse instances of Node");
    }
    if (!isStringNotEmpty(selectors)) {
        throw new Error("selector needs to be a non empty string");
    }
    // can not get parent of document body
    if (source === document.body) {
        return null;
    }
    // check parent element
    if (source.parentElement != null) {
        const potentialParent = source.parentElement;
        if (potentialParent.matches(selectors)) {
            return potentialParent;
        }
        return findParentBySelector(potentialParent, selectors);
    }
    // check assigned slot
    if (source.assignedSlot != null) {
        const potentialParent = source.assignedSlot;
        if (potentialParent.matches(selectors)) {
            return potentialParent;
        }
        return findParentBySelector(potentialParent, selectors);
    }
    // check rootnode host (shadow dom container)
    if (source.getRootNode()?.host != null) {
        const potentialParent = source.getRootNode().host;
        if (potentialParent.matches(selectors)) {
            return potentialParent;
        }
        return findParentBySelector(potentialParent, selectors);
    }
    // nothing found
    return null;
}

export function findAllParentsBySelector(source, selectors) {
    const parent = findParentBySelector(source, selectors);
    if (parent != null) {
        const parents = findAllParentsBySelector(parent, selectors);
        parents.unshift(parent);
        return parents;
    }
    return [];
}
