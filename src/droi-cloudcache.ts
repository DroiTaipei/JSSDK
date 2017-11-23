import { DroiError } from "./droi-error";
import { RestCloudCache } from "./rest/cloudcache";

export class DroiCloudCache {
    static getValue(key: string): Promise<string> {
        return RestCloudCache.instance().get(key);
    }

    static setValue(key: string, value: string, ttl?: number): Promise<DroiError> {
        return RestCloudCache.instance().set(key, value, ttl);
    }

    static removeValue(key: string): Promise<DroiError> {
        return RestCloudCache.instance().remove(key);
    }
}