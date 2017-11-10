import { DroiHttpMethod } from "../droi-http";
import { RemoteServiceHelper } from "../droi-api"
import { DroiConstant } from "../droi-const";

export class RestCloudCode {
    private static readonly REST_HTTPS = "https://api.droibaas.com";
    private static readonly REST_HTTPS_SECURE = "";

    private static INSTANCE: RestCloudCode = null;

    static instance(): RestCloudCode {
        if (RestCloudCode.INSTANCE == null)
        RestCloudCode.INSTANCE = new RestCloudCode();

        return RestCloudCode.INSTANCE;
    }

    callApi(apiKey: string, apiPath: string, method: DroiHttpMethod, params: string, token?: string): Promise<string> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestCloudCode.REST_HTTPS_SECURE:RestCloudCode.REST_HTTPS}${apiPath}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        
        let headers: {[key: string]: string} = {};
        headers[DroiConstant.DROI_KEY_HTTP_API_KEY] = apiKey;

        let tokenHolder = (token == null) ? null : RemoteServiceHelper.TokenHolder.make(token);
        return callServer(url, method, params, headers, tokenHolder).then( (jresult) => {
            return JSON.stringify(jresult);
        });
    }
}