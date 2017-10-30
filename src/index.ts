export * from "./droi-permission";
export * from "./droi-core";
export * from "./droi-object";
export { DroiHttpMethod } from "./droi-http"
export * from "./droi-error"

// trick for bypass typescript checking
declare var require: any;
declare var global: any;
declare var XMLHttpRequest: any;

if (typeof XMLHttpRequest === 'undefined') {
    if (typeof global !== 'undefined') {
        global["XMLHttpRequest"] = require("xmlhttprequest").XMLHttpRequest;
    }
}
