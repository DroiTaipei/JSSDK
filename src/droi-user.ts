import { DroiObject } from "./droi-object"
import { DroiCallback } from "./droi-callback"
import { DroiError } from "./droi-error"
import { DroiCore } from "./droi-core"
import { RestUser } from "./rest/user"
import { DroiPersistSettings } from "./droi-persist-settings"

export class DroiUser extends DroiObject {

    private session: {[key: string]: string};

    static createUser() {
        return new DroiUser();
    }

    private constructor() {
        super("_User");
    }

    private static saveUser(user: DroiUser) {
        let userData = user.toJson();
        let jdata = {userData: userData, session: user.session};
        DroiPersistSettings.setItem(DroiPersistSettings.KEY_SAVED_USER, JSON.stringify(jdata));
    }

    static getCurrentUser(): DroiUser {
        return null;
    }

    static async loginAnonymous(callback?: DroiCallback<DroiUser>): Promise<DroiUser> {
        // Already logged in
        let user = DroiUser.getCurrentUser();
        if (user != null && user.isLoggedIn) {
            let error = new DroiError(DroiError.USER_ALREADY_LOGIN);
            if (callback) {
                callback(null, error);
                return null;
            } else
                return Promise.reject(error);
        }

        user = DroiUser.createUser();
        user.setValue("UserId", DroiCore.getInstallationId + await DroiCore.getDeviceId());
        user.setValue("AuthData", {"anonymous": "1"});

        let promise = RestUser.loginAnonymous(user)
            .then( (jlogin) => {
                let token = jlogin["Token"];
                let expired = jlogin["ExpiredAt"];
                let juser = jlogin["Data"];
                let user: DroiUser = DroiObject.fromJson(juser);
                user.session = {Token: token, ExpireAt: expired};
                
                DroiUser.saveUser(user);

                if (callback) 
                    callback(user, new DroiError(DroiError.OK));

                return user;
            })
            .catch( (error) => {
                if (callback) {
                    callback(null, error);
                } else {
                    return Promise.reject(error);
                }
            });

        return (callback) ? null : promise;
    }

    logout(callback?: DroiCallback<boolean>): Promise<boolean> {
        return null;
    }

    isLoggedIn(): boolean {
        return false;
    }
}