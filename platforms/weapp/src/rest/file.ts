import { RemoteServiceHelper } from "../droi-api"
import { DroiError } from "../droi-error"
import { DroiCore } from "../index";
import { DroiHttpMethod, DroiHttp, DroiHttpRequest, DroiHttpResponse } from "../droi-http"
import { DroiLog } from "../droi-log"
import { DroiHttpSecure } from "../droi-secure-http"
import * as Request from "superagent"

declare var wx: any;

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
        let secureAvaiable = DroiHttpSecure.isEnable();
        
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
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let url = `${secureAvaiable?RestFile.REST_HTTP_SECURE:RestFile.REST_HTTPS}/${objectId}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;

        return callServer(url, DroiHttpMethod.DELETE, "", null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN).then( (_) => {
            return new DroiError( DroiError.OK );
        });
    }

    getUploadToken( objectId: string, name: string, mimeType: string, size: number, md5: string, newFile: boolean ): Promise< JSON > {

        DroiLog.d( RestFile.LOG_TAG, "getUploadToken");
        let secureAvaiable = DroiHttpSecure.isEnable();
        
        let url = (secureAvaiable||!newFile) ? `${secureAvaiable?RestFile.REST_HTTP_SECURE:RestFile.REST_HTTPS}/${objectId}` : `${secureAvaiable?RestFile.REST_HTTP_SECURE:RestFile.REST_HTTPS}`;
        let callServer = secureAvaiable ? RemoteServiceHelper.callServerSecure : RemoteServiceHelper.callServer;
        let method = secureAvaiable ? DroiHttpMethod.PUT : (newFile?DroiHttpMethod.POST:DroiHttpMethod.PATCH);

        let input = JSON.stringify({ "Name":name, "Type":mimeType, "Size":size, "MD5":md5 });
        return callServer(url, method, input, null, RemoteServiceHelper.TokenHolder.AUTO_TOKEN).then( (res) => {
                res = res as JSON;
                
                let fileToken = res["Token"];
                let uploadUrl = res["UploadUrl"];
                let sessionId = res["SessionId"];
                if ( fileToken === undefined || uploadUrl === undefined)
                    throw new DroiError(DroiError.UPLOAD_FAILED, "Token or Upload url is empty.");
                return res;
        });
    }

    upload( uploadUrl: string, fileToken: string, sessionId: string, objectId: string, name: string, path:string, progressCB: (currentSize: number, totalSize: number) => void ): Promise<DroiHttpResponse> {
        return new Promise( (resolve, reject) => {
            let formData = {
                'key': name,
                'token': fileToken,
                'x:AppId': DroiCore.getAppId(),
                'x:Id': objectId,
                'x:SessionId': sessionId
            };
    
            let task = wx.uploadFile({
                url: uploadUrl,
                filePath: path,
                name: 'file',
                formData: formData,
                success: (res) => {
                    let response = new DroiHttpResponse();
                    response.status = res.statusCode;
                    response.data = res.data;
                    resolve(response);
                },
                fail: (err) => {
                    reject(err);
                }
            });
    
            task.onProgressUpdate( (res) => {
                progressCB(res.totalBytesSent, res.totalBytesExpectedToSend);
            });
        });   
    }
    private static readonly LOG_TAG = "DroiFileApi";
}

export { RestFile }