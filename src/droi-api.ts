// Droi rest-apis wrapper
//
// 2 implementation - HTTPS(RestAPI) and DroiSecure HTTP for each api

import { DroiError } from "./droi-error"
import { DroiHttpMethod, DroiHttp, DroiHttpRequest, DroiHttpResponse } from "./droi-http"
import { DroiHttpSecureResponse } from "./droi-secure-http"
import { DroiCallback } from "./droi-callback"
import { DroiCore } from "./droi-core"
import { DroiConstant } from "./droi-const"
import { UINT64 } from "cuint"

export namespace RemoteServiceHelper {
    const KEY_SESSION_TOKEN = "X-Droi-Session-Token";
    const DROI_TOKEN_INVALID = 1040006;
    // const FETCH_DEVICE_ID_URL = "https://api.droibaas.com/uregister?format=hex";
    const FETCH_DEVICE_ID_URL = "http://10.128.81.202/uregister?format=hex";

    export interface HeaderMap {
        [key: string]: string;
    }

    if (!(String.prototype as any).padStart) {
        (String.prototype as any).padStart = function padStart(targetLength,padString) {
            targetLength = targetLength>>0; //floor if number or convert non-number to 0;
            padString = String(padString || ' ');
            if (this.length > targetLength) {
                return String(this);
            }
            else {
                targetLength = targetLength-this.length;
                if (targetLength > padString.length) {
                    padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
                }
                return padString.slice(0,targetLength) + String(this);
            }
        };
    }

    export class DeviceIdFormat {
        private _string: string;
        private _uidh: string;
        private _uidl: string;

        static parse(uidh: string, uidl: string): DeviceIdFormat {
            let format = new DeviceIdFormat();
            let cuidh = UINT64(uidh, 10);
            let cuidl = UINT64(uidl, 10);
            let uuid = cuidh.toString(16).padStart(16, '0') + cuidl.toString(16).padStart(16, '0');
            uuid = `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20, 32)}`
            format._uidh = uidh;
            format._uidl = uidl;
            format._string = uuid;

            return format;
        }

        static parseId(id: string): DeviceIdFormat {
            let part1 = id.substring(0, 16);
            let part2 = id.substring(16);

            let format = new DeviceIdFormat();
            let cuidh = UINT64(part1, 16);
            let cuidl = UINT64(part2, 16);
            let uuid = `${id.substring(0, 8)}-${id.substring(8, 12)}-${id.substring(12, 16)}-${id.substring(16, 20)}-${id.substring(20, 32)}`

            format._uidh = cuidh.toString(10);
            format._uidl = cuidl.toString(10);
            format._string = uuid;

            return format;
        }

        get string(): string {
            return this._string;
        }

        get uidh(): string {
            return this._uidh;
        }

        get uidl(): string {
            return this._uidl;
        }        
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

    export async function callServer(urlPath: string, method: DroiHttpMethod, input: string, headers:HeaderMap, tokenHolder: TokenHolder): Promise<JSON> {
        if (!headers)
            headers = {};

        let request = new DroiHttpRequest();
        request.url = urlPath;
        request.method = method;
        request.data = input;
        request.headers = headers;

        await appendDefaultHeaders(request, tokenHolder);
                
        return DroiHttp.sendRequest(request).then<JSON>(
            (response): JSON => {
                console.log(`Output: ${response.data}`)
                let error = translateDroiError(response, null);
                if (!error.isOk)
                    throw error;

                return JSON.parse(response.data).Result;
            },
        );
    }

    export function callServerSecure(urlPath: string, method: DroiHttpMethod, input: string, headers:HeaderMap, tokenHolder: TokenHolder, callback?: DroiCallback<JSON>): Promise<JSON> {
        return null;
    }

    export function fetchHttpsDeviceId(): Promise<DeviceIdFormat> {
        let request = new DroiHttpRequest();
        request.url = FETCH_DEVICE_ID_URL;
        request.method = DroiHttpMethod.GET;

        return DroiHttp.sendRequest(request)
            .then( (response) => {
                let regex = /.*\[\"([0-9A-Z]+)\",\s*(\d+)/g;
                let match = regex.exec(response.data);
                return DeviceIdFormat.parseId(match[1]);
            });
    }

    async function appendDefaultHeaders(request: DroiHttpRequest, tokenHolder: TokenHolder) {
        request.headers[DroiConstant.DROI_KEY_HTTP_APP_ID] = DroiCore.getAppId();
        request.headers[DroiConstant.DROI_KEY_HTTP_API_KEY] = DroiCore.getApiKey();
        
        try {
            request.headers[DroiConstant.DROI_KEY_HTTP_DEVICE_ID] = await DroiCore.getDeviceId();
        } catch (e) {
            console.log(`get device id fail. ${e}`);
        }

        // set token
        if (tokenHolder) {
            let token = tokenHolder.token;
            if (token && token != "") {
                request.headers[KEY_SESSION_TOKEN] = token;
            }
        }    
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
