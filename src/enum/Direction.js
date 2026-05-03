import Enum from "@emcjs/core/data/Enum.js";

export default class Direction extends Enum {

    static NONE = new this("none");

    static VERTICAL = new this("vertical");

    static HORIZONTAL = new this("horizontal");

    static BOTH = new this("both");

}
