"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var droi_http_1 = require("./src/droi-http");
var req = new droi_http_1.DroiHttpRequest();
req.method = droi_http_1.DroiHttpMethod.GET;
req.url = "http://www6.google.com";
droi_http_1.DroiHttp.sendRequest(req).then(function (resp) {
    console.log("status: " + resp.status);
}).catch(function (error) {
    console.log("Error: " + error);
    console.log(JSON.stringify(error));
});
