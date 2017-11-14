import { DroiHttp, DroiHttpMethod, DroiHttpRequest, DroiHttpResponse } from './src/droi-http'

let req = new DroiHttpRequest();
req.method = DroiHttpMethod.GET;
req.url = "http://www6.google.com:3023";

DroiHttp.sendRequest(req).then( (resp) => {
    console.log(`status: ${resp.status}`);
}).catch( (error) => {
    console.log(`Error: ${error}`);
    console.log(JSON.stringify(error));
});
