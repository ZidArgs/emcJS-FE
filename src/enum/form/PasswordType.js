import Enum from "@emcjs/core/enum/Enum.js";

export default class PasswordType extends Enum {

    #autocompleteValue;

    constructor(value, autocompleteValue) {
        if (autocompleteValue != null && typeof autocompleteValue !== "string") {
            throw new TypeError("autocompleteValue must be null or a string");
        }
        super(value);
        this.#autocompleteValue = autocompleteValue;
    }

    get autocompleteValue() {
        return this.#autocompleteValue;
    }

    static NONE = new this("none", "off");

    static AUTO = new this("auto", "on");

    static CURRENT = new this("current", "current-password");

    static NEW = new this("new", "new-password");

    static REPEAT = new this("repeat", "repeat-password");

}
