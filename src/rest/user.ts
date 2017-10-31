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

    static signupUser(userId: string, password: string, data: string): Promise<JSON> {
        return null;
    }

    static loginUser(userId: string, password: string): Promise<JSON> {
        return null;
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
            })
    }
}