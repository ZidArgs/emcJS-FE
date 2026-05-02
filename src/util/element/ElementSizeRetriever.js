export function getBoundingContentRect(element) {
    const elementRect = element.getBoundingClientRect();
    const elementStyle = getComputedStyle(element);
    const topBorder = parseFloat(elementStyle.getPropertyValue("border-top-width")) || 0;
    const bottomBorder = parseFloat(elementStyle.getPropertyValue("border-bottom-width")) || 0;
    const leftBorder = parseFloat(elementStyle.getPropertyValue("border-left-width")) || 0;
    const rightBorder = parseFloat(elementStyle.getPropertyValue("border-right-width")) || 0;
    const scrollBarHeight = Math.max(0, elementRect.height - element.clientHeight - topBorder - bottomBorder);
    const scrollBarWidth = Math.max(0, elementRect.width - element.clientWidth - leftBorder - rightBorder);

    const contentRect = {};
    contentRect.top = elementRect.top + topBorder;
    contentRect.bottom = elementRect.bottom - bottomBorder - scrollBarHeight;
    contentRect.left = elementRect.left + leftBorder;
    contentRect.right = elementRect.right - rightBorder - scrollBarWidth;
    contentRect.x = contentRect.left;
    contentRect.y = contentRect.top;
    contentRect.width = contentRect.right - contentRect.left;
    contentRect.height = contentRect.bottom - contentRect.top;

    return contentRect;
}
