import { DroiCallback } from "./droi-callback"
import { DroiError } from "./droi-error"
import * as Request from "superagent"
import * as TUTILNS  from "../droi_secure/src";
import { DroiLog } from "./droi-log";
// import * as btoa from "btoa"
// import * as atob from "atob"

let TUTIL = TUTILNS.TUTIL();

export enum DroiHttpMethod {
    GET = "GET", POST = "POST", PUT = "PUT", PATCH = "PATCH", DELETE = "DELETE"
}

export class DroiHttpRequest {
    url: string;
    method: DroiHttpMethod;
    headers?: {[key: string]: string};
    data?: any;
}

export class DroiHttpResponse {
    status: number;
    data?: string;
    headers: {[key: string]: string};
}

export class DroiHttp {

    private static readonly LOG_TAG = "DroiHttp";

    static sendRequest(request: DroiHttpRequest): Promise<DroiHttpResponse> {

       let req = Request(request.method, request.url)
        // let req = Request('POST', 'http://localhost:5432')
            .responseType("arraybuffer");

        // req.set('X-Path', request.url);
        // req.set('X-Method', request.method);

        // let body = {}
        // if (request.data != null) {
        //     body["Body"] = btoa(request.data);
        // }

        // if (request.headers != null) {
        //     body["Header"] = request.headers;
        // }

        // req.send(body);
        
        if (request.headers != null)
            req.set(request.headers);

        if (request.data != null)
            req.send(request.data);

        DroiLog.d(DroiHttp.LOG_TAG, `    Url: ${request.method} ${request.url}`);
        DroiLog.d(DroiHttp.LOG_TAG, `Headers: ${JSON.stringify(request.headers)}`);
        DroiLog.d(DroiHttp.LOG_TAG, `  Input: ${request.data}`);    
            
        return req
            .then( (resp) => {
                let text = TUTIL.bytes_to_string(new Uint8Array(resp.body));
                DroiLog.d(DroiHttp.LOG_TAG, ` Output: ${text}`);
                let response = new DroiHttpResponse();
                response.status = resp.status;
                response.data = text;
                response.headers = resp.header;
                return response;
            })
            .catch( (reason) => {
                let code = DroiError.SERVER_NOT_REACHABLE;
                if (reason.code == "ETIMEDOUT")
                    code = DroiError.TIMEOUT;
                return Promise.reject(new DroiError(code, reason.toString()));
            });
    }
}