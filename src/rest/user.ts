import { RemoteServiceHelper } from "../droi-api"
import { DroiCore } from "../droi-core"
import { DroiHttpMethod } from "../droi-http"
import { DroiConstant } from "../droi-const"
import { DroiUser } from "../droi-user"
import { DroiError } from "../droi-error"

export class RestUser {
    private static readonly REST_USER_URL = "/users/v2";
    private static readonly REST_HTTPS = "https://api.droibaas.com/rest";
    private static readonly REST_HTTPS_SECURE = "/droi";

    private static readonly REST_USER_LOGIN = "/login";
    private static readonly REST_USER_SIGNUP = "/signup";
    private static readonly REST_USER_LOGOUT = "/logout";
    private static readonly REST_USER_PASSWORD = "/password";
    private static readonly REST_USER_EMAIL = "/email";
    private static readonly REST_USER_SMS = "/sms";
    private static readonly REST_USER_VALIDATE_SMS = "/validate/sms";

    static readonly USER_TYPE_GENERAL = "general";
    static readonly USER_TYPE_ANONYMOUS = "anonymous";

    static signupUser(data: JSON): Promise<JSON> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestUser.REST_HTTPS_SECURE:RestUser.REST_HTTPS}${RestUser.REST_USER_URL}${RestUser.REST_USER_SIGNUP}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        let jdata = {Data: data, Type: RestUser.USER_TYPE_GENERAL, InstallationId: DroiCore.getInstallationId()};

        return callServer(url, DroiHttpMethod.POST, JSON.stringify(jdata), null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN);
    }

    static loginUser(userId: string, password: string): Promise<JSON> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestUser.REST_HTTPS_SECURE:RestUser.REST_HTTPS}${RestUser.REST_USER_URL}${RestUser.REST_USER_LOGIN}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        let jdata = {Type: RestUser.USER_TYPE_GENERAL, InstallationId: DroiCore.getInstallationId(), UserId: userId, Password: password};

        return callServer(url, DroiHttpMethod.POST, JSON.stringify(jdata), null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN);
    }

    static loginAnonymous(userData: DroiUser): Promise<JSON> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestUser.REST_HTTPS_SECURE:RestUser.REST_HTTPS}${RestUser.REST_USER_URL}${RestUser.REST_USER_LOGIN}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        let data = `{"Type": "anonymous", "InstallationId": "${DroiCore.getInstallationId()}"}`;

        return callServer(url, DroiHttpMethod.POST, data, null, null)
            .catch( (error) => {
                if (error.code != DroiConstant.DROI_API_USER_NOT_EXISTS)
                    return Promise.reject(error);

                return Promise.resolve(error);
            })
            .then( (result) => {
                if (! (result instanceof DroiError))
                    return result;

                url = `${secureAvaiable?RestUser.REST_HTTPS_SECURE:RestUser.REST_HTTPS}${RestUser.REST_USER_URL}${RestUser.REST_USER_SIGNUP}`;
                let jdata = {Data: JSON.parse(userData.toJson()), Type: "anonymous", InstallationId: DroiCore.getInstallationId()};
                return callServer(url, DroiHttpMethod.POST, JSON.stringify(jdata), null, null);
            });
    }

    static logout(objId: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestUser.REST_HTTPS_SECURE:RestUser.REST_HTTPS}${RestUser.REST_USER_URL}${RestUser.REST_USER_LOGOUT}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        let data = JSON.stringify({_Id: objId});
        return callServer(url, DroiHttpMethod.POST, data, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    static changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestUser.REST_HTTPS_SECURE:RestUser.REST_HTTPS}${RestUser.REST_USER_URL}${RestUser.REST_USER_PASSWORD}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        let jdata = {Old: oldPassword, New: newPassword};
        return callServer(url, DroiHttpMethod.PUT, JSON.stringify(jdata), null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    static validateEmail(): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestUser.REST_HTTPS_SECURE:RestUser.REST_HTTPS}${RestUser.REST_USER_URL}${RestUser.REST_USER_EMAIL}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.POST, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    static validatePhoneNum(): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestUser.REST_HTTPS_SECURE:RestUser.REST_HTTPS}${RestUser.REST_USER_URL}${RestUser.REST_USER_SMS}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.POST, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    static confirmPhoneNumPin(pin: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestUser.REST_HTTPS_SECURE:RestUser.REST_HTTPS}${RestUser.REST_USER_URL}${RestUser.REST_USER_VALIDATE_SMS}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        let jdata = {PinCode: pin};

        return callServer(url, DroiHttpMethod.POST, JSON.stringify(jdata), null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });

    }
}