import { DroiCallback } from "../droi-callback"
import { RemoteServiceHelper } from "../droi-api"
import { DroiHttpMethod } from "../droi-http"

export class RestObject {
    private static readonly REST_OBJECT_URL = "/objects/v2/";
    private static readonly REST_HTTPS = "/rest";
    private static readonly REST_HTTPS_SECURE = "/droi";

    static create(obj: string, table: string, callback?: DroiCallback<boolean>): Promise<boolean> {
        let secureAvaiable = false;

        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_OBJECT_URL}/${table}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        if (callback) {
            callServer(url, DroiHttpMethod.POST, obj, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN, (result, error) => {
                callback(error.isOk, error);
            });
            return null;
        } else {
            return callServer(url, DroiHttpMethod.POST, obj, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
                .then( (result) => {
                    return true;
                });
        }
    }
}
