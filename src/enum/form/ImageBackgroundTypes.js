import Enum from "@emcjs/core/enum/Enum.js";

export default class ImageBackgroundTypes extends Enum {

    static LIGHT = new this("light");

    static DARK = new this("dark");

    static LIGHT_CHECKERED = new this("light-checkered");

    static DARK_CHECKERED = new this("dark-checkered");

}
