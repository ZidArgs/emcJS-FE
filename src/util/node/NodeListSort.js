
import {
    isEqual, numberedStringComparator
} from "emcjs/util/helper/Comparator.js";
import {getInnerText} from "./ExtractText.js";

export function nodeTextComparator(a, b) {
    const textA = a.comparatorText ?? a.label ?? getInnerText(a);
    const textB = b.comparatorText ?? b.label ?? getInnerText(b);
    return numberedStringComparator(textA.toLowerCase(), textB.toLowerCase());
}

export function sortChildren(containerEl, selector) {
    if (!(containerEl instanceof HTMLElement)) {
        throw new TypeError("element needs to be an instance of HTMLElement");
    }
    let nodeList = [...containerEl.children];
    if (selector != null) {
        nodeList = nodeList.filter((el) => el.matches(selector));
    }
    const sortedNodeList = sortNodeList(nodeList);
    if (!isEqual(nodeList, sortedNodeList)) {
        for (const el of sortedNodeList) {
            containerEl.append(el);
        }
    }
    return sortedNodeList;
}

export function sortSlotted(slotEl, selector) {
    if (!(slotEl instanceof HTMLSlotElement)) {
        throw new TypeError("element needs to be an instance of HTMLSlotElement");
    }
    let nodeList = [...slotEl.assignedElements({flatten: true})];
    if (selector != null) {
        nodeList = nodeList.filter((el) => el.matches(selector));
    }
    const sortedNodeList = sortNodeList(nodeList);
    if (!isEqual(nodeList, sortedNodeList)) {
        for (const el of sortedNodeList) {
            (el.parentElement ?? el.getRootNode() ?? document).append(el);
        }
    }
    return sortedNodeList;
}

export function sortNodeList(nodeList) {
    if (!(nodeList instanceof NodeList || nodeList instanceof HTMLCollection || Array.isArray(nodeList))) {
        throw new TypeError("nodeList needs to be an Array");
    }
    return [...nodeList].sort(nodeTextComparator);
}

export function nodeOccurenceComparator(a, b) {
    const comparedPosition = a.compareDocumentPosition(b);
    if (comparedPosition & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
    } else {
        return 1;
    }
}
