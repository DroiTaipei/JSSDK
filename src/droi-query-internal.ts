import { DroiError } from "./droi-error";
import { DroiObject } from "./droi-object";
import { DroiQuery } from "./droi-query";
import { DroiConstant } from './droi-const';


class DroiQueryInternal extends DroiQuery {
    static create( tableName : string ) : DroiQueryInternal {
        return new DroiQueryInternal( tableName );
    }

    // Duplicate for create DroiQueryInternal instance (for atomic api)
    static updateData( tableName : string ) : DroiQueryInternal {
        let query = new DroiQueryInternal( tableName )
        query.queryCommand.put( DroiConstant.DroiQuery_UPDATE_DATA, 0 );
        query.queryCommand.remove( DroiConstant.DroiQuery_SELECT );
        query.queryCommand.put( DroiConstant.DroiQuery_TABLE_NAME, tableName );
        return query;
    }

    static upsert( droiObject:DroiObject ) : DroiQueryInternal {
        let query = new DroiQueryInternal( droiObject.tableName() )
        query.queryCommand.put( DroiConstant.DroiQuery_INSERT, [droiObject] );
        query.queryCommand.remove( DroiConstant.DroiQuery_SELECT );
        query.queryCommand.put( DroiConstant.DroiQuery_TABLE_NAME, droiObject.tableName() );
        return query;
    }

    static delete( droiObject:DroiObject ) : DroiQueryInternal {
        let query = new DroiQueryInternal( droiObject.tableName() )
        query.queryCommand.put( DroiConstant.DroiQuery_DELETE, [droiObject] );
        query.queryCommand.remove( DroiConstant.DroiQuery_SELECT );
        query.queryCommand.put( DroiConstant.DroiQuery_TABLE_NAME, droiObject.tableName() );
        return query;
    }

    atomic( droiObject:DroiObject ): DroiQueryInternal {
        this.queryCommand.put( DroiConstant.DroiQuery_ATOMIC, droiObject );
        return this;
    }
}


export { DroiQueryInternal }