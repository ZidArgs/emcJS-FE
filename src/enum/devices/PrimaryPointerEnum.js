import Enum from "emcjs/data/Enum.js";

export default class PrimaryPointerEnum extends Enum {

    static POINTER_DEVICE_NONE = new this("PointerDeviceNone");

    static POINTER_DEVICE_FINGER = new this("PointerDeviceTouchFinger");

    static POINTER_DEVICE_STYLUS = new this("PointerDeviceTouchStylus");

    static POINTER_DEVICE_MOUSE = new this("PointerDeviceMouse");

    static POINTER_DEVICE_CONTROLLER = new this("PointerDeviceController");

}
