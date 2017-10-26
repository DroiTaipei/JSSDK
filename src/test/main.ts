
import * as DroiBaas from '../index';

import * as xmlhttprequst from "xmlhttprequest"
DroiBaas.DroiHttp["XMLHttpRequest"] = xmlhttprequst.XMLHttpRequest;
// declare var global: any
// global["XMLHttpRequest"] = xmlhttprequst.XMLHttpRequest;
 
let request = new DroiBaas.DroiHttpRequest();
request.url = "http://2www.google.com";
request.method = DroiBaas.DroiHttpMethod.GET;

DroiBaas.DroiHttp.sendRequest(request, (resp: DroiBaas.DroiHttpResponse, error: DroiBaas.DroiError) => {
    console.log(resp);
    console.log(error);
});