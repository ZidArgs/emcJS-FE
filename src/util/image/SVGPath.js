import {isStringNotEmpty} from "@emcjs/core/util/helper/CheckType.js";

const PATH_COMMA_REGEXP = /,/ig;
const PATH_DOUBLE_SPACE_REGEXP = /\s\s/ig;
const PATH_REDUCE_REGEXP = /(?:\s[a-z]\s|[a-z]\s|\s[a-z])/ig;

const R_NUMBER = "-?\\d+(?:\\.\\d+)?(?:\\e-?\\d+(?:\\.\\d+)?)?";

function rNum(amount) {
    if (amount > 2) {
        return `${R_NUMBER}(?: ${R_NUMBER}){${amount - 1}}`;
    } else if (amount == 2) {
        return `${R_NUMBER} ${R_NUMBER}`;
    } else if (amount == 1) {
        return `${R_NUMBER}`;
    } else {
        return "";
    }
}

const R_COMMANDS = [
    `m${rNum(2)}(?: ${rNum(2)})*`,
    `l${rNum(2)}(?: ${rNum(2)})*`,
    `h${rNum(1)}(?: ${rNum(1)})*`,
    `v${rNum(1)}(?: ${rNum(1)})*`,
    `c${rNum(6)}(?: ${rNum(6)})*`,
    `s${rNum(4)}(?: ${rNum(4)})*`,
    `q${rNum(4)}(?: ${rNum(4)})*`,
    `t${rNum(2)}(?: ${rNum(2)})*`,
    `a${rNum(7)}(?: ${rNum(7)})*`,
    `z`
];
const R_PATH = `^(?:${R_COMMANDS.join("|")})+$`;
const PATH_REGEXP = new RegExp(R_PATH, "i");

function reduceReplacer(match) {
    return match.trim();
}

export function reduceSVGPath(value) {
    if (isStringNotEmpty(value)) {
        return value.replace(PATH_COMMA_REGEXP, " ").replace(PATH_DOUBLE_SPACE_REGEXP, " ").replace(PATH_REDUCE_REGEXP, reduceReplacer);
    }
}

export function isSVGPath(value) {
    if (isStringNotEmpty(value)) {
        return PATH_REGEXP.test(reduceSVGPath(value));
    }
    return false;
}

export function createSVGfromPath(value, opts = {}) {
    const width = parseInt(opts?.width) || 100;
    const height = parseInt(opts?.height) || 100;
    const viewBox = `0 0 ${width} ${height}`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", viewBox);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "#000000");
    path.setAttribute("d", value);
    svg.appendChild(path);
    return svg;
}
