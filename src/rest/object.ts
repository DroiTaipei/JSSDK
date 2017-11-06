import { DroiCallback } from "../droi-callback"
import { RemoteServiceHelper } from "../droi-api"
import { DroiHttpMethod } from "../droi-http"
import { DroiError } from "../droi-error"

export interface RestCRUD {
    // Create
    upsert(obj: string, objId:string, table: string): Promise<boolean>;
    // Query
    query(table: string, where?: string, offset?: number, limit?: number, order?: string): Promise<Array<JSON>>;
    // Update
    updateData(table: string, data: string, where?: string): Promise<boolean>
    // Delete
    delete(objId:string, table: string): Promise<boolean>;
}

export class RestObject implements RestCRUD {
    private static readonly REST_OBJECT_URL = "/objects/v2";
    private static readonly REST_BULK_OBJECT_URL = "/bulk/v2";
    private static readonly REST_HTTPS = "https://api.droibaas.com/rest";
    private static readonly REST_HTTPS_SECURE = "/droi";

    private static INSTANCE: RestObject = null;

    static instance(): RestObject {
        if (RestObject.INSTANCE == null)
            RestObject.INSTANCE = new RestObject();

        return RestObject.INSTANCE;
    }

    upsert(obj: string, objId:string, table: string): Promise<boolean> {
        let secureAvaiable = false;

        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_OBJECT_URL}/${table}/${objId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.PUT, obj, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    delete(objId:string, table: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_OBJECT_URL}/${table}/${objId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        
        return callServer(url, DroiHttpMethod.DELETE, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    query(table: string, where?: string, offset?: number, limit?: number, order?: string): Promise<Array<JSON>> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_OBJECT_URL}/${table}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        let queryStrings = "";

        if (where)
            queryStrings = `${queryStrings}where=${encodeURIComponent(where)}&`;

        if (offset || !isNaN(offset))
            queryStrings = `${queryStrings}offset=${offset}&`

        if (limit || !isNaN(limit))
            queryStrings = `${queryStrings}offset=${limit}&`

        if (order)
            queryStrings = `${queryStrings}offset=${encodeURIComponent(order)}&`

        if (queryStrings !== "")
            url = `${url}?${queryStrings.substring(0, queryStrings.length-1)}`;

        return callServer(url, DroiHttpMethod.GET, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN).then(
            (jresult) => {
                if (jresult instanceof Array)
                    return jresult as Array<JSON>;
                throw new DroiError(DroiError.INVALID_PARAMETER, "json is not array in query result");
            }
        );
    }

    updateData(table: string, data: string, where?: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_OBJECT_URL}/${table}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.PATCH, data, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    bulkUpsert(table: string, data: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_BULK_OBJECT_URL}/${table}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.PUT, data, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }

    bulkDelete(table: string, data: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_BULK_OBJECT_URL}/${table}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        if (data)
            url = `${url}?body=${encodeURIComponent(data)}`;

        return callServer(url, DroiHttpMethod.DELETE, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (_) => {
                return true;
            });
    }    
}
