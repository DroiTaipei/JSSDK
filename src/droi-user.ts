import { DroiObject } from "./droi-object"
import { DroiCallback, DroiSingleCallback } from "./droi-callback"
import { DroiError } from "./droi-error"
import { DroiCore } from "./droi-core"
import { RestUser, ResetPasswordType, OtpType } from "./rest/user"
import { DroiPersistSettings } from "./droi-persist-settings"
import { DroiConstant } from "./droi-const"
import * as sha256 from "sha256"

export class DroiUser extends DroiObject {

    private static readonly KEY_USERID = "UserId";
    private static readonly KEY_AUTHDATA = "AuthData";
    private static readonly KEY_EMAIL = "Email";
    private static readonly KEY_PHONENUM = "PhoneNum";
    private static readonly KEY_ENABLE = "Enabled";
    private static readonly KEY_EMAIL_VERIFIED = "EmailVerified";
    private static readonly KEY_PHONE_VERIFIED = "PhoneNumVerified";

    private session: {[key: string]: string};
    private password: string;

    private static currentUser: DroiUser = null;

    static createUser(className ?: string ) {
        return new DroiUser(className);
    }

    protected constructor(className ?: string) {
        super("_User");
        className = className || "DroiUser";

        this.session = null;
        this.setValue(DroiUser.KEY_ENABLE, true);
        this.setValue(DroiUser.KEY_EMAIL_VERIFIED, false);
        this.setValue(DroiUser.KEY_PHONE_VERIFIED, false);
        this.setClassName( className );
    }

    private static saveUserCache(user: DroiUser) {
        let userData = user.toJson();
        let jdata = {userData: userData, session: user.session};
        DroiPersistSettings.setItem(DroiPersistSettings.KEY_SAVED_USER, JSON.stringify(jdata));
    }

    private static loadUserCache(): DroiUser {
        let jstr = DroiPersistSettings.getItem(DroiPersistSettings.KEY_SAVED_USER);
        if (jstr == null || jstr.length == 0)
            return null;

        let jdata = JSON.parse(jstr);

        let user = DroiObject.fromJson(JSON.parse(jdata.userData));
        user.session = jdata.session;

        return user;
    }

    private static cleanUserCache() {
        DroiPersistSettings.removeItem(DroiPersistSettings.KEY_SAVED_USER);
        DroiUser.currentUser = null;
    }

