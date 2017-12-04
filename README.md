# DroiBaaS SDK for JS

## How to run test

### NodeJS

```
> yarn install
> yarn test
```

### Browser

```
> yarn install
> yarn test-browser
Bind port 5000, Please browse http://localhost:5000 for testing
```

## Supports WeApp (微信小程序)

Copy droi-baas-weapp-min.js to app utils folder.

``` javascript
const DroiBaaS = require('../../utils/droi-baas-weapp-min.js');
DroiBaaS.DroiCore.initializeCore(APPID, APIKEY);
...
```

## Supports ReactJS / VueJS

``` javascript
import * as DroiBaaS from 'droibaas-jssdk'

DroiBaaS.DroiCore.initializeCore(APPID, APIKEY);
...
```