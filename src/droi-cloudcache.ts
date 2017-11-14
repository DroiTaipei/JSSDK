import { DroiError } from "./droi-error";

export class DroiCloudCache {
    private static INSTANCE: DroiCloudCache = null;
    
    static instance(): DroiCloudCache {
        if (DroiCloudCache.INSTANCE == null)
            DroiCloudCache.INSTANCE = new DroiCloudCache();

        return DroiCloudCache.INSTANCE;
    }

    getValue(key: string): Promise<string> {
        return null;
    }

    setValue(key: string, value: string): Promise<DroiError> {
        return null;
    }

    removeValue(key: string): Promise<DroiError> {
        return null;
    }
}