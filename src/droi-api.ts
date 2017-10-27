// Droi rest-apis wrapper
//
// 2 implementation - HTTPS(RestAPI) and DroiSecure HTTP for each api

import { DroiError } from "./droi-error"
import { DroiHttpMethod, DroiHttp, DroiHttpRequest, DroiHttpResponse } from "./droi-http"
import { DroiHttpSecureResponse } from "./droi-secure-http"
import { DroiCallback } from "./droi-callback"

export namespace RemoteServiceHelper {
    const KEY_SESSION_TOKEN = "X-Droi-Session-Token";
    const DROI_TOKEN_INVALID = 1040006;

    export interface HeaderMap {
        [key: string]: string;
    }

    export class TokenHolder {
        static AUTO_TOKEN = new TokenHolder("", true);

        private _token: string;
        private _isAuto: boolean;

        private constructor(token: string, isAuto: boolean) {
            this._token = token;
            this._isAuto = isAuto;
        }

        static make(token: string): TokenHolder {
            return new TokenHolder(token, false);
        }

        get token(): string {
            if (this._isAuto) {
                //TODO return user token
            } else {
                return this._token;
            }
        }
    }

    export function callServer(urlPath: string, method: DroiHttpMethod, input: string, headers:HeaderMap, tokenHolder: TokenHolder): Promise<string> {
        let request = new DroiHttpRequest();
        request.url = urlPath;
        request.method = method;
        request.data = input;
        request.headers = headers;

        // set token
        if (tokenHolder) {
            let token = tokenHolder.token;
            if (token && token != "") {
                request.headers[KEY_SESSION_TOKEN] = token;
            }
        }

        return DroiHttp.sendRequest(request).then<string>(
            (response): string => {
                let error = translateDroiError(response, null);
                if (!error.isOk)
                    throw error;

                return response.data;
            },
        );
    }

    export function callServerSecure(urlPath: string, method: DroiHttpMethod, input: string, headers:HeaderMap, tokenHolder: TokenHolder, callback?: DroiCallback<string>): Promise<string> {
        return null;
    }

    function translateDroiError(resp: DroiHttpResponse, ticket: string): DroiError {
        let retError = new DroiError(DroiError.OK, null, ticket);
        let code = -1;
        let errorCode = 0;
        let droiStatusCode = 0;
        let message = null;

        if (resp.data) {
            try {
                let jdata = JSON.parse(resp.data);
                if (typeof jdata.Code === 'number') {
                    code = jdata.Code;
                    if (code == DROI_TOKEN_INVALID) {
                        //TODO clear user data
                    } 

                    if (typeof jdata.Message === 'string') {
                        message = jdata.Message;
                    }
                }
            } catch (e) {
                // bypass
            }
        }

        if (resp instanceof DroiHttpSecureResponse) {
            errorCode = (resp as DroiHttpSecureResponse).errorCode;
            droiStatusCode = (resp as DroiHttpSecureResponse).droiStatusCode;
        }

        if (code != -1) {
            retError.code = code;
            retError.appendMessage = message;
        } else if (resp.status != 0 && resp.status != 200) {
            let status = resp.status;
            if (status == 404)
                retError.code = DroiError.SERVICE_NOT_FOUND;
            else if (status == 403 || status == 405)
                retError.code = DroiError.SERVICE_NOT_ALLOWED;
            else if (status == 509)
                retError.code = DroiError.BANDWIDTH_LIMIT_EXCEED;
            else {
                retError.code = DroiError.HTTP_SERVER_ERROR;
                retError.appendMessage = `status: ${status}`;
            }
        }
        //TODO Handle error case
        else if (droiStatusCode != 0) {
            retError.code = DroiError.INTERNAL_SERVER_ERROR;
            retError.appendMessage = `server code: ${droiStatusCode}`;
        } else {
            retError.code = DroiError.ERROR;
            retError.appendMessage = `http status: ${resp.status} errorCode: ${errorCode} status: ${droiStatusCode}`;
        }

        return retError;
    }
}
