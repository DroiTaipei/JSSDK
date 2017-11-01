import { DroiError } from "./droi-error";
import { DroiObject } from "./droi-object";
import { MultimapEntry, Multimap } from "./droi-multimap"

export interface DroiDataProvider {
    createTable( tableName: string ): boolean;
    upsert( commands: Multimap<string, any> ): DroiError;
    query( commands: Multimap<string, any>, error: DroiError ): Array<DroiObject>;
    updateData( commands: Multimap<string, any> ): DroiError;
    delete( commands: Multimap<string, any> ): DroiError;    
}