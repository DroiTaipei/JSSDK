// DroiSecure http implemention

import { DroiError } from "./droi-error"
import { DroiHttpResponse, DroiHttpRequest } from "./droi-http";

export class DroiHttpSecureResponse extends DroiHttpResponse {
    droiStatusCode: number;
    requestId: string;
}

export class DroiHttpSecure {    
    
    static isEnable(): boolean {
        return false;
    }

    static getUId(): Promise<Array<string>> {
        return Promise.reject("not implemented");
    }

    static async sendRequest(request: DroiHttpRequest): Promise<DroiHttpSecureResponse> {
        return Promise.reject("not implemented");
    }
}
