// Persist data 

export class DroiPersistSettings {
    static readonly KEY_DEVICE_ID = "did";
    static readonly KEY_DEVICE_ID_HIGH = "didu";
    static readonly KEY_DEVICE_ID_LOW = "didl";
    static readonly KEY_INSTALLATION_ID = "iid";
    static readonly KEY_SAVED_USER = "susr";
    static readonly KEY_IPLIST = "ipl";
    static readonly KEY_KLKEY = "kkl";
    static readonly KEY_KL_TIMESTAMPV2 = "klt2";
    static readonly KEY_PREFERENCE = "dcp";

    static getItem(key: string): string {
        return localStorage.getItem(key);
    }

    static setItem(key: string, value: string) {
        localStorage.setItem(key, value);
    }

    static removeItem(key: string) {
        localStorage.removeItem(key);
    }
}