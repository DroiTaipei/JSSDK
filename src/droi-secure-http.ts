// DroiSecure http implemention

import { DroiHttpResponse, DroiHttpMethod, DroiHttpRequest, DroiHttp } from "./droi-http"
import * as TUTILNS from "../droi_secure/src"
import { DroiError, DroiCore, DroiObject } from "./index"
import { DroiPersistSettings } from "./droi-persist-settings"
import { DroiLog } from "./droi-log";
import * as UINT from "cuint"
import { DroiConstant } from "./droi-const";

let TUTIL = TUTILNS.TUTIL();

interface SecureRefreshResult {
    error: DroiError;
    droiStatus: number;
}

class IpElement {
    ip: string;
    port: string;
    name: string;
    weight: number;
    listPos: number;

    toJson(): {[key: string]: string} {
        return {IP: this.ip, Port: this.port, Name: this.name, Weight: String(this.weight)};
    }

    isValid(): boolean {
        return this.ip != null && this.ip.length > 0;
    }
}

class IpList {
    private static readonly LOG_TAG = "IpList";

    static load(): IpList {
        let ipl = DroiPersistSettings.getItem(DroiPersistSettings.KEY_IPLIST);
        if (ipl == null)
            return null;

        return IpList.parse(ipl);
    }

    static refresh(appId: string): Promise<IpList> {
        let req = new DroiHttpRequest();
        req.url = `${DroiConstant.IP_LIST_URL}?appid=${appId}`;
        req.method = DroiHttpMethod.GET;

        return DroiHttp.sendRequest(req).then( (resp) => {
            if (resp.status != 200)
                throw new DroiError(DroiError.SERVER_NOT_REACHABLE, `http statue: ${resp.status}`);

            return IpList.parse(resp.data);
        });
    }

    static parse(ipl: string): IpList {
        let jip: JSON = null;
        try {
            jip = JSON.parse(ipl);
        } catch ( jsonErr ) {
            DroiLog.e(IpList.LOG_TAG, `parse json error. ${ipl}`);
            return null;
        }

        let count = Number(jip["Total"]);
        if (isNaN(count) || count == 0)
            return null;

        let ipList = new IpList();
        ipList.version = jip["Version"];
        if (Number(ipList.version) < 3)
            return null;
        
        let timestamp = UINT.UINT64(jip["Timestamp"]);
        let expireTime = UINT.UINT64(jip["Expire"]);

        let timeDiff = expireTime.clone().subtract(timestamp);
        let localNow = UINT.UINT64(String(Date.now()));
        if (!jip["LocalCache"]) {
            if (timestamp.greaterThan(localNow))
                DroiObject.TIME_SHIFT = Number(timestamp.clone().subtract(localNow).toString());
            else
                DroiObject.TIME_SHIFT = Number(localNow.clone().subtract(timestamp).toString());
            expireTime = localNow.clone().add(timeDiff);
        }

        ipList.createTime = timestamp;
        ipList.expiredTime = expireTime;

        if (jip["ZoneCode"])
            ipList.zoneCode = jip["ZoneCode"];
        if (jip["Order"])
            ipList.order = Number(jip["Order"]);
        else
            ipList.order = 0;

        ipList.ipList = {};

        let jList = jip["List"];
        for (let i=0; i<count; ++i) {
            let jitems = jList[String(i)];
            let ipes = Array<IpElement>(jitems.length);
            for (let j=0; j<jitems.length; ++j) {
                let jitem = jitems[j];
                let ipe = new IpElement();
                ipe.ip = jitem["IP"];
                ipe.port = jitem["Port"];
                ipe.name = jitem["Name"];
                ipe.weight = Number(jitem["Weight"]);
                ipe.listPos = j;
                ipes[j] = ipe;
            }
            ipList.ipList[String(i)] = ipes;
        }

        return ipList;
    }

