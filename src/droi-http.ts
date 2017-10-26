import DroiCallback from "./droi-callback"
import { DroiError } from "./droi-error"

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
    static sendRequest(request: DroiHttpRequest, callback?: DroiCallback<DroiHttpResponse>): Promise<DroiHttpResponse> {

        let promise = new Promise<DroiHttpResponse>( (resolve, reject) => {
            let statusText: string = null;
            let xhr = new XMLHttpRequest();            

            // Arrow function to return response for callback or promise
            let resultBack = (response: DroiHttpResponse) => {
                // callback or promise
                if (callback) {
                    let error: DroiError = new DroiError(DroiError.OK);
                    if (statusText && statusText != "") {
                        error.code = DroiError.ERROR;
                        error.appendMessage = `[HTTPS] ${statusText}`;
                    }

                    callback(response, error);
                } else {
                    if (statusText && statusText != "")
                        reject(statusText);
                    else
                        resolve(response);
                }
            }

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    statusText = xhr.statusText;
                    if (xhr.status != 0 || (statusText && statusText != "")) {
                        let response = new DroiHttpResponse();
                        response.status = xhr.status;
                        response.data = xhr.responseText;
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

            let errorHandler = (e) => {
                // Already handled in Node
                if (statusText && statusText != "") {
                    return;
                }
                
                statusText = `Error type: ${e.type}`;
                let response = new DroiHttpResponse();
                response.status = xhr.status;
                response.data = xhr.responseText;
                resultBack(response);
            };

            xhr.ontimeout = errorHandler;
            xhr.onerror = errorHandler;

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