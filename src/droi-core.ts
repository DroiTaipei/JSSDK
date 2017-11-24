import { DroiPersistSettings } from "./droi-persist-settings"
import { DroiCallback } from "./droi-callback"
import { DroiError } from "./droi-error"
import { RemoteServiceHelper } from "./droi-api"
import { DroiUser } from "./droi-user";
import { DroiFile } from "./droi-file";
import { Guid, DroiObject } from "./droi-object"
import { DroiGroup } from "./droi-group";

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
        DroiObject.registerCreateFactory( "_File", ()=>DroiFile.createFile() );
        DroiObject.registerCreateFactory( "_Group", ()=>DroiGroup.createGroup() );
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
    static getDeviceId() : Promise<string> {
        let did = DroiPersistSettings.getItem(DroiPersistSettings.KEY_DEVICE_ID);
        // Already fetched device id.
        if (did) {
            return Promise.resolve(did);
        }

        return RemoteServiceHelper.fetchHttpsDeviceId()
            .then( (didFormat) => {
                DroiPersistSettings.setItem(DroiPersistSettings.KEY_DEVICE_ID, didFormat.string);
                DroiPersistSettings.setItem(DroiPersistSettings.KEY_DEVICE_ID_HIGH, didFormat.uidh);
                DroiPersistSettings.setItem(DroiPersistSettings.KEY_DEVICE_ID_LOW, didFormat.uidl);
                return didFormat.string;
            })
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