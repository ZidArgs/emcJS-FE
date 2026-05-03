import Enum from "@emcjs/core/data/Enum.js";

export default class ButtonVariants extends Enum {

    static LABEL = new this("label");

    static PRIMARY = new this("primary");

    static SECONDARY = new this("secondary");

    static SUCCESS = new this("success");

    static DANGER = new this("danger");

    static WARN = new this("warn");

    static INFO = new this("info");

    static LIGHT = new this("light");

    static DARK = new this("dark");

}
