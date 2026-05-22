import Enum from "@emcjs/core/enum/Enum.js";

export default class LogTypeEnum extends Enum {

    static LOG = new this("log");

    static INFO = new this("info");

    static WARN = new this("warn");

    static ERROR = new this("error");

}
