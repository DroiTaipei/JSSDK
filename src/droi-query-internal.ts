import { DroiError } from "./droi-error";
import { DroiObject } from "./droi-object";
import { DroiQuery } from "./droi-query";
import { DroiConstant } from './droi-const';


class DroiQueryInternal extends DroiQuery {
    static create( tableName : string ) : DroiQueryInternal {
        return new DroiQueryInternal( tableName );
    }

    static upsert( droiObject:DroiObject ) : DroiQueryInternal {
        let query = new DroiQueryInternal( droiObject.tableName() )
        query.queryCommand.put( DroiConstant.DroiQuery_INSERT, [droiObject] );
        return query;
    }

    static delete( droiObject:DroiObject ) : DroiQueryInternal {
        let query = new DroiQueryInternal( droiObject.tableName() )
        query.queryCommand.put( DroiConstant.DroiQuery_DELETE, [droiObject] );
        return query;
    }

    static updateData( droiObject:DroiObject ) : DroiQueryInternal {
        let query = new DroiQueryInternal( droiObject.tableName() )
        query.queryCommand.put( DroiConstant.DroiQuery_UPDATE_DATA, [droiObject] );
        return query;
    }
}


export { DroiQueryInternal }