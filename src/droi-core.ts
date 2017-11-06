import { DroiPersistSettings } from "./droi-persist-settings"
import { Guid } from "./droi-object"
import { DroiCallback } from "./droi-callback"
import { DroiError } from "./droi-error"
import { RemoteServiceHelper } from "./droi-api"
import { DroiUser } from "./droi-user";
import { DroiObject } from "./droi-object";

const version = "1.0.14";

/**
 * 
 */
class DroiCore {

    /**
     * Initiate DroiCore SDK
     * @param appid The application identifier
     */
    static initializeCore(appid:string, apikey: string) {
        DroiCore.appId = appid;
        DroiCore.apiKey = apikey;
        DroiObject.registerCreateFactory( "_User", ()=>DroiUser.createUser() );
    }

    /**
     * Get the version of DroiCore SDK
     */
    static getVersion() {
        return version;
    }

    /**
     * Get device id
     */
    static getDeviceId(callback?: DroiCallback<string>) : Promise<string> {
        let did = DroiPersistSettings.getItem(DroiPersistSettings.KEY_DEVICE_ID);
        // Already fetched device id.
        if (did) {
            if (callback)
                callback(did, new DroiError(DroiError.OK));
            else {
                return Promise.resolve(did);
            }
        }

        //TODO check Droi Secure
        let isDroiSecureEnabled = false;

        if (!isDroiSecureEnabled) {
            let promise = RemoteServiceHelper.fetchHttpsDeviceId()
                .then( (didFormat) => {
                    DroiPersistSettings.setItem(DroiPersistSettings.KEY_DEVICE_ID, didFormat.string);
                    DroiPersistSettings.setItem(DroiPersistSettings.KEY_DEVICE_ID_HIGH, didFormat.uidh);
                    DroiPersistSettings.setItem(DroiPersistSettings.KEY_DEVICE_ID_LOW, didFormat.uidl);
                    if (callback) {
                        callback(didFormat.string, new DroiError(DroiError.OK));
                    }
                    return didFormat.string;
                })
                .catch ( (error) => {
                    if (callback) {
                        callback(null, error);
                    }
                    return Promise.reject(error);
                });

            if (callback) {
                return null;
            } else {
                return promise;
            }
        }

    }

    /**
     * Get installation id
     */
    static getInstallationId() : string {
        let iid = DroiPersistSettings.getItem(DroiPersistSettings.KEY_INSTALLATION_ID);
        if (!iid) {
            iid = Guid.newGuid();
            DroiPersistSettings.setItem(DroiPersistSettings.KEY_INSTALLATION_ID, iid);
        }

        return iid;
    }

    /**
     * Get application id
     */
    static getAppId(): string {
        return DroiCore.appId;
    }

    /**
     * Get api key
     */
    static getApiKey(): string {
        return DroiCore.apiKey;
    }

    private static appId : string;
    private static apiKey : string;
};

export { DroiCore };