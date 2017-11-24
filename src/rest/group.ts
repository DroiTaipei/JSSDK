import { RestCRUD, RestObject } from "./object";
import { DroiHttpSecure } from "../droi-secure-http";
import { RemoteServiceHelper } from "../droi-api";
import { DroiHttpMethod } from "../droi-http";
import { DroiError } from "../index";
import { RestUser } from "./user";

export class RestGroup implements RestCRUD {
    private static readonly REST_GROUP_URL = "/groups/v2";
    private static readonly REST_USER_URL = "/users/v2";
    
    private static readonly REST_HTTPS = "https://api.droibaas.com/rest";
    private static readonly REST_HTTPS_SECURE = "/droi";

    static readonly TABLE_NAME = "_Group";

    private static INSTANCE: RestGroup = null;
    
    static instance(): RestGroup {
        if (RestGroup.INSTANCE == null)
        RestGroup.INSTANCE = new RestGroup();

        return RestGroup.INSTANCE;
    }   

    upsert(obj: string, objId:string, table: string): Promise<boolean> {
        let secureAvaiable = DroiHttpSecure.isEnable();

        let url = `${secureAvaiable?RestGroup.REST_HTTPS_SECURE:RestGroup.REST_HTTPS}${RestGroup.REST_GROUP_URL}/${objId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.PUT, obj, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    query(table: string, where?: string, offset?: number, limit?: number, order?: string): Promise<Array<JSON>> {
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let url = `${secureAvaiable?RestGroup.REST_HTTPS_SECURE:RestGroup.REST_HTTPS}${RestGroup.REST_GROUP_URL}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        let queryStrings = RestObject.generatorQueryString(where, offset, limit, order);

        if (!secureAvaiable)
            queryStrings = queryStrings + "&include_depth=3";

        if (queryStrings !== "")
            url = `${url}?${queryStrings}`;

        return callServer(url, DroiHttpMethod.GET, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN).then(
            (jresult) => {
                if (jresult instanceof Array)
                    return jresult as Array<JSON>;
                throw new DroiError(DroiError.INVALID_PARAMETER, "json is not array in query result");
            }
        );
    }

    updateData(table: string, data: string, where?: string, offset?: number, limit?: number, order?: string): Promise<boolean> {
        return RestObject.instance().updateData(table, data, where, offset, limit, order);
    }

    delete(objId:string, table: string): Promise<boolean> {
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let url = `${secureAvaiable?RestGroup.REST_HTTPS_SECURE:RestGroup.REST_HTTPS}${RestGroup.REST_GROUP_URL}/${objId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        
        return callServer(url, DroiHttpMethod.DELETE, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    fetch(name: string): Promise<JSON> {
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let url = `${secureAvaiable?RestGroup.REST_HTTPS_SECURE:RestGroup.REST_HTTPS}${RestGroup.REST_GROUP_URL}/${name}?name=true`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.GET, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (json) => {
                let jarr = (json as any) as Array<JSON>;
                return jarr[0];
            });
    }

    getGroupIdByObjectId(type: number, objectId: string): Promise<Array<string>> {
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let table = (type == 0) ? RestGroup.REST_USER_URL : RestGroup.REST_GROUP_URL;
        let url = `${secureAvaiable?RestGroup.REST_HTTPS_SECURE:RestGroup.REST_HTTPS}${table}/${objectId}/parent`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.GET, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (json) => {
                return json as any;
            });
    }
}