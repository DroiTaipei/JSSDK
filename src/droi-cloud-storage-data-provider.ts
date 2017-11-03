import { DroiError } from "./droi-error";
import { DroiObject } from "./droi-object";
import { MultimapEntry, Multimap } from "./droi-multimap"
import { DroiCallback, DroiSingleCallback } from "./droi-callback";
import { DroiDataProvider } from "./droi-data-provider";


class CloudStorageDataProvider implements DroiDataProvider {

    upsert( commands: Multimap<string, any> ): Promise<DroiError> {
        return null;
    }
    
    query( commands: Multimap<string, any> ): Promise<DroiCallback<Array<DroiObject>>> {
        return null;
    }

    updateData( commands: Multimap<string, any> ): Promise<DroiError> {
        return null;
    }
    
    delete( commands: Multimap<string, any> ): Promise<DroiError> {
        return null;
    }

    private static instance : CloudStorageDataProvider;
    static create() : CloudStorageDataProvider {
        if ( CloudStorageDataProvider.instance == null )
            CloudStorageDataProvider.instance = new CloudStorageDataProvider();

        return CloudStorageDataProvider.instance;
    }
}


export { CloudStorageDataProvider }