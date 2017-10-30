import { DroiCallback } from "../droi-callback"
import { RemoteServiceHelper } from "../droi-api"
import { DroiHttpMethod } from "../droi-http"

export class RestObject {
    private static readonly REST_OBJECT_URL = "/objects/v2";
    private static readonly REST_BULK_OBJECT_URL = "/bulk/v2";
    private static readonly REST_HTTPS = "https://api.droibaas.com/rest";
    private static readonly REST_HTTPS_SECURE = "/droi";

    static upsert(obj: string, objId:string, table: string): Promise<boolean> {
        let secureAvaiable = false;

        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_OBJECT_URL}/${table}/${objId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.PUT, obj, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (result) => {
                return true;
            });
    }

    static delete(objId:string, table: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_OBJECT_URL}/${table}/${objId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        
        return callServer(url, DroiHttpMethod.DELETE, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (result) => {
                return true;
            });
    }

    static query(table: string, where?: string, offset?: number, limit?: number, order?: string): Promise<JSON> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_OBJECT_URL}/${table}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        let queryStrings = "";

        if (where)
            queryStrings = `${queryStrings}where=${encodeURIComponent(where)}&`;

        if (offset)
            queryStrings = `${queryStrings}offset=${offset}&`

        if (limit)
            queryStrings = `${queryStrings}offset=${limit}&`

        if (order)
            queryStrings = `${queryStrings}offset=${encodeURIComponent(order)}&`

        if (queryStrings !== "")
            url = `${url}?${queryStrings.substring(0, queryStrings.length-1)}`;

        return callServer(url, DroiHttpMethod.GET, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (result) => {
                let obj = JSON.parse(result);
                return obj.Result;
            });

    }

    static updateData(table: string, data: string, where?: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_OBJECT_URL}/${table}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.PATCH, data, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (result) => {
                return true;
            });
    }

    static buldUpsert(table: string, data: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_BULK_OBJECT_URL}/${table}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.PUT, data, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (result) => {
                return true;
            });
    }

    static buldDelete(table: string, data: string): Promise<boolean> {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestObject.REST_HTTPS_SECURE:RestObject.REST_HTTPS}${RestObject.REST_BULK_OBJECT_URL}/${table}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        if (data)
            url = `${url}?body=${encodeURIComponent(data)}`;

        return callServer(url, DroiHttpMethod.DELETE, null, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN)
            .then( (result) => {
                return true;
            });
    }    
}
