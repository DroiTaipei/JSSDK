import { RemoteServiceHelper } from "../droi-api"
import { DroiHttpMethod } from "../droi-http"
import { DroiError } from "../droi-error"

class RestFile {
    private static readonly REST_HTTP_SECURE = "/droifu/v2/file";  // For secure connection
    private static readonly REST_HTTPS = "https://api.droibaas.com/rest/files/v2";  // For openapi (https)

    private static INSTANCE: RestFile = null;

    static instance(): RestFile {
        if (RestFile.INSTANCE == null)
        RestFile.INSTANCE = new RestFile();

        return RestFile.INSTANCE;
    }


    getUri( objectId: string ): Promise< Array<string> > {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestFile.REST_HTTP_SECURE:RestFile.REST_HTTPS}/${objectId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.GET, "", null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN).then( (res) => {
            if ( res.hasOwnProperty("CDN") ) {
                let result = res["CDN"];
                if ( !(result instanceof Array) )   // ??
                    return [result];
                return result;
            } 

            throw new DroiError( DroiError.ERROR, "There is no CDN link" );
        });
    }

    delete( objectId: string ): Promise< DroiError > {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestFile.REST_HTTP_SECURE:RestFile.REST_HTTPS}/${objectId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.DELETE, "", null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN).then( (res) => {
            return new DroiError( DroiError.OK );
        });
    }
}


export { RestFile }