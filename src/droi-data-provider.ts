import { DroiError } from "./droi-error";
import { DroiObject } from "./droi-object";
import { MultimapEntry, Multimap } from "./droi-multimap"
import { DroiCallback, DroiSingleCallback } from "./droi-callback";

export interface DroiDataProvider {
    upsert( commands: Multimap<string, any> ): Promise<DroiError>;
    query( commands: Multimap<string, any> ): Promise<DroiCallback<Array<DroiObject>>>;
    updateData( commands: Multimap<string, any> ): Promise<DroiError>;
    delete( commands: Multimap<string, any> ): Promise<DroiError>;    
}