export * from "./droi-permission"
export * from "./droi-core"
export * from "./droi-object"
export * from "./droi-user"
export * from "./droi-query"
export * from "./droi-condition"
export * from "./droi-cloud"
export { DroiHttpMethod } from "./droi-http"
export * from "./droi-error"
export * from "./droi-file"

// trick for bypass typescript checking
declare var require: any;
declare var global: any;
declare var XMLHttpRequest: any;
declare var localStorage: any;

if (typeof XMLHttpRequest === 'undefined') {
    if (typeof global !== 'undefined') {
        global["XMLHttpRequest"] = require("xmlhttprequest").XMLHttpRequest;
    }
}

if (typeof localStorage === 'undefined') {
    if (typeof global !== 'undefined') {
        let storage = require('dom-storage');
        global['localStorage'] = new storage('./data.json', {strict: true});
    }
}