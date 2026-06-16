import ArraySet from "@emcjs/core/data/collection/ArraySet.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";

const attentionSeekers = new ArraySet();

const focusEventManager = new EventTargetManager(window, false);
focusEventManager.set("focus", (event) => {
    const activeElement = attentionSeekers.at(-1);
    if (activeElement != null) {
        const target = event.target;
        if (target instanceof Node && !activeElement.contains(target)) {
            activeElement.initialFocus();
        }
    }
}, {capture: true});

class WindowFocusHandler {

    add(element) {
        if (!(element instanceof HTMLElement)) {
            throw new TypeError("element has to be an instance of HTMLElement");
        }
        attentionSeekers.add(element);
        focusEventManager.active = true;
    }

    delete(element) {
        attentionSeekers.delete(element);
        if (!attentionSeekers.size) {
            focusEventManager.active = false;
        }
    }

    isActive() {
        return focusEventManager.active;
    }

}

export default new WindowFocusHandler();
