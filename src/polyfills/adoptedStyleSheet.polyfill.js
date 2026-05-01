/**
 * Polyfill for adoptedStyleSheet on WebKit
 * ---------------------------------------------------------
 * Apple sure not liking adoptedStyleSheets, but we do
 *
 * @author ZidArgs
 */

/* eslint-disable no-prototype-builtins */

function cloneCSSStyleSheet(styleSheet) {
    const res = document.createElement("style");
    for (const rule of styleSheet.cssRules) {
        res.innerHTML += rule.cssText;
    }
    return res;
}

function cloneStyleElement(element) {
    const res = document.createElement("style");
    res.innerHTML = element.innerHTML;
    return res;
}

if (!Document.prototype.hasOwnProperty("adoptedStyleSheets")) {
    const VALUE = new WeakMap();

    Object.defineProperty(Document.prototype, "adoptedStyleSheets", {
        get: function() {
            return VALUE.get(this) || [];
        },
        set: function(newValue) {
            const oldValue = VALUE.get(this) || [];
            newValue = newValue.map((value) => {
                if (value instanceof CSSStyleSheet) {
                    return cloneCSSStyleSheet(value);
                }
                if (value instanceof HTMLStyleElement) {
                    if (oldValue.indexOf(value) < 0) {
                        return cloneStyleElement(value);
                    } else {
                        return value;
                    }
                }
                try {
                    const res = document.createElement("style");
                    res.innerHTML = value;
                    return res;
                } catch (err) {
                    throw new TypeError("Failed to set the 'adoptedStyleSheets' property on 'Document': Failed to convert value to 'CSSStyleSheet'.", err);
                }
            });
            VALUE.set(this, Object.freeze(newValue));
            for (const node of oldValue) {
                if (node != null && newValue.indexOf(node) < 0) {
                    node.remove();
                }
            }
            for (const node of newValue) {
                if (node != null && node.parentElement == null) {
                    this.append(node);
                }
            }
        }
    });
}

if (!ShadowRoot.prototype.hasOwnProperty("adoptedStyleSheets")) {
    const VALUE = new WeakMap();

    Object.defineProperty(ShadowRoot.prototype, "adoptedStyleSheets", {
        get: function() {
            return VALUE.get(this) || [];
        },
        set: function(newValue) {
            const oldValue = VALUE.get(this) || [];
            newValue = newValue.map((value) => {
                if (value instanceof CSSStyleSheet) {
                    return cloneCSSStyleSheet(value);
                }
                if (value instanceof HTMLStyleElement) {
                    if (oldValue.indexOf(value) < 0) {
                        return cloneStyleElement(value);
                    } else {
                        return value;
                    }
                }
                try {
                    const res = document.createElement("style");
                    res.innerHTML = value;
                    return res.sheet;
                } catch (err) {
                    throw new TypeError("Failed to set the 'adoptedStyleSheets' property on 'ShadowRoot': Failed to convert value to 'CSSStyleSheet'.", err);
                }
            });
            VALUE.set(this, Object.freeze(newValue));
            for (const node of oldValue) {
                if (node != null && newValue.indexOf(node) < 0) {
                    node.remove();
                }
            }
            for (const node of newValue) {
                if (node != null && node.parentElement == null) {
                    this.append(node);
                }
            }
        }
    });
}
