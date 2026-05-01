export function getScrollParent(node) {
    const isElement = node instanceof HTMLElement;
    const elementStyle = isElement && window.getComputedStyle(node);
    const overflowX = isElement && elementStyle.overflowX;
    const overflowY = isElement && elementStyle.overflowY;
    const isScrollableX = overflowX && !(overflowX.includes("hidden") || overflowX.includes("visible"));
    const isScrollableY = overflowY && !(overflowY.includes("hidden") || overflowY.includes("visible"));

    if (!node) {
        return document.scrollingElement ?? document.body;
    } else if (isScrollableX && node.scrollWidth >= node.clientWidth) {
        return node;
    } else if (isScrollableY && node.scrollHeight >= node.clientHeight) {
        return node;
    }

    return getScrollParent(node.assignedSlot ?? node.parentNode ?? node.getRootNode()?.host);
}

export function scrollIntoViewIfNeeded(node, options = {}) {
    const {
        partialY = false,
        partialX = false,
        behavior = "auto",
        block = "start",
        inline = "start",
        offsetTop = 0,
        offsetBottom = 0,
        offsetLeft = 0,
        offsetRight = 0
    } = options;

    const scrollEl = getScrollParent(node);
    const scrollRect = scrollEl.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const elTop = nodeRect.top - scrollRect.top;
    const elBottom = nodeRect.bottom - scrollRect.top;
    const elLeft = nodeRect.left - scrollRect.left;
    const elRight = nodeRect.right - scrollRect.left;

    const outOfBoundsY = block != null && (partialY ?
        elBottom < offsetTop || elTop > scrollEl.clientHeight - offsetBottom :
        elTop < offsetTop || elBottom > scrollEl.clientHeight - offsetBottom);
    const outOfBoundsX = inline != null && (partialX ?
        elRight < offsetLeft || elLeft > scrollEl.clientWidth - offsetRight :
        elLeft < offsetLeft || elRight > scrollEl.clientWidth - offsetRight);

    if (outOfBoundsY) {
        if (outOfBoundsX) {
            scrollIntoView(node, {
                behavior,
                block,
                inline,
                offsetTop,
                offsetBottom,
                offsetLeft,
                offsetRight
            });
        } else {
            scrollIntoView(node, {
                behavior,
                block,
                offsetTop,
                offsetBottom,
                offsetLeft,
                offsetRight
            });
        }
    } else if (outOfBoundsX) {
        scrollIntoView(node, {
            behavior,
            inline,
            offsetTop,
            offsetBottom,
            offsetLeft,
            offsetRight
        });
    }
}

export function scrollIntoView(node, options = {}) {
    const {
        behavior = "auto",
        block = "start",
        inline = "start",
        offsetTop = 0,
        offsetBottom = 0,
        offsetLeft = 0,
        offsetRight = 0
    } = options;

    const scrollEl = getScrollParent(node);
    const scrollRect = scrollEl.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const top = translateScrollBlockOption(block, nodeRect, scrollRect, scrollEl, offsetTop, offsetBottom);
    const left = translateScrollInlineOption(inline, nodeRect, scrollRect, scrollEl, offsetLeft, offsetRight);

    scrollEl.scroll({
        top,
        left,
        behavior
    });
}

function translateScrollBlockOption(value, nodeRect, scrollRect, scrollEl, offsetTop = 0, offsetBottom = 0) {
    const elTop = nodeRect.top - scrollRect.top + scrollEl.scrollTop;
    const elBottom = nodeRect.bottom - scrollRect.top + scrollEl.scrollTop;
    if (value === "start") {
        return elTop - offsetTop;
    }
    if (value === "end") {
        return elBottom - scrollEl.clientHeight + offsetBottom;
    }
    if (value === "center") {
        const containerCenter = (scrollEl.clientHeight - (offsetTop + offsetBottom)) / 2 + offsetTop;
        const elementCenter = nodeRect.height / 2 + elTop;
        return elementCenter - containerCenter;
    }
    if (value === "top") {
        return 0;
    }
    if (value === "bottom") {
        return scrollEl.scrollHeight;
    }
    if (value === "nearest") {
        const topRes = elTop - offsetTop;
        const bottomRes = elBottom - scrollEl.clientHeight + offsetBottom;
        if (topRes < scrollEl.scrollTop) {
            return topRes;
        } else {
            return bottomRes;
        }
    }
    return scrollEl.scrollTop;
}

function translateScrollInlineOption(value, nodeRect, scrollRect, scrollEl, offsetLeft = 0, offsetRight = 0) {
    const elLeft = nodeRect.left - scrollRect.left + scrollEl.scrollLeft;
    const elRight = nodeRect.right - scrollRect.left + scrollEl.scrollLeft;
    if (value === "start") {
        return elLeft - offsetLeft;
    }
    if (value === "end") {
        return elRight - scrollEl.clientWidth + offsetRight;
    }
    if (value === "center") {
        const containerCenter = (scrollEl.clientWidth - (offsetLeft + offsetRight)) / 2 + offsetLeft;
        const elementCenter = nodeRect.width / 2 + elLeft;
        return elementCenter - containerCenter;
    }
    if (value === "left") {
        return 0;
    }
    if (value === "right") {
        return scrollEl.scrollWidth;
    }
    if (value === "nearest") {
        const leftRes = elLeft - offsetLeft;
        const rightRes = elRight - scrollEl.clientWidth + offsetRight;
        if (leftRes < scrollEl.scrollLeft) {
            return leftRes;
        } else {
            return rightRes;
        }
    }
    return scrollEl.scrollLeft;
}
