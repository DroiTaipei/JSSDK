import { DroiObject } from "./droi-object"
import { DroiCallback, DroiSingleCallback } from "./droi-callback"
import { DroiError } from "./droi-error"
import { DroiCore } from "./droi-core"
import { RestUser } from "./rest/user"
import { DroiPersistSettings } from "./droi-persist-settings"
import { DroiConstant } from "./droi-const"
import * as sha256 from "sha256"

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

    private static readonly KEY_USERID = "UserId";
    private static readonly KEY_AUTHDATA = "AuthData";
    private static readonly KEY_EMAIL = "Email";
    private static readonly KEY_PHONENUM = "PhoneNum";

    private session: {[key: string]: string};
    private password: string;

    private static currentUser: DroiUser = null;

    static createUser() {
        return new DroiUser();
    }

    protected constructor() {
        super("_User");
        this.session = null;
    }

    private static saveUserCache(user: DroiUser) {
        let userData = user.toJson();
        let jdata = {userData: userData, session: user.session};
        DroiPersistSettings.setItem(DroiPersistSettings.KEY_SAVED_USER, JSON.stringify(jdata));
    }

    private static loadUserCache(): DroiUser {
        let jstr = DroiPersistSettings.getItem(DroiPersistSettings.KEY_SAVED_USER);
        if (jstr == null)
            return null;

        let jdata = JSON.parse(jstr);

        let obj = DroiObject.fromJson(JSON.parse(jdata.userData));
        let user = DroiUser.createUser();
        user.cloneFrom(obj);
        user.session = jdata.session;

        return user;
    }

    private static cleanUserCache() {
        DroiPersistSettings.removeItem(DroiPersistSettings.KEY_SAVED_USER);
        DroiUser.currentUser = null;
    }

    static getCurrentUser(): DroiUser {
        if (DroiUser.currentUser != null)
            return DroiUser.currentUser;

        let user = DroiUser.loadUserCache();
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
        user.setValue("UserId", DroiCore.getInstallationId() + await DroiCore.getDeviceId());
        user.setValue("AuthData", {"anonymous": "1"});

        let promise = RestUser.instance().loginAnonymous(user)
            .then( (jlogin) => {
                let token = jlogin["Token"];
                let expired = jlogin["ExpiredAt"];
                let juser = jlogin["Data"];
                let user: DroiUser = DroiObject.fromJson(juser);
                user.session = {Token: token, ExpiredAt: expired};
                
                DroiUser.saveUserCache(user);

                return ReturnHandler(new DroiError(DroiError.OK), user, callback);
            })
            .catch( (error) => {
                return ReturnHandler(error, null, callback);
            });

        return (callback) ? null : promise;
    }

    static login(userId: string, password: string, callback?: DroiCallback<DroiUser>): Promise<DroiUser> {
        if (userId == null || password == null) {
            return ReturnHandler(new DroiError(DroiError.INVALID_PARAMETER, "Empty UserId or Password"), null, callback);
        }

        // User already logged in
        let curUser = DroiUser.getCurrentUser();
        if (curUser != null && curUser.isLoggedIn() && !curUser.isAnonymous()) {
            return ReturnHandler(new DroiError(DroiError.USER_ALREADY_LOGIN), null, callback);
        }

        let promise = RestUser.instance().loginUser(userId, sha256(password))
            .then( (jresult) => {
                let user = DroiUser.createUser();
                let obj = DroiObject.fromJson(jresult["Data"]);
                user.cloneFrom(obj);
                user.session = {Token: jresult["Token"], ExpiredAt: jresult["ExpiredAt"]};

                DroiUser.saveUserCache(user);
                DroiUser.currentUser = user;
                return ReturnHandler(new DroiError(DroiError.OK), user, callback);
            })
            .catch( (error) => {
                return ReturnHandler(error, null, callback);
            });

        return callback ? null : promise;
    }

    async signup(callback?: DroiSingleCallback): Promise<DroiError> {
        // Needed parameters check
        if (this.getValue(DroiUser.KEY_USERID) == null || this.password == null) {
            return ReturnSingleHandler(new DroiError(DroiError.INVALID_PARAMETER, "Empty UserId or Password."), callback);
        }

        // Anonysmous => Normal User
        // Only save
        let currUser = DroiUser.getCurrentUser();
        if (currUser != null && currUser.isLoggedIn()) {
            if (! (currUser.objectId() === this.objectId() && currUser.isAnonymous()))
                return ReturnSingleHandler(new DroiError(DroiError.USER_ALREADY_LOGIN), callback);
            this.setValue(DroiUser.KEY_AUTHDATA, null);
            try {
                await super.save();
            } catch ( e ) {
                // save fail. recover back to anonymous
                let error = e as DroiError;
                if (error.code == DroiConstant.DROI_API_RECORD_CONFLICT)
                    error.code = DroiError.USER_ALREADY_EXISTS;
                let authData = {};
                authData[RestUser.USER_TYPE_ANONYMOUS] = "1";
                this.setValue(DroiUser.KEY_AUTHDATA, authData);
                this.setValue(DroiUser.KEY_USERID, DroiCore.getInstallationId() + await DroiCore.getDeviceId());
                this.password = null;

                return ReturnSingleHandler(error, callback);
            }

            DroiUser.saveUserCache(this);
            try {
                let error = await this.changePassword("", this.password);
                return ReturnSingleHandler(error, callback);
            } catch (error) {
                return ReturnSingleHandler(error, callback);
            }
        }

        // Standard normal user signup
        this.setValue(DroiUser.KEY_AUTHDATA , null);

        let userData = this.toJson();
        let juser = JSON.parse(userData);
        juser["Password"] = sha256(this.password);
        this.password = null;

        let jresult;
        try {
            jresult = await RestUser.instance().signupUser(juser);
        } catch (e) {
            let error = e as DroiError;
            if (error.code == DroiConstant.DROI_API_RECORD_CONFLICT || error.code == DroiConstant.DROI_API_USER_EXISTS)
                error.code = DroiError.USER_ALREADY_EXISTS;
            return ReturnSingleHandler(error, callback);
        }

        this.session = {Token: jresult["Token"], ExpiredAt: jresult["ExpiredAt"]};
        DroiUser.currentUser = this;
        DroiUser.saveUserCache(this);

        //TODO: pickup super.save flow.
        //
        // try {
        //     let error = await super.save();
        //     return ReturnSingleHandler(error, callback);
        // } catch (error) {
        //     return ReturnSingleHandler(error, callback);
        // }

        // Workaround here to ignore reference fields.
        return ReturnSingleHandler(new DroiError(DroiError.OK), callback);
    }

    logout(callback?: DroiSingleCallback): Promise<DroiError> {
        if (!this.isLoggedIn()) {
            return ReturnSingleHandler(new DroiError(DroiError.USER_NOT_AUTHORIZED), callback);
        }

        let promise = RestUser.instance().logout(this.objectId())
            .then( (_) => {
                DroiUser.cleanUserCache();
                return ReturnSingleHandler(new DroiError(DroiError.OK), callback);
            })
            .catch( (error) => {
                DroiUser.cleanUserCache();
                return ReturnSingleHandler(error, callback);
            });

        return callback ? null : promise;
    }

    isLoggedIn(): boolean {
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

    isAnonymous(): boolean {
        let authData = this.getValue(DroiUser.KEY_AUTHDATA);
        return authData != null && authData[RestUser.USER_TYPE_ANONYMOUS] != null;
    }

    changePassword(oldPassword: string, newPassword: string, callback?: DroiSingleCallback): Promise<DroiError> {
        let promise = RestUser.instance().changePassword(sha256(oldPassword), sha256(newPassword))
            .then( (_) => {
                return ReturnSingleHandler(new DroiError(DroiError.OK), callback);
            })
            .catch( (error) => {
                return ReturnSingleHandler(error, callback);
            })

        return callback ? null : promise;
    }

    validateEmail(callback?: DroiSingleCallback): Promise<DroiError> {
        let promise = RestUser.instance().validateEmail()
            .then( (_) => {
                return ReturnSingleHandler(new DroiError(DroiError.OK), callback);
            })
            .catch( (error) => {
                return ReturnSingleHandler(error, callback);
            })

        return callback ? null : promise;
    }

    validatePhoneNum(callback?: DroiSingleCallback): Promise<DroiError> {
        let promise = RestUser.instance().validatePhoneNum()
        .then( (_) => {
            return ReturnSingleHandler(new DroiError(DroiError.OK), callback);
        })
        .catch( (error) => {
            return ReturnSingleHandler(error, callback);
        })

        return callback ? null : promise;    
    }

    confirmPhoneNumPin(pin: string, callback?: DroiSingleCallback): Promise<DroiError> {
        let promise = RestUser.instance().confirmPhoneNumPin(pin)
        .then( (_) => {
            return ReturnSingleHandler(new DroiError(DroiError.OK), callback);
        })
        .catch( (error) => {
            return ReturnSingleHandler(error, callback);
        })

        return callback ? null : promise;            
    }

    cloneFrom(droiObject: DroiObject) {
        super.cloneFrom(droiObject);
        if (droiObject instanceof DroiUser) {
            let user = droiObject as DroiUser;
            this.UserId = user.UserId;
            this.Password = user.Password;
            this.Email = user.Email;
            this.PhoneNum = user.PhoneNum;
            this.session = user.session;
            this.setValue(DroiUser.KEY_AUTHDATA, user.getValue(DroiUser.KEY_AUTHDATA));
        }
    }

    get Password(): string {
        return this.password;
    }

    set Password(password: string) {
        this.password = password;
    }

    get UserId(): string {
        return this.getValue(DroiUser.KEY_USERID);
    }

    set UserId(id: string) {
        this.setValue(DroiUser.KEY_USERID, id);
    }

    get Email(): string {
        return this.getValue(DroiUser.KEY_EMAIL);
    }

    set Email(email: string) {
        this.setValue(DroiUser.KEY_EMAIL, email);
    }

    get PhoneNum(): string {
        return this.getValue(DroiUser.KEY_PHONENUM);
    }

    set PhoneNum(phone: string) {
        this.setValue(DroiUser.KEY_PHONENUM, phone);
    }

    get sessionToken(): string {
        if (!this.isLoggedIn())
            return null;
        
        return this.session["Token"];
    }
}