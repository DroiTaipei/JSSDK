import { DroiCallback } from "./droi-callback"
import { DroiError } from "./droi-error"
import * as Request from "superagent"

export enum DroiHttpMethod {
    GET = "GET", POST = "POST", PUT = "PUT", PATCH = "PATCH", DELETE = "DELETE"
}

export class DroiHttpRequest {
    url: string;
    method: DroiHttpMethod;
    headers?: {[key: string]: string};
    data?: string;
}

export class DroiHttpResponse {
    status: number;
    data?: string;
    headers: {[key: string]: string};
}

export class DroiHttp {
    static sendRequest(request: DroiHttpRequest): Promise<DroiHttpResponse> {

        let req = Request(request.method, request.url)
            .type("application/json")
        
        if (request.headers != null)
            req.set(request.headers);

        if (request.data != null)
            req.send(request.data);

        console.log(`    Url: ${request.method} ${request.url}`);
        console.log(`Headers: ${JSON.stringify(request.headers)}`);
        console.log(`  Input: ${request.data}`);    
            
        return req
            .then( (resp) => {
                console.log(` Output: ${resp.text}`);
                let response = new DroiHttpResponse();
                response.status = resp.status;
                response.data = resp.text;
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