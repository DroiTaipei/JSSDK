import { RemoteServiceHelper } from "../droi-api"
import { DroiError } from "../droi-error"
import { DroiCore } from "../index";
import { DroiHttpMethod, DroiHttp, DroiHttpRequest, DroiHttpResponse } from "../droi-http"

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

        return callServer(url, DroiHttpMethod.DELETE, "", null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN).then( (_) => {
            return new DroiError( DroiError.OK );
        });
    }

    getUploadToken( objectId: string, name: string, mimeType: string, size: number, md5: string ): Promise< JSON > {
        let secureAvaiable = false;
        
        let url = `${secureAvaiable?RestFile.REST_HTTP_SECURE:RestFile.REST_HTTPS}/${objectId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        let input = JSON.stringify({ "Name":name, "Type":mimeType, "Size":size, "MD5":md5 });
        return callServer(url, DroiHttpMethod.PUT, input, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN).then( (res) => {
                let fileToken = res["Token"];
                let uploadUrl = res["UploadUrl"];
                let sessionId = res["SessionId"];
                if ( fileToken === undefined || uploadUrl === undefined)
                    throw new DroiError(DroiError.UPLOAD_FAILED, "Token or Upload url is empty.");
                return res;
        });
    }

    upload( uploadUrl: string, fileToken: string, sessionId: string, objectId: string, name: string, mimeType: string, data:Uint8Array, progressCB: (currentSize: number, totalSize: number) => void ): Promise<DroiHttpResponse> {
        let promiseHandler = (resolve, reject) => {
            let statusText: string = null;
            let fd = new FormData();
            fd.append( "key", name );
            fd.append( "token", fileToken );
            fd.append("x:AppId", DroiCore.getAppId() );
            fd.append("x:Id", objectId );
            fd.append("x:SessionId", sessionId );
            fd.append("file", new Blob([data], {type: mimeType}) );
    
            let xhr = new XMLHttpRequest();

            // Progress callback
            if ( progressCB != null ) {
                xhr.upload.addEventListener( 'progress', (oEvent) => {
                    if ( oEvent.lengthComputable )
                        progressCB( oEvent.loaded, oEvent.total );
                });
            }
    
            // Result
            let resultBack = (response: DroiHttpResponse) => {
                // callback or promise
                let error: DroiError = new DroiError(DroiError.OK);
                if (statusText && statusText != "") {
                    error.code = DroiError.ERROR;
                    error.appendMessage = `[HTTPS] ${statusText}`;
                }

                if (error.isOk)
                    resolve(response);
                else
                    reject(error);
            }

            // Error Handler
            let errorHandler = (e) => {
                // Already handled in Node
                if (statusText && statusText != "") {
                    return;
                }
                //
                statusText = `Error type: ${e.type}`;
                let response = new DroiHttpResponse();
                response.status = xhr.status;
                response.data = xhr.responseText;
                resultBack(response);
            };

            xhr.ontimeout = errorHandler;
            xhr.onerror = errorHandler;


            // Result callback
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    statusText = xhr.statusText;
                    if (xhr.status != 0 || (statusText && statusText != "")) {
                        let response = new DroiHttpResponse();
                        response.status = xhr.status;
                        response.data = xhr.responseText;
                        console.log(` Output: ${response.data}`);
                        let allheaders = xhr.getAllResponseHeaders().split("\r\n");
                        let headers: {[key: string]: string} = {};
                        response.headers = headers;

                        for (let header of allheaders) {
                            if (header == "")
                                continue;
                            let parts = header.split(":");
                            headers[parts[0].trim()] = parts[1].trim();
                        }
                        resultBack(response);
                    }
                }
            };

            // Init connection
            xhr.open( "post", uploadUrl );

            //
            xhr.send( fd );            
        };
        
        return new Promise<DroiHttpResponse>( promiseHandler );
    }
}


export { RestFile }