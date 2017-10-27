// DroiSecure http implemention
//
// Windows IE/Edge browser not supported

import { DroiHttpResponse } from "./droi-http"

export class DroiHttpSecureResponse extends DroiHttpResponse {
    errorCode: number;
    droiStatusCode: number;
}