    static async setCurrentUserToken(userObjId: string, sessionToken: string): Promise<DroiUser> {
        let fakeUser = DroiUser.createUser();
        fakeUser.session = {Token: sessionToken, ExpiredAt: new Date((Date.now() + 2952000000)).toISOString()};
        DroiUser.currentUser = fakeUser;

        try {
            let dobj = await DroiUser.fetch("_User", userObjId);
            let user = DroiUser.createUser();
            user.cloneFrom(dobj);
            user.session = fakeUser.session;
            DroiUser.currentUser = user;
            DroiUser.saveUserCache(user);
            return Promise.resolve(user);
        } catch (error) {
            return Promise.reject(error);
        }
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

    static async loginAnonymous(): Promise<DroiUser> {
        // Already logged in
        let user = DroiUser.getCurrentUser();
        if (user != null && user.isLoggedIn()) {
            return Promise.reject(new DroiError(DroiError.USER_ALREADY_LOGIN));
        }

        user = DroiUser.createUser();
        user.setValue("UserId", DroiCore.getInstallationId() + await DroiCore.getDeviceId());
        user.setValue("AuthData", {"anonymous": "1"});

        return RestUser.instance().loginAnonymous(user)
            .then( (jlogin) => {
                let token = jlogin["Token"];
                let expired = jlogin["ExpiredAt"];
                let juser = jlogin["Data"];
                let user: DroiUser = DroiObject.fromJson(juser);
                user.session = {Token: token, ExpiredAt: expired};
                DroiUser.currentUser = user;
                DroiUser.saveUserCache(user);

                return user;
            });
    }

    static login(userId: string, password: string): Promise<DroiUser> {
        if (userId == null || password == null) {
            return Promise.reject(new DroiError(DroiError.INVALID_PARAMETER, "Empty UserId or Password"));
        }

        // User already logged in
        let curUser = DroiUser.getCurrentUser();
        if (curUser != null && curUser.isLoggedIn() && !curUser.isAnonymous()) {
            return Promise.reject(new DroiError(DroiError.USER_ALREADY_LOGIN));
        }

        return RestUser.instance().loginUser(userId, sha256(password))
            .then( (jresult) => {
                let user = DroiObject.fromJson(jresult["Data"]);
                user.session = {Token: jresult["Token"], ExpiredAt: jresult["ExpiredAt"]};

                DroiUser.saveUserCache(user);
                DroiUser.currentUser = user;
                return user;
            });
    }

    static loginOTP(contact: string, type: OtpType, otpCode: string, userId?: string): Promise<DroiUser> {
        userId = userId || "droiotp_" + contact;

        let user = DroiUser.createUser();
        user.UserId = userId;
        if (type == OtpType.EMAIL) {
            user.Email = contact;
        } else {
            user.PhoneNum = contact;
        }

        return RestUser.instance().loginOTP(otpCode, type, JSON.parse(user.toJson()))
            .then( (jdata) => {
                let user = DroiObject.fromJson(jdata["Data"]);
                user.session = {Token: jdata["Token"], ExpiredAt: jdata["ExpiredAt"]};

                DroiUser.saveUserCache(user);
                DroiUser.currentUser = user;
                return user;
            });
    }

    static resetPassword(userId: string, type: ResetPasswordType): Promise<DroiError> {
        return RestUser.instance().resetPassword(userId, type)
            .then( (_) => {
                return new DroiError(DroiError.OK);
            });
    }

    static requestOTP(contact: string, type: OtpType, userId?: string): Promise<DroiError> {
        userId = userId || "droiotp_" + contact;

        return RestUser.instance().requestOTP(userId, contact, type)
            .then( (_) => {
                return new DroiError(DroiError.OK);
            })
    }

    async signup(): Promise<DroiError> {
        // Needed parameters check
        if (this.getValue(DroiUser.KEY_USERID) == null || this.password == null) {
            return Promise.reject(new DroiError(DroiError.INVALID_PARAMETER, "Empty UserId or Password."));
        }

        // Anonysmous => Normal User
        // Only save
        let currUser = DroiUser.getCurrentUser();
        if (currUser != null && currUser.isLoggedIn()) {
            if (! (currUser.objectId() === this.objectId() && currUser.isAnonymous()))
                return Promise.reject(new DroiError(DroiError.USER_ALREADY_LOGIN));
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

                return Promise.reject(error);
            }

            DroiUser.saveUserCache(this);
            return this.changePassword("", this.password);
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
            return Promise.reject(error);
        }

        this.session = {Token: jresult["Token"], ExpiredAt: jresult["ExpiredAt"]};
        DroiUser.currentUser = this;
        DroiUser.saveUserCache(this);

        return super.save();
    }

    delete(): Promise<DroiError> {
        return super.delete()
            .then( (droiError) => {
                DroiUser.cleanUserCache();
                return droiError;
            })
            .catch( (error) => {
                DroiUser.cleanUserCache();
                return error;
            });
    }

    logout(): Promise<DroiError> {
        if (!this.isLoggedIn()) {
            return Promise.reject(new DroiError(DroiError.USER_NOT_AUTHORIZED));
        }

        return RestUser.instance().logout(this.objectId())
            .then( (_) => {
                DroiUser.cleanUserCache();
                return new DroiError(DroiError.OK);
            });
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

    isEnable(): boolean {
        return this.getValue(DroiUser.KEY_ENABLE) || false;
    }

    isEmailVerified(): boolean {
        return this.getValue(DroiUser.KEY_EMAIL_VERIFIED) || false;
    }

    isPhoneNumVerified(): boolean {
        return this.getValue(DroiUser.KEY_PHONE_VERIFIED) || false;
    }

    changePassword(oldPassword: string, newPassword: string): Promise<DroiError> {
        return RestUser.instance().changePassword(sha256(oldPassword), sha256(newPassword))
            .then( (_) => {
                return new DroiError(DroiError.OK);
            });
    }

    validateEmail(): Promise<DroiError> {
        return RestUser.instance().validateEmail()
            .then( (_) => {
                return new DroiError(DroiError.OK);
            });
    }

    validatePhoneNum(): Promise<DroiError> {
        return RestUser.instance().validatePhoneNum()
        .then( (_) => {
            return new DroiError(DroiError.OK);
        });
    }

    confirmPhoneNumPin(pin: string): Promise<DroiError> {
        return RestUser.instance().confirmPhoneNumPin(pin)
        .then( (_) => {
            return new DroiError(DroiError.OK);
        });
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