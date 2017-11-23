import { DroiHttpSecure } from "../droi-secure-http"
import { RemoteServiceHelper } from "../droi-api"
import { DroiHttpMethod } from "../droi-http";

export class RestPreference {
    private static readonly REST_PREFERENCE_URL = "/apps/v2";
    private static readonly REST_HTTPS = "https://api.droibaas.com/rest";
    private static readonly REST_HTTPS_SECURE = "/droi";

    private static readonly REST_GET = "/preference";


    private static INSTANCE: RestPreference = null;
    
    static instance(): RestPreference {
        if (RestPreference.INSTANCE == null)
        RestPreference.INSTANCE = new RestPreference();

        return RestPreference.INSTANCE;
    }
    
    get(): Promise<JSON> {
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let url = `${secureAvaiable?RestPreference.REST_HTTPS_SECURE:RestPreference.REST_HTTPS}${RestPreference.REST_PREFERENCE_URL}${RestPreference.REST_GET}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.GET, null, null, null).then( (res) => {
            return res as JSON;
        });
    }
}