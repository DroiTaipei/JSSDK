import { DroiHttpSecure } from "../droi-secure-http"
import { RemoteServiceHelper } from "../droi-api"
import { DroiHttpMethod } from "../droi-http";
import { DroiError } from "../index";

export class RestCloudCache {
    private static readonly REST_HTTPS = "https://api.droibaas.com/rest/cloudcache/v2";
    private static readonly REST_HTTPS_SECURE = "/droi/cloudcache/v2";

    private static readonly REST_GET = "/preference";


    private static INSTANCE: RestCloudCache = null;
    
    static instance(): RestCloudCache {
        if (RestCloudCache.INSTANCE == null)
        RestCloudCache.INSTANCE = new RestCloudCache();

        return RestCloudCache.INSTANCE;
    }
    
    get(key: string): Promise<string> {
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let url = `${secureAvaiable?RestCloudCache.REST_HTTPS_SECURE:RestCloudCache.REST_HTTPS}/${key}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.GET, null, null, null).then( (result) => {
            // v3
            //return result["Value"]; 
            return result as string;
        });
    }

    set(key: string, value: string, ttl?: number): Promise<DroiError> {
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let url = `${secureAvaiable?RestCloudCache.REST_HTTPS_SECURE:RestCloudCache.REST_HTTPS}/${key}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        ttl = ttl || 180;

        let body = {TTL: ttl, Value: value};

        return callServer(url, DroiHttpMethod.PUT, JSON.stringify(body), null, null).then( (result) => {
            return new DroiError(DroiError.OK);
        });
    }

    remove(key: string): Promise<DroiError> {
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let url = `${secureAvaiable?RestCloudCache.REST_HTTPS_SECURE:RestCloudCache.REST_HTTPS}/${key}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.DELETE, null, null, null).then( (result) => {
            return new DroiError(DroiError.OK);
        });
    }
}