    save() {
        let jobj: {[key: string]: any} = {
            Total: String(Object.keys(this.ipList).length),
            Version: this.version,
            Timestamp: this.createTime.toString(),
            Order: this.order,
            LocalCache: true
        };

        if (this.expiredTime != null)
            jobj["Expire"] = this.expiredTime.toString();
        if (this.zoneCode != null)
            jobj["ZoneCode"] = this.zoneCode;

        let jips: {[key: string]: Array<{[key: string]: string}>} = {};
        for (let i in this.ipList) {
            let ipes = this.ipList[i];
            let jobjs: Array<{[key: string]: string}> = [];
            for (let ipe of ipes) {
                jobjs.push(ipe.toJson());
            }
            jips[i] = jobjs;
        }

        jobj["List"] = jips;

        let json = JSON.stringify(jobj);
        DroiPersistSettings.setItem(DroiPersistSettings.KEY_IPLIST, json);
    }

    getCurrent(): IpElement {
        if (this.ipList == null || Object.keys(this.ipList).length == 0)
            return null;
        if (this.currentIpElement != null)
            return this.currentIpElement;

        if (this.order >= Object.keys(this.ipList).length)
            this.order = 0;

        let ipes = this.ipList[String(this.order)];
        let weight = Math.random() * 1000;
        let cw = 0;

        let focus: IpElement = null;

        for (let ipe of ipes) {
            cw = cw + ipe.weight;
            if (weight < cw) {
                focus = ipe;
                this.currentIpElement = ipe;
                break;
            }
        }

        return focus;
    }

    nextServer() {
        if (this.currentIpElement == null)
            return;
        let curr = this.currentIpElement;
        this.currentIpElement = null;

        let pos = curr.listPos;
        if (pos >= Object.keys(this.ipList).length)
            return;

        let ipes = this.ipList[String(pos)];
        let found = false;
        for (let i=ipes.length-1; i>=0; --i) {
            let ipe = ipes[i];
            if (ipe === curr) {
                delete ipes[i];
                found = true;
                break;
            }
        }

        if (!found)
            return false;

        if (Object.keys(ipes).length == 0) {
            while (this.ipList[String(this.order)].length <= 0) {
                this.order = this.order + 1;
                if (this.order >= Object.keys(this.ipList).length) {
                    this.order = 0;
                    this.invalidate();
                    return;
                }
            }
            this.save();
            return;
        }

        let weight = curr.weight / ipes.length;
        for (let ipe of ipes) {
            ipe.weight += weight;
        }

        this.save();
    }

    invalidate() {
        this.expiredTime = null;
        this.save();
    }

    get isValid(): boolean {
        if (this.ipList == null || Object.keys(this.ipList).length == 0 || this.expiredTime == null)
            return false;

        if (this.zoneCode == null || this.zoneCode.length == 0)
            return false;

        let now = Date.now();
        let expire = Number(this.expiredTime.toString());

        if (now >= expire)
            return false;

        for (let i in this.ipList) {
            let ipes = this.ipList[i];
            for (let ipe of ipes) {
                if (!ipe.isValid())
                    return false;
            }
        }

        return true;
    }

    version: string;
    createTime: UINT.UINT64;
    expiredTime: UINT.UINT64;
    zoneCode: string;
    order: number;
    ipList: {[key: string]: Array<IpElement>} = {};
    currentIpElement: IpElement;
}

export class DroiHttpSecureResponse extends DroiHttpResponse {
    droiStatusCode: number;
}

export class DroiHttpSecure {    
    
    private static DROI_SECURE_ENABLE = false;
    private static DROI_SECURE_CHECKED = false;
    private static readonly LOG_TAG = "DroiSecure";

    static isEnable(): boolean {
        if (!DroiHttpSecure.DROI_SECURE_CHECKED) {
            DroiHttpSecure.DROI_SECURE_CHECKED = true;
            DroiHttpSecure.DROI_SECURE_ENABLE = TUTIL.selfTesting();
        }
        return DroiHttpSecure.DROI_SECURE_ENABLE;
    }

