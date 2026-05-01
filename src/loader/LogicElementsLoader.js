import "../ui/logic/elements/ComparatorEqual.js";
import "../ui/logic/elements/ComparatorGreaterThan.js";
import "../ui/logic/elements/ComparatorGreaterThanEqual.js";
import "../ui/logic/elements/ComparatorLessThan.js";
import "../ui/logic/elements/ComparatorLessThanEqual.js";
import "../ui/logic/elements/ComparatorNotEqual.js";
import "../ui/logic/elements/LiteralFalse.js";
// import "./elements/LiteralNumber.js";
import "../ui/logic/elements/LiteralState.js";
// import "./elements/LiteralString.js";
import "../ui/logic/elements/LiteralTrue.js";
import "../ui/logic/elements/LiteralValue.js";
import "../ui/logic/elements/MathAdd.js";
import "../ui/logic/elements/MathDiv.js";
import "../ui/logic/elements/MathMod.js";
import "../ui/logic/elements/MathMul.js";
import "../ui/logic/elements/MathPow.js";
import "../ui/logic/elements/MathSub.js";
import "../ui/logic/elements/OperatorAnd.js";
import "../ui/logic/elements/OperatorNand.js";
import "../ui/logic/elements/OperatorNor.js";
import "../ui/logic/elements/OperatorNot.js";
import "../ui/logic/elements/OperatorOr.js";
import "../ui/logic/elements/OperatorXnor.js";
import "../ui/logic/elements/OperatorXor.js";
import "../ui/logic/elements/RestrictorMax.js";
import "../ui/logic/elements/RestrictorMin.js";

// TODO add string input logic element
// TODO add number input logic element

export const DEFAULT_LOGIC_OPERATORS = [
    /* literals */
    "false",
    "true",
    /* operators */
    "not",
    "and",
    "nand",
    "or",
    "nor",
    "xor",
    "xnor",
    /* restrictors */
    "min",
    "max",
    /* comparators */
    "eq",
    "gt",
    "gte",
    "lt",
    "lte",
    "neq",
    /* math */
    "add",
    "sub",
    "mul",
    "div",
    "mod",
    "pow"
];
