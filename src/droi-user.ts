import { DroiObject } from "./droi-object"
import { DroiCallback, DroiSingleCallback } from "./droi-callback"
import { DroiError } from "./droi-error"
import { DroiCore } from "./droi-core"
import { RestUser } from "./rest/user"
import { DroiPersistSettings } from "./droi-persist-settings"

function ReturnSingleHandler(error: DroiError, callback: DroiSingleCallback): Promise<DroiError> {
    if (callback) {
        callback(error);
        return null;
    } else {
        return error.isOk ? Promise.resolve(error) : Promise.reject(error);
    }
}

function ReturnHandler<T>(error: DroiError, value: T, callback: DroiCallback<T>): Promise<T> {
    if (callback) {
        callback(value, error);
        return null;
    } else {
        return error.isOk ? Promise.resolve(value) : Promise.reject(error);
    }
}

export class DroiUser extends DroiObject {

    private session: {[key: string]: string};
    private static currentUser: DroiUser = null;

    static createUser() {
        return new DroiUser();
    }

    private constructor() {
        super("_User");
        this.session = null;
    }

    private static saveUser(user: DroiUser) {
        let userData = user.toJson();
        let jdata = {userData: userData, session: user.session};
        DroiPersistSettings.setItem(DroiPersistSettings.KEY_SAVED_USER, JSON.stringify(jdata));
    }

    private static loadUser(): DroiUser {
        let jstr = DroiPersistSettings.getItem(DroiPersistSettings.KEY_SAVED_USER);
        if (jstr == null)
            return null;

        let jdata = JSON.parse(jstr);

        let obj = DroiObject.fromJson(JSON.parse(jdata.userData));
        let user = DroiUser.createUser();
        user.properties = obj.properties;
        user.permission = obj.permission;
        user.session = jdata.session;

        return user;
    }

    static getCurrentUser(): DroiUser {
        if (DroiUser.currentUser != null)
            return DroiUser.currentUser;

        let user = DroiUser.loadUser();
        if (user == null)
            return null;

        DroiUser.currentUser = user;
        return user;
    }

    static async loginAnonymous(callback?: DroiCallback<DroiUser>): Promise<DroiUser> {
        // Already logged in
        let user = DroiUser.getCurrentUser();
        if (user != null && user.isLoggedIn) {
            return ReturnHandler(new DroiError(DroiError.USER_ALREADY_LOGIN), null, callback);
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
                user.session = {Token: token, ExpiredAt: expired};
                
                DroiUser.saveUser(user);

                return ReturnHandler(new DroiError(DroiError.OK), user, callback);
            })
            .catch( (error) => {
                return ReturnHandler(error, null, callback);
            });

        return (callback) ? null : promise;
    }

    logout(callback?: DroiSingleCallback): Promise<DroiError> {
        if (!this.isLoggedIn()) {
            return ReturnSingleHandler(new DroiError(DroiError.USER_NOT_AUTHORIZED), callback);
        }

        let promise = RestUser.logout(this.objectId())
            .then( (_) => {
                return ReturnSingleHandler(new DroiError(DroiError.OK), callback);
            })
            .catch( (error) => {
                return ReturnSingleHandler(error, callback);
            });

        return callback ? null : promise;
    }

    isLoggedIn(): boolean {
        console.log(`user session ${this.session}`);
        
        if (this.session == null)
            return false;

        if (this.session["Token"] == null || this.session["ExpiredAt"] == null)
            return false;

        let date = Date.parse(this.session["ExpiredAt"]);
        if (isNaN(date))
            return false;

        if (Date.now() >= date)
            return false;

        return true;
    }
}