    static async sendRequest(request: DroiHttpRequest): Promise<DroiHttpSecureResponse> {
        // Reject if not support droi secure
        if (!DroiHttpSecure.isEnable()) {
            return Promise.reject(new DroiError(DroiError.DROI_SECURE_NOT_SUPPORT));
        }

        let appId = DroiCore.getAppId();
        //TODO validate app id

        let error = new DroiError(DroiError.OK);
        let ipList: IpList = null;
        try {
            ipList = await DroiHttpSecure.pickIpList(appId);
        } catch ( err ) {
            error = err;
        }

        let response = new DroiHttpSecureResponse();
        let rb_error = false;
        for (let retryTimes = 0; retryTimes < 2; ++retryTimes) {
            // Retry iplist
            if (IpList == null) {
                try {
                    error.code = DroiError.OK;
                    ipList = await DroiHttpSecure.pickIpList(appId);
                } catch ( err ) {
                    error = err;
                }
                continue;
            }

            if (!error.isOk)
                continue;

            // Local time check
            if (Math.abs(DroiObject.TIME_SHIFT) > DroiConstant.TIME_DIFF_THRESHOLD) {
                error = new DroiError(DroiError.TIME_UNCORRECTED);
                break;
            }

            let ipElement = ipList.getCurrent();
            if (ipElement == null) {
                error = new DroiError(DroiError.SERVER_NOT_REACHABLE, "no valid ip element");
                ipList.invalidate();
                continue;
            }

            let method = request.method;
            // Clean data if method GET / DELETE
            if (method == DroiHttpMethod.GET || method == DroiHttpMethod.DELETE)
                request.data = null;

            let dataBuffer: Uint8Array = null;
            let inputBuffer: Uint8Array = null;
            let isCompressed = true;

            // Compress data
            if (request.data != null) {
                dataBuffer = TUTIL.string_to_bytes(request.data);
                inputBuffer = TUTIL.compressDeflater(dataBuffer);
                if (inputBuffer == null) {
                    error = new DroiError(DroiError.ERROR, "compress fail.");
                    break;
                }
                // Using original buffer if compression ratio > 100%
                if (inputBuffer.length >= dataBuffer.length) {
                    inputBuffer = dataBuffer;
                    isCompressed = false;
                }
            }

            // Check to refresh key
            let keyInvalid = DroiHttpSecure.isKeyInvalid();
            let timeValid = TUTIL.timeStampIsValid();

            // Load cached timestamp first
            if (!timeValid) {
                let headerTimestamp = DroiPersistSettings.getItem(DroiPersistSettings.KEY_KL_TIMESTAMPV2);
                if (headerTimestamp != null) {
                    TUTIL.setTimeStampHeader(headerTimestamp);
                    timeValid = TUTIL.timeStampIsValid();
                }
            }

            if (keyInvalid || !timeValid) {
                if (keyInvalid)
                    TUTIL.setFakeKlKeyUID_u_UID_l(TUTIL.getKlKeyUID_u().toString(), TUTIL.getKlKeyUID_l().toString());
                else if (!timeValid)
                    DroiHttpSecure.invalidAndEraseKey();

                let refreshResult = await DroiHttpSecure.refreshKey(ipElement, true);
                if (!refreshResult.error.isOk) {
                    error = refreshResult.error;
                    response.droiStatusCode = refreshResult.droiStatus;
                    if (refreshResult.droiStatus == DroiConstant.X_DROI_STAT_ZONECODE_EXPIRED || refreshResult.droiStatus == DroiConstant.X_DROI_STAT_ZONE_EXPIRED_INVALID || refreshResult.droiStatus == DroiConstant.X_DROI_STAT_ZONECODE_MISSING) {
                        ipList.zoneCode = null;
                        ipList.invalidate();
                    }
                    ipList.nextServer();
                    continue;
                }
            }

            let req = new DroiHttpRequest();
            req.method = request.method;
            req.url = DroiHttpSecure.getURLWithRequest(request, ipElement);
            req.headers = JSON.parse(JSON.stringify(request.headers));

            let kid = TUTIL.getKlKeyID().toString(); // UINT64
            let ktype = TUTIL.getKlKeyType();
            let kver = TUTIL.getKlKeyVersion();
            let rsaver = TUTIL.rsaKeyVersion;
            let uidu = TUTIL.getKlKeyUID_u().toString(); // UINT64
            let uidl = TUTIL.getKlKeyUID_l().toString(); // UINT64
            let dataLen = dataBuffer == null ? 0 : dataBuffer.length;

            let encoding = "Droi";
            if (isCompressed)
                encoding = encoding + "-gzip";
    
            req.headers["Content-Type"] = "application/octet-stream";
            req.headers[DroiConstant.HTTP_HEADER_DROI_ID] = DroiHttpSecure.setDroiHttpRequestHeader(kid, ktype, kver, DroiConstant.COMMUNICATION_PROTOCOL_VERSION, rsaver, dataLen, uidu, uidl);
            req.headers[DroiConstant.HTTP_HEADER_CONTENT_ENCODING] = encoding;
            req.headers["Accept-Encoding"] = "gzip";
            if (ipList.zoneCode)
                req.headers[DroiConstant.HTTP_HEADER_DROI_ZC] = ipList.zoneCode;
            let headerTs = TUTIL.getTimeStampHeader();
            req.headers[DroiConstant.HTTP_HEADER_DROI_TS] = headerTs;

            let encBuffer: Uint8Array = null;
            if (inputBuffer != null) {
                encBuffer = DroiHttpSecure.encodeBuffer(inputBuffer, headerTs);

                // Encrypt fail. Clear cache key and retry again.
                if (encBuffer == null) {
                    DroiHttpSecure.invalidAndEraseKey();
                    error.code = DroiError.ERROR;
                    error.appendMessage = "encrypt data fail.";
                    continue;
                }
                req.data = Buffer.from(encBuffer.buffer);
            }

            DroiLog.d(DroiHttpSecure.LOG_TAG, `  Input: ${request.data}`);
            // send Http Request
            let resp: DroiHttpResponse = null;
            try {
                resp = await DroiHttp.sendRequest(req);
            } catch ( err ) {
                error = err;
                if (error.code == DroiError.TIMEOUT)
                    break;
                else
                    continue;
            }

            let status = resp.status;
            let droiStatus = Number(resp.headers[DroiConstant.HTTP_HEADER_DROI_STATUS.toLowerCase()] || "-999");
            let drid = resp.headers[DroiConstant.HTTP_HEADER_REQUEST_ID.toLowerCase()] || "";
            let outEncoding = resp.headers[DroiConstant.HTTP_HEADER_CONTENT_ENCODING.toLowerCase()];
            let outData = resp.data;

            if (droiStatus < 0) {
                let needRetry = true;
                switch (droiStatus) {
                    // Zone code error, just invalidate zonecode
                    case DroiConstant.X_DROI_STAT_ZONE_EXPIRED_INVALID:
                    case DroiConstant.X_DROI_STAT_ZONECODE_EXPIRED:
                    case DroiConstant.X_DROI_STAT_ZONECODE_MISSING:
                        ipList.zoneCode = null;
                        ipList.invalidate();
                        break;
                    // Just retry, do not validate again.
                    case DroiConstant.X_DROI_STAT_ILLEGAL_CLIENT_KEY:
                    case DroiConstant.X_DROI_STAT_BACKEND_NETWORK_ERROR:
                    case DroiConstant.X_DROI_STAT_RSA_PUBKEY_ERROR:
                        break;
                    // Attack! just return or No retry and not clear key
                    case DroiConstant.X_DROI_STAT_RB_TS_VERIFY_ERROR:
                    case DroiConstant.X_DROI_STAT_RB_LZ4_DECOMPRESS_ERROR:
                        needRetry = false;
                        break;
                    // Timestamp timeout.
                    case DroiConstant.X_DROI_STAT_KEY_SERVER_ISSUE_REKEY:
                    case DroiConstant.X_DROI_STAT_TS_TIMEOUT:
                        TUTIL.setTimeStampValid(false);
                        DroiPersistSettings.removeItem(DroiPersistSettings.KEY_KL_TIMESTAMPV2);
                        break;
                    case DroiConstant.X_DROI_STAT_RB_DECRYPT_ERROR:
                    case DroiConstant.X_DROI_STAT_RB_GUNZIP_ERROR:
                        if (rb_error)
                            needRetry = false;
                        else {
                            DroiHttpSecure.invalidAndEraseKey();
                            rb_error = true;
                        }
                        break;
                    default:
                        DroiHttpSecure.invalidAndEraseKey();
                        break;
                }

                if (needRetry)
                    continue;
                else
                    break;
            }

            if (outEncoding == null) {
                error.code = DroiError.ERROR;
                error.appendMessage = "No response encoding.";
                break;
            }

            try {
                if (outData != null) {
                    encBuffer = TUTIL.string_to_bytes(outData);
                    let decBuffer = TUTIL.aesDecrypt(encBuffer);
                    if (outEncoding.indexOf("gzip") > 0) {
                        decBuffer = TUTIL.decompress(decBuffer);
                    }
                    resp.data = TUTIL.bytes_to_string(decBuffer);
                }
            } catch ( error ) {
                error.code = DroiError.ERROR;
                error.appendMessage = error.toString();
                DroiHttpSecure.invalidAndEraseKey();
                continue;
            }

            response.status = status;
            response.droiStatusCode = droiStatus;
            response.headers = JSON.parse(JSON.stringify(resp.headers));
            response.data = resp.data;

            DroiLog.d(DroiHttpSecure.LOG_TAG, ` Output: ${response.data}`);

            error.code = DroiError.OK;
            error.appendMessage = null;
            break;
        }

        if (!error.isOk) {
            return Promise.reject(error);
        } else {
            return Promise.resolve(response);
        }
    }

