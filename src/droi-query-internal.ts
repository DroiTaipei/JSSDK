import { DroiError } from "./droi-error";
import { DroiObject } from "./droi-object";
import { DroiQuery } from "./droi-query";
import { DroiConstant } from './droi-const';


class DroiQueryInternal extends DroiQuery {
    static create( tableName : string ) : DroiQueryInternal {
        return new DroiQueryInternal( tableName );
    }

    upsert( droiObject:DroiObject ) : Promise<DroiError> {
        this.queryCommand.put( DroiConstant.DroiQuery_INSERT, [droiObject] );
        return ;
    }

    delete( droiObject:DroiObject ) : Promise<DroiError> {
        this.queryCommand.put( DroiConstant.DroiQuery_DELETE, [droiObject] );
        return;
    }
}


export { DroiQueryInternal }