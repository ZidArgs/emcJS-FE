const CANVAS = document.createElement("canvas");
const SERIALIZER = new XMLSerializer();

export function convertSVGtoPNG(svg) {
    return new Promise(function(resolve, reject) {
        if (!(svg instanceof SVGElement)) {
            reject(new TypeError("only svg elements can be converted to png"));
        }
        CANVAS.setAttribute("width", svg.getAttribute("width"));
        CANVAS.setAttribute("height", svg.getAttribute("height"));
        const url = `data:image/svg+xml;base64,${btoa(SERIALIZER.serializeToString(svg))}`;
        const ctx = CANVAS.getContext("2d");
        const img = new Image();

        const handler  = () => {
            img.removeEventListener("load", handler);
            ctx.drawImage(img, 0, 0);
            resolve(CANVAS.toDataURL("image/png"));
        };

        img.addEventListener("load", handler);
        img.src = url;
    });
}
