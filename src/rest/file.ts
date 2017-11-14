import { RemoteServiceHelper } from "../droi-api"
import { DroiError } from "../droi-error"
import { DroiCore } from "../index";
import { DroiHttpMethod, DroiHttp, DroiHttpRequest, DroiHttpResponse } from "../droi-http"
import { DroiLog } from "../droi-log"

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

    getUploadToken( objectId: string, name: string, mimeType: string, size: number, md5: string, newFile: boolean ): Promise< JSON > {

        DroiLog.d( RestFile.LOG_TAG, "getUploadToken");
        let secureAvaiable = false;
        
        let url = (secureAvaiable||!newFile) ? `${secureAvaiable?RestFile.REST_HTTP_SECURE:RestFile.REST_HTTPS}/${objectId}` : `${secureAvaiable?RestFile.REST_HTTP_SECURE:RestFile.REST_HTTPS}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        let method = secureAvaiable ? DroiHttpMethod.PUT : (newFile?DroiHttpMethod.POST:DroiHttpMethod.PATCH);

        let input = JSON.stringify({ "Name":name, "Type":mimeType, "Size":size, "MD5":md5 });
        return callServer(url, method, input, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN).then( (res) => {
                let fileToken = res["Token"];
                let uploadUrl = res["UploadUrl"];
                let sessionId = res["SessionId"];
                if ( fileToken === undefined || uploadUrl === undefined)
                    throw new DroiError(DroiError.UPLOAD_FAILED, "Token or Upload url is empty.");
                return res;
        });
    }
    private createData( parameters: object, boundary: string, name: string, data: Uint8Array, mimeType: string  ): Buffer {
        let head: string = "";        
        // Add parameters
        for ( let key in parameters ) {
            head = head.concat(`--${boundary}\r\n`,
                `Content-Disposition: form-data; name="${key}"\r\n\r\n`,
                `${parameters[key]}\r\n`);
        }

        // Add data
        head = head.concat(`--${boundary}\r\n`,
            `Content-Disposition: form-data; name="file"; filename="${name}"\r\n`,
            `Content-Type: ${mimeType}\r\n\r\n`);

        let tail: string = `\r\n--${boundary}--\r\n`;

        let totalSize = head.length + tail.length + data.length; 

        let res = new Buffer( totalSize );

        // Copy head
        let i=0;
        for ( ; i<head.length; i++ ) {
            res[i] = head.charCodeAt(i) & 0xff;
        }

        // Copy binary data
        for ( let j=0; j<data.length; j++, i++ )
            res[i] = data[j];

        // copy tail
        for ( let j=0; j<tail.length; j++, i++ ) 
            res[i] = tail.charCodeAt(j) & 0xff;
        
        return res;
    }


    upload( uploadUrl: string, fileToken: string, sessionId: string, objectId: string, name: string, mimeType: string, data:Uint8Array, progressCB: (currentSize: number, totalSize: number) => void ): Promise<DroiHttpResponse> {
        let promiseHandler = (resolve, reject) => {
            let statusText: string = null;
            let boundary = "Boundary-".concat( objectId );
            let cs = this.createData( { "key": name,
                "token": fileToken, 
                "x:AppId": DroiCore.getAppId(),
                "x:Id": objectId,
                "x:SessionId": sessionId
            }, boundary, name, data, mimeType );     
                   
            let xhr = new XMLHttpRequest();

            // Progress callback
            if ( progressCB != null ) {
                xhr.addEventListener( 'progress', (oEvent) => {
                    if ( oEvent.lengthComputable )
                        progressCB( oEvent.loaded, oEvent.total );
                });
            }
    
            // Result
            let resultBack = (response: DroiHttpResponse) => {

                let error = RemoteServiceHelper.translateDroiError(response, null);
                if (!error.isOk) {
                    reject(error);
                    return;
                }

                resolve(response);
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
                        DroiLog.d("DroiFileApi", ` Output: ${response.data}`);
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
            let header = `multipart/form-data; boundary=${boundary}`;
            xhr.setRequestHeader("Content-Type", header );
            
            //
            xhr.send( cs );
        };
        
        return new Promise<DroiHttpResponse>( promiseHandler );
    }

    private static readonly LOG_TAG = "DroiFileApi";
}


export { RestFile }