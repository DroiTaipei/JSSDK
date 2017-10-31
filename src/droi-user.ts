import { DroiObject } from "./droi-object"
import { DroiCallback } from "./droi-callback"

export class DroiUser extends DroiObject {

    static createUser() {
        return new DroiUser();
    }

    private constructor() {
        super("_User");
    }

    static getCurrentUser(): DroiUser {
        return null;
    }

    static loginAnonymous(callback?: DroiCallback<DroiUser>): Promise<DroiUser> {
        return null;
    }

    logout(callback?: DroiCallback<boolean>): Promise<boolean> {
        return null;
    }
}