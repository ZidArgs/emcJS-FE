import {debounce} from "@emcjs/core/util/Debouncer.js";

const DEFAULT_SELECTORS = [
    "button",
    "[href]",
    "input:not([type=\"hidden\"])",
    "select",
    "textarea",
    "[tabindex]"
];

const SELECTORS = new Set(DEFAULT_SELECTORS);

const EXCLUSION_RULE = ":not([tabindex=\"-1\"])";

let currentSelector = "";

const buildSelector = debounce(() => {
    currentSelector = [...SELECTORS].map((rule) => `${rule}${EXCLUSION_RULE}`).join(",");
});
buildSelector();

export function getFocusableElements(parent) {
    return Array.from(parent.querySelectorAll(currentSelector));
}

export function registerFocusable(selector) {
    if (!SELECTORS.has(selector)) {
        SELECTORS.add(selector);
        buildSelector();
    }
}
