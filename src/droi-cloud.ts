import { DroiHttpMethod } from "./droi-http";
import { DroiObject } from "./droi-object";
import { DroiError } from "./index";
import { RestCloudCode } from "./rest/cloud-code"


export class DroiCloud {
    static callRestApi(apiKey: string, apiPath: string, method: DroiHttpMethod, params: string, token?: string): Promise<string> {
        if ( (method == DroiHttpMethod.DELETE || method == DroiHttpMethod.GET) && params != null )
            return Promise.reject(new DroiError(DroiError.INVALID_PARAMETER, "Params must be null in method GET / DELETE"));

        return RestCloudCode.instance().callApi(apiKey, apiPath, method, params, token);
    }        
}