import DroiCallback from "./droi-callback"
import * as xhr from "xmlhttprequest"
let XMLHttpRequest = xhr.XMLHttpRequest;

enum DroiHttpMethod {
    GET = "GET", POST = "POST", PUT = "PUT", PATCH = "PATCH", DELETE = "DELETE"
}

class DroiHttpRequest {
    url: string;
    method: DroiHttpMethod;
    headers?: {[key: string]: string};
    data?: string;
}

class DroiHttpResponse {
    status: number;
    data?: string;
    headers: {[key: string]: string};
}

class DroiHttp {
    sendRequest(request: DroiHttpRequest, callback?: DroiCallback<DroiHttpResponse>): Promise<DroiHttpResponse> {
        let promise = new Promise<DroiHttpResponse>( (resolve, reject) => {
            let xhr = new XMLHttpRequest();
            let statusText: string = null;

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    statusText = xhr.statueText;
                    if (xhr.status != 0 || (statusText && statusText != "")) {
                        let response = new DroiHttpResponse();
                        response.status = xhr.status;
                        response.data = xhr.responseText;
                        let allheaders = xhr.getAllResponseHeaders().split("\r\n");
                        let headers: {[key: string]: string} = {};
                        response.headers = headers;

                        for (let header of allheaders) {
                            let parts = header.split(":");
                            headers[parts[0].trim()] = parts[1].trim();
                        }
                        if (callback) {
                            callback(response, null);
                        } else {
                            resolve(response);
                        }
                    }
                }
            };

            xhr.ontimeout = (e) => {

            };

            xhr.onerror = (e) => {

            };

            // Init connection
            xhr.open(request.method, request.url);

            // Put headers
            if (request.headers) {
                for (let key of Object.keys(request.headers)) {
                    xhr.setRequestHeader(key, request.headers[key]);
                }
            }

            // Send request
            xhr.send(request.data);
        } );
        return promise;
    }
}