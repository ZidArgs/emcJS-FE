import Enum from "@emcjs/core/enum/Enum.js";

export default class Direction extends Enum {

    static NONE = new this("none");

    static VERTICAL = new this("vertical");

    static HORIZONTAL = new this("horizontal");

    static BOTH = new this("both");

}
