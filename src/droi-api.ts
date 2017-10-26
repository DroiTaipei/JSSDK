// Droi rest-apis wrapper
//
// 2 implementation - HTTPS(RestAPI) and DroiSecure HTTP for each api

import DroiError from "./droi-error"
import * as xhr from "xmlhttprequest"
let XMLHttpRequest = xhr.XMLHttpRequest;

namespace RemoteServiceHelper {
    export interface HeaderMap {
        [key: string]: string;
    }

    export class TokenHolder {
        static AUTO_TOKEN = new TokenHolder("", true);

        private token: string;
        private isAuto: boolean;

        private constructor(token: string, isAuto: boolean) {
            this.token = token;
            this.isAuto = isAuto;
        }

        private make(token: string): TokenHolder {
            return new TokenHolder(token, false);
        }
    }

    export function callServer(urlPath: string, method: string, input: string, headers:HeaderMap, tokenHolder: TokenHolder, error: DroiError): string {
        let xtr = new 
        XMLHttpRequest();
        return "    ";
    }
}

RemoteServiceHelper.callServer("", "", "", null, null, null);