    static refreshKey(ipElement: IpElement, needStore: boolean): Promise<SecureRefreshResult> {
        let n1 = Math.ceil(Math.random() * 4294967295) & 0xffffffff;
        let data = TUTIL.genKeyValidationNonce(n1);
        if (data == null)
            return Promise.resolve({error: new DroiError(DroiError.ERROR, "gen nonce fail."), droiStatus: -999});

        let kid = TUTIL.getKlKeyID().toString(); // UINT64
        let ktype = TUTIL.getKlKeyType();
        let kver = TUTIL.getKlKeyVersion();
        let rsaver = TUTIL.rsaKeyVersion;
        let uidu = TUTIL.getKlKeyUID_u().toString(); // UINT64
        let uidl = TUTIL.getKlKeyUID_l().toString(); // UINT64

        let headers = {};
        headers["Content-Type"] = "application/octet-stream";
        headers[DroiConstant.HTTP_HEADER_DROI_ID] = DroiHttpSecure.setDroiHttpRequestHeader(kid, ktype, kver, DroiConstant.COMMUNICATION_PROTOCOL_VERSION, rsaver, data.length, uidu, uidl);
        let request = new DroiHttpRequest();
        request.url = DroiHttpSecure.getValidateURL(ipElement);
        request.method = DroiHttpMethod.POST;
        request.data = Buffer.from(data.buffer);
        request.headers = headers;
        
        return DroiHttp.sendRequest(request).then( (resp) => {
            let droiStatus = -999;
            if (resp.headers[DroiConstant.HTTP_HEADER_DROI_STATUS.toLowerCase()])
                droiStatus = Number(resp.headers[DroiConstant.HTTP_HEADER_DROI_STATUS.toLowerCase()]);
            let drid = resp.headers[DroiConstant.HTTP_HEADER_REQUEST_ID.toLowerCase()];

            let error = new DroiError(DroiError.OK);

            if (droiStatus == DroiConstant.DROI_STATUS_CORRECT) {
                let res = TUTIL.chkKeyValidationCorrectNonce(n1, TUTIL.string_to_bytes(resp.data));
                if (!res) {
                    error.code = DroiError.ERROR;
                    error.appendMessage = "validate correct nonce fail.";
                }
            } else if (droiStatus == DroiConstant.DROI_STATUS_FAILED && resp.headers[DroiConstant.HTTP_HEADER_DROI_OTP.toLowerCase()]) {
                let xor = Number(resp.headers[DroiConstant.HTTP_HEADER_DROI_OTP.toLowerCase()]);
                let res = TUTIL.chkKeyValidationFailedNonce(n1, xor, TUTIL.string_to_bytes(resp.data));
                if (!res) {
                    error.code = DroiError.ERROR;
                    error.appendMessage = "validate fail nonce fail.";
                }
            } else {
                error.code = DroiError.ERROR;
                error.appendMessage = "validate fail. dstatus = " + droiStatus;
            }

            if (error.isOk && needStore) {
                DroiHttpSecure.storeKlKey();
            }
            
            if (resp.headers[DroiConstant.HTTP_HEADER_DROI_TS.toLowerCase()]) {
                let headerTimestamp = resp.headers[DroiConstant.HTTP_HEADER_DROI_TS.toLowerCase()];
                TUTIL.setTimeStampHeader(headerTimestamp);
                let timestamp: UINT.UINT64 = TUTIL.decryptTimeStamp(headerTimestamp);
                let now = UINT.UINT64(String(Date.now()));
                if (timestamp.greaterThan(now))
                    DroiObject.TIME_SHIFT = Number(timestamp.clone().subtract(now).toString());
                else
                    DroiObject.TIME_SHIFT = Number(now.clone().subtract(timestamp).toString());
                DroiPersistSettings.setItem(DroiPersistSettings.KEY_KL_TIMESTAMPV2, headerTimestamp);
            } else {
                error.code = DroiError.ERROR;
                error.appendMessage = "validate fail. no timestamp";
            }

            return {error: error, droiStatus: droiStatus};
        }).catch( (error) => {
            return Promise.resolve({error: error, droiStatus: -999});
        });
    }

    static encodeBuffer(data: Uint8Array, headerTs: string): Uint8Array {
        let outbuffer = TUTIL.addTimeStampToData(headerTs, data);
        return TUTIL.aesEncrypt(outbuffer);
    }

    static setDroiHttpRequestHeader(kid: string, ktype: number, kver: number, commver: number, rsaver: number, length: number, uidu: string, uidl: string): string {
        let uidType = 2;
        return `${kid},${ktype},${kver},${commver},${rsaver},${length},${uidu},${uidl},${uidType}`;
    }

    static getURL(ip: string, port: string, resource: string) {
        return `http://${ip}:${port}${resource}`;
    }

    static getValidateURL(ipElement: IpElement): string {
        return DroiHttpSecure.getURL(ipElement.ip, ipElement.port, DroiConstant.VALIDATE_RESOURCE);
    }

    static getURLWithRequest(request: DroiHttpRequest, ipElement: IpElement) {
        return DroiHttpSecure.getURL(ipElement.ip, ipElement.port, request.url);
    }

    static pickIpList(appId: string): Promise<IpList> {
        let ipList = IpList.load();

        if (ipList == null || !ipList.isValid || ipList.zoneCode == null) {
            return IpList.refresh(appId).then( (ipl) => {
                if (ipl != null && ipl.isValid) {
                    ipl.save();
                    return Promise.resolve(ipl);
                } else {
                    let code = DroiError.SERVER_NOT_REACHABLE;
                    if (ipl != null && (ipl.zoneCode == null || ipl.zoneCode.length == 0))
                        code = DroiError.APPLICATION_ID_UNCORRECTED;
                    return Promise.reject(new DroiError(code, "in IpList"));
                }    
            });
        } else {
            return Promise.resolve(ipList);
        }            
    }

    static isKeyInvalid(): boolean {
        return (!TUTIL.getKlKeyIsValid() || TUTIL.getKlKeyType() == 0) && (!DroiHttpSecure.eraseAndAllocKlKey() || !TUTIL.getKlKeyIsValid());
    }

    static eraseAndAllocKlKey(): boolean {
        TUTIL.klKeyFree();
        let keystr = DroiPersistSettings.getItem(DroiPersistSettings.KEY_KLKEY);
        if (!keystr)
            return false;

        TUTIL.klKeyAlloc(TUTIL.base64_to_bytes(keystr));
        return true;
    }

    static invalidAndEraseKey() {
        TUTIL.setKlKeyInvalid();
        DroiHttpSecure.storeAndEraseKlKey();
    }

    static storeAndEraseKlKey() {
        DroiHttpSecure.storeKlKey();
        TUTIL.klKeyFree();
    }

    static storeKlKey() {
        let data = TUTIL.klKeyGet();
        let outStr = TUTIL.bytes_to_base64(data);
        DroiPersistSettings.setItem(DroiPersistSettings.KEY_KLKEY, outStr);
    }
}
