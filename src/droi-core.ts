
const version = "1.0.13";

//TODO: Read data from local storage

/**
 * 
 */
class DroiCore {

    /**
     * Initiate DroiCore SDK
     * @param appid The application identifier
     */
    static initializeCore(appid:string) {
        DroiCore.appId = appid;
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
    static getDeviceId() : string {
        return DroiCore.deviceId;
    }

    /**
     * Get installation id
     */
    static getInstallationId() : string {
        return DroiCore.installationId;
    }

    private static appId : string;
    private static installationId : string;
    private static deviceId : string;
};

export { DroiCore };