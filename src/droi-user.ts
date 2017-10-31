import { DroiObject } from "./droi-object"

export class DroiUser extends DroiObject {

    static createUser() {
        return new DroiUser();
    }

    private constructor() {
        super("_User");
    }
}