export function zoomAtAnchor(oldZoom = 1, newZoom = 1, args = {}) {
    const {
        offset: [offsetX = 0, offsetY = 0] = [],
        anchor: [anchorX = 0, anchorY = 0] = []
    } = args;

    const newScale = 100 / newZoom;
    const oldScale = 100 / oldZoom;
    const newX = (offsetX - anchorX) * oldScale / newScale + anchorX;
    const newY = (offsetY - anchorY) * oldScale / newScale + anchorY;
    return [newX, newY